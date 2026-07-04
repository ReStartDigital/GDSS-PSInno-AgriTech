import { type UserRepository, userRepository } from "./user.repository.js";
import { cloudinaryClient } from "../../infrastructure/cloudinary/cloudinary.client.js";
import { paystackClient } from "../../infrastructure/paystack/paystack.client.js";
import { UserRole } from "../../common/constants/roles.enums.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  UnprocessableException,
} from "../../common/exceptions/index.js";
import type {
  UpdateProfileDto,
  ChangePinDto,
  PaymentDetailsDto,
  RegisterClientDto,
  PaginationDto,
} from "./users.schemas.js";
import * as HashUtil from "../../common/utils/hash.util.js";
import type { PaginatedResult } from "../../common/utils/paginate.util.js";
import type { User } from "../../database/entities/User.js";
import crypto from "crypto";

const VIRTUAL_EMAIL_DOMAIN = process.env.VIRTUAL_EMAIL_DOMAIN || "vegelink.app";

/** Roles allowed to set up automated Paystack split settlement payout accounts */
const PAYMENT_ELIGIBLE_ROLES: UserRole[] = [
  UserRole.FARMER,
  UserRole.TRANSPORTER,
];

export class UsersService {
  private repo: UserRepository;
  private cloudinary: typeof cloudinaryClient;
  private paystack: typeof paystackClient;

  constructor() {
    this.repo = userRepository;
    this.cloudinary = cloudinaryClient;
    this.paystack = paystackClient;
  }

  /**
   * Helper to securely hash numerical PIN combinations
   */
  private hashPin(pin: string): string {
    return crypto.createHash("sha256").update(pin).digest("hex");
  }

  /**
   * Fetches a full private user profile (typically requested by the owner)
   */
  async getPrivateProfile(userId: string): Promise<User> {
    const user = await this.repo.findPrivateById(userId);
    if (!user) {
      throw new NotFoundException(
        "User profile not found.",
        ErrorCode.USER_NOT_FOUND,
      );
    }
    return user;
  }

  /**
   * Fetches an open public profile (stripped of critical PII)
   */
  async getPublicProfile(userId: string): Promise<Partial<User>> {
    const user = await this.repo.findPublicById(userId);
    if (!user) {
      throw new NotFoundException(
        "Active public user profile not found.",
        ErrorCode.USER_NOT_FOUND,
      );
    }
    return user;
  }

  /**
   * Patch mutation logic for profile details
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getPrivateProfile(userId);

    const updatePayload: Partial<User> = {};
    if (dto.firstName !== undefined) updatePayload.firstName = dto.firstName;
    if (dto.middleName !== undefined) updatePayload.middleName = dto.middleName;
    if (dto.lastName !== undefined) updatePayload.lastName = dto.lastName;

    if (dto.location !== undefined) {
      updatePayload.location = {
        type: "Point",
        coordinates: [dto.location.lng, dto.location.lat] as const,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.repo.updateUnverifiedDetails(user.id, updatePayload as any);
    return this.getPrivateProfile(user.id);
  }

  /**
   * Securely replaces a user's login access credentials
   */
  async changePin(userId: string, dto: ChangePinDto): Promise<void> {
    const user = await this.getPrivateProfile(userId);

    const isVerified = await HashUtil.verifySecret(
      dto.current_pin,
      user.pinHash ?? "",
    );
    if (!isVerified) {
      throw new UnauthorizedException(
        "The current PIN entered is invalid.",
        ErrorCode.INVALID_OLD_PIN,
      );
    }

    const newHash = await HashUtil.hashSecret(dto.new_pin);
    await this.repo.updatePinHash(user.id, newHash);
  }

  /**
   * Processes a profile image buffer upload and binds the resulting asset URL to the User record
   */
  async uploadProfilePhoto(
    userId: string,
    fileBuffer: Buffer,
  ): Promise<{ profilePhotoUrl: string }> {
    const user = await this.getPrivateProfile(userId);

    // Push asset buffer to Cloudinary
    const folderPath = `vegelink/profiles/${user.role}s`;
    const uploadResult = await this.cloudinary.uploadBuffer(
      fileBuffer,
      folderPath,
      user.id,
    );

    // Bind URL path to table row
    await this.repo.updateUnverifiedDetails(user.id, {
      profilePhotoUrl: uploadResult.url,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return { profilePhotoUrl: uploadResult.url };
  }

  /**
   * Provisions a dedicated split financial merchant settlement subaccount with Paystack
   */
  async setupPaymentDetails(
    userId: string,
    dto: PaymentDetailsDto,
  ): Promise<void> {
    const user = await this.getPrivateProfile(userId);

    // 1. Authorization guardrail check
    if (!PAYMENT_ELIGIBLE_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        "Only farmers and transporters can provision merchant payment configurations.",
        ErrorCode.PAYMENT_DETAILS_ROLE_FORBIDDEN,
      );
    }

    // 2. Prevent overriding existing setups
    // if (user.paymentDetailsSet) {
    //   throw new ConflictException(
    //     "Financial distribution channel records are already established for this profile.",
    //     ErrorCode.PAYMENT_DETAILS_ALREADY_SET,
    //   );
    // }

    let subaccountCode: string = user.paystackSubaccountCode || "";

    if (subaccountCode) {
      // route to updateSubaccount infrastructure method
      const updateResult = await this.paystack.updateSubaccount(
        subaccountCode,
        {
          mobileNetwork: dto.mobile_network,
          mobileNumber: dto.mobile_number,
        },
      );

      subaccountCode = updateResult.subaccountCode ?? subaccountCode;
    } else {
      // Generate virtual fallback routing email identifier
      const merchantEmail = user.email || `${user.id}@${VIRTUAL_EMAIL_DOMAIN}`;
      const businessName = `${user.firstName} ${user.lastName} (${user.role.toUpperCase()})`;

      // 3. Request Paystack infrastructure onboarding slot
      const paystackResult = await this.paystack.createSubaccount({
        business_name: businessName,
        account_number: dto.mobile_number,
        mobileNetwork: dto.mobile_network,
        primary_contact_email: merchantEmail,
      });

      if (!paystackResult.subaccountCode) {
        throw new UnprocessableException(
          "Paystack did not return a valid subaccount code configuration.",
          ErrorCode.PAYMENT_INITIALIZATION_FAILED,
        );
      }
      subaccountCode = paystackResult.subaccountCode;
    }
    // 4. Update core local storage layer on successfully resolved payload configurations
    await this.repo.updatePaymentDetails(user.id, {
      mobileMoneyNumber: dto.mobile_number,
      mobileMoneyNetwork: dto.mobile_network,
      paystackSubaccountCode: subaccountCode,
    });
  }

  /**
   * Fetches summary performance metrics (integrated across orders and transactions)
   */
  async getEarningsSummary(userId: string) {
    const user = await this.getPrivateProfile(userId);
    if (!PAYMENT_ELIGIBLE_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        "Earnings metrics summaries are only available to functional operators.",
        ErrorCode.FORBIDDEN,
      );
    }
    return this.repo.getEarningsSummary(user.id);
  }

  // ── AGENT ACTIONS ─────────────────────────────────────────────────────────

  /**
   * Registers a client entity underneath an Agent's administrative proxy domain link
   */
  async registerClient(agentId: string, dto: RegisterClientDto): Promise<User> {
    const agent = await this.getPrivateProfile(agentId);
    if (agent.role !== UserRole.AGENT) {
      throw new ForbiddenException(
        "Only profiles holding active Agent clear levels can register clients.",
        ErrorCode.NOT_AN_AGENT,
      );
    }

    // Prevent a tracking map loop onto oneself
    const existingUser = await this.repo.findByPhone(dto.phone);
    if (existingUser) {
      if (existingUser.id === agentId) {
        throw new ConflictException(
          "An agent cannot assign their own profile credentials as a managed client.",
          ErrorCode.CANNOT_ASSIGN_SELF,
        );
      }

      // Look for a conflicting active mapping link path context
      const activeAgent = await this.repo.hasActiveAgent(existingUser.id);
      if (activeAgent) {
        throw new ConflictException(
          "This target client is already linked under an active agent assignment tracking card.",
          ErrorCode.ALREADY_HAS_ACTIVE_AGENT,
        );
      }

      throw new ConflictException(
        "A client profile referencing this telephone footprint already exists.",
        ErrorCode.CLIENT_ALREADY_REGISTERED,
      );
    }

    // Synthesize a secure communications bridge proxy string
    const syntheticEmail = `proxy_${dto.phone.replace("+", "")}@${VIRTUAL_EMAIL_DOMAIN}`;
    const locationGeo = dto.location
      ? {
          type: "Point" as const,
          coordinates: [dto.location.lng, dto.location.lat] as [number, number],
        }
      : null;

    // Step 1: Create client matrix profile row record
    const newClient = await this.repo.createUnverified({
      phone: dto.phone,
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      role: dto.role as UserRole,
      email: syntheticEmail,
      location: locationGeo,
    });

    // Step 2: Establish assignment ownership linkage map
    await this.repo.createAgentAssignment(agent.id, newClient.id);

    return this.getPrivateProfile(newClient.id);
  }

  /**
   * Lists clients managed by a specific Agent
   */
  async getAgentClients(
    agentId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<User>> {
    const agent = await this.getPrivateProfile(agentId);
    if (agent.role !== UserRole.AGENT) {
      throw new ForbiddenException(
        "Only active tracking agents can read client vectors.",
        ErrorCode.NOT_AN_AGENT,
      );
    }
    return this.repo.findAgentClients(agent.id, pagination);
  }

  /**
   * Unlinks a client from an Agent's management list
   */
  async unassignClient(agentId: string, clientId: string): Promise<void> {
    const assignment = await this.repo.findAssignmentByAgentAndUser(
      agentId,
      clientId,
    );
    if (!assignment) {
      throw new NotFoundException(
        "No active assignment association matches this structural relationship map.",
        ErrorCode.CLIENT_NOT_ASSIGNED_TO_AGENT,
      );
    }

    await this.repo.unassignClient(assignment.id);
  }
}

export const usersService = new UsersService();
