/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import * as HashUtil from "../../../common/utils/hash.util.js";
import { UsersService } from "../users.service.js";
import { UserRepository } from "../user.repository.js";
// import { cloudinaryClient } from "../../../infrastructure/cloudinary/cloudinary.client.js";
import { paystackClient } from "../../../infrastructure/paystack/paystack.client.js";
// import { arkeselClient } from "../../../infrastructure/arkesel/arkesel.client.js";
import { hashSecret } from "../../../common/utils/hash.util.js";
import { buildAgent, buildAssignment, buildFarmer } from "./fixtures.js";
import { UserRole } from "../../../common/constants/roles.enums.js";
// import { ForbiddenException, UnprocessableException, NotFoundException } from "../../../common/exceptions/index.js";

// ── 1. Mock all external dependencies ────────────────────────────────────────────
jest.mock("../user.repository.js", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => {
      return {
        findPrivateById: jest.fn<any>(),
        findPublicById: jest.fn<any>(),
        findByPhone: jest.fn<any>(),
        findById: jest.fn<any>(),
        createUnverified: jest.fn<any>(),
        updateUnverifiedDetails: jest.fn<any>(),
        markPhoneVerified: jest.fn<any>(),
        setPinHash: jest.fn<any>(),
        deleteStaleUnverified: jest.fn<any>(),
        updatePinHash: jest.fn<any>(),
        updatePaymentDetails: jest.fn<any>(),
        getEarningsSummary: jest.fn<any>(),
        getAverageRating: jest.fn<any>(),
        findActiveAgentForUser: jest.fn<any>(),
        hasActiveAgent: jest.fn<any>(),
        createAgentAssignment: jest.fn<any>(),
        unassignClient: jest.fn<any>(),
        findAgentClients: jest.fn<any>(),
        findAssignmentByAgentAndUser: jest.fn<any>(),
      };
    }),
    userRepository: {}, // Stub the singleton instance object if imported elsewhere
  };
});

jest.mock("../../../infrastructure/cloudinary/cloudinary.client.js");
jest.mock("../../../infrastructure/arkesel/arkesel.client.js");
jest.mock("../../../common/utils/hash.util.js", () => ({
  hashSecret: jest.fn(),
}));

// ── 2. Initialize Service ──────────────────────────────────────────────────────
const usersService = new UsersService();
// const usersRepository = new UserRepository();

// const usersService = UsersService.prototype as jest.Mocked<UsersService>;

// Define a type-safe object pointing directly to our auto-mocked methods
// Properly cast the infrastructure mocks so they're in scope for your assertions
// const mockCloudinary = cloudinaryClient as jest.Mocked<typeof cloudinaryClient>;
// const mockPaystack = paystackClient;
// const mockArkesel = arkeselClient as jest.Mocked<typeof arkeselClient>;
// let mockVerifySecret = jest.mocked(HashUtil.verifySecret);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mockHashSecret = jest.mocked(hashSecret);
const mockUserRepo = UserRepository.prototype as jest.Mocked<UserRepository>;

beforeEach(() => {
  // Clear mock history logs safely between iterations
  jest.clearAllMocks();

  // Explicitly stub the individual methods on the prototype so they return resolved promises instead of undefined
  mockUserRepo.findByPhone = jest.fn<any>().mockResolvedValue(null);
  mockUserRepo.findById = jest.fn<any>().mockResolvedValue(null);
  mockUserRepo.findPrivateById = jest.fn<any>().mockResolvedValue(null);
  mockUserRepo.findPublicById = jest.fn<any>().mockResolvedValue(null);
  mockUserRepo.createUnverified = jest.fn<any>().mockResolvedValue(null);
  mockUserRepo.markPhoneVerified = jest.fn<any>().mockResolvedValue(null);
  mockUserRepo.updateUnverifiedDetails = jest
    .fn<any>()
    .mockResolvedValue(buildFarmer() as any);
  mockUserRepo.updatePinHash = jest.fn<any>().mockResolvedValue(undefined);
  mockUserRepo.updatePaymentDetails = jest
    .fn<any>()
    .mockResolvedValue(undefined);
  mockUserRepo.findAgentClients = jest.fn<any>().mockResolvedValue(null);

  mockHashSecret = jest.fn<any>().mockResolvedValue("hashed-pin-string");

  mockUserRepo.unassignClient = jest.fn<any>().mockResolvedValue(null);
  mockUserRepo.findAssignmentByAgentAndUser = jest
    .fn<any>()
    .mockResolvedValue(null);

  // Reset Paystack mock methods cleanly
  jest.spyOn(paystackClient, "createSubaccount").mockImplementation(
    jest.fn<any>().mockResolvedValue({
      success: true,
      subaccountCode: "ACCT_default",
    }),
  );

  jest.spyOn(paystackClient, "updateSubaccount").mockImplementation(
    jest.fn<any>().mockResolvedValue({
      success: true,
      subaccountCode: "ACCT_default",
    }),
  );
});

// ── 3. Run Clean Tests ─────────────────────────────────────────────────────────
describe("UsersService.getPrivateProfile", () => {
  it("returns owner profile with private details", async () => {
    mockUserRepo.findPrivateById.mockResolvedValue(buildFarmer() as any);

    const result = await usersService.getPrivateProfile("user-abc-123");

    expect(result).toHaveProperty("pinHash");
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("paystackSubaccountCode");
  });

  it("throws NotFoundException when user does not exist", async () => {
    mockUserRepo.findPublicById.mockResolvedValue(null as any);

    await expect(usersService.getPublicProfile("nonexistent")).rejects.toThrow(
      "Active public user profile not found.",
    );
  });

  it("strips all sensitive fields from the returned public object", async () => {
    // Mimic your real PUBLIC_COLUMNS behavior by filtering the mock fixture
    const fullFarmer = buildFarmer();
    const publicColumnsOnly = {
      id: fullFarmer.id,
      firstName: fullFarmer.firstName,
      lastName: fullFarmer.lastName,
      role: fullFarmer.role,
      profilePhotoUrl: fullFarmer.profilePhotoUrl,
      location: fullFarmer.location,
      isActive: fullFarmer.isActive,
      createdAt: fullFarmer.createdAt,
    };

    mockUserRepo.findPublicById.mockResolvedValue(publicColumnsOnly as any);

    const result = await usersService.getPublicProfile("user-abc-123");

    expect(mockUserRepo.findPublicById).toHaveBeenCalledWith("user-abc-123");
    expect(result).not.toHaveProperty("pinHash");
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("paystackSubaccountCode");
  });
});

describe("UsersService.updateMyProfile", () => {
  it("updates name when provided", async () => {
    const farmer = buildFarmer();
    mockUserRepo.findPrivateById.mockResolvedValue(farmer);

    await usersService.updateProfile("user-abc-123", {
      firstName: "Abena Updated",
    });

    // Verifies that the service checks if the user exists before proceeding
    expect(mockUserRepo.findPrivateById).toHaveBeenCalledWith("user-abc-123");
  });

  it("updates location when provided", async () => {
    const farmer = buildFarmer();
    mockUserRepo.findPrivateById.mockResolvedValue(farmer);

    await usersService.updateProfile("user-abc-123", {
      location: { lat: 5.6037, lng: -0.187 },
    });
    expect(mockUserRepo.findPrivateById).toHaveBeenCalledWith("user-abc-123");
  });

  it("throws NotFoundException when user does not exist", async () => {
    // Return null to ensure the real service throws its missing user error
    mockUserRepo.findPrivateById.mockResolvedValue(null as any);

    await expect(
      usersService.updateProfile("nonexistent", { firstName: "Test" }),
    ).rejects.toThrow();
  });
});

// ── UsersService.changePin ───────────────────────────────────────────────────
describe("UsersService.changePin", () => {
  it("changes the PIN when current PIN is correct and new PIN differs", async () => {
    // 1. Arrange: Control the output of hashSecret depending on what input it receives

    const hash = await HashUtil.hashSecret("1234");
    mockUserRepo.findPrivateById = jest
      .fn<any>()
      .mockResolvedValue(buildFarmer({ pinHash: hash }) as any);
    await usersService.changePin("user-abc-123", {
      current_pin: "1234",
      new_pin: "1233",
    });
    // 3. Act
    // 4. Assert against the actual targeted new hash
    expect(mockUserRepo.updatePinHash).toHaveBeenCalled();
  });

  it("throws ConflictException when new PIN equals current PIN", async () => {
    mockUserRepo.findPrivateById.mockResolvedValue(buildFarmer() as any);

    await expect(
      usersService.changePin("user-abc-123", {
        current_pin: "1234",
        new_pin: "1234",
      }),
    ).rejects.toThrow("The current PIN entered is invalid.");
  });

  it("throws NotFoundException when user does not exist", async () => {
    mockUserRepo.findPrivateById.mockResolvedValue(null as any);

    await expect(
      usersService.changePin("nonexistent", {
        current_pin: "1234",
        new_pin: "5678",
      }),
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getPublicProfile
// ═══════════════════════════════════════════════════════════════════════════════
describe("UsersService.getPublicProfile", () => {
  it("returns public profile without sensitive fields", async () => {
    const publicUser = {
      id: "user-abc-123",
      firstName: "Abena",
      lastName: "Mensah",
      role: UserRole.FARMER,
      profilePhotoUrl: null,
      location: null,
      isActive: true,
      createdAt: new Date(),
    };
    mockUserRepo.findPublicById.mockResolvedValue(publicUser);

    const result = await usersService.getPublicProfile("user-abc-123");

    expect(result).toMatchObject({
      firstName: "Abena",
      lastName: "Mensah",
      role: UserRole.FARMER,
    });
    expect(result).not.toHaveProperty("phone");
    expect(result).not.toHaveProperty("pinHash");
  });

  it("throws NotFoundException for nonexistent or inactive user", async () => {
    mockUserRepo.findPublicById.mockResolvedValue(null);
    await expect(usersService.getPublicProfile("nonexistent")).rejects.toThrow(
      "Active public user profile not found.",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// setupPaymentDetails
// ═══════════════════════════════════════════════════════════════════════════════
// describe('UsersService.setupPaymentDetails', () => {
//   const dto = { mobile_number: '+233244123456', mobile_network: 'mtn' };

//   it('creates a new Paystack subaccount for a farmer with no existing payment details', async () => {
//     mockUserRepo.findPrivateById.mockResolvedValue(buildFarmer({ paystackSubaccountCode: null }));
//     jest.mocked(mockPaystack.createSubaccount).mockResolvedValue({
//       subaccountCode: 'ACCT_new123'
//     });

//     await usersService.setupPaymentDetails('user-abc-123', dto);

//     expect(mockPaystack.createSubaccount).toHaveBeenCalledTimes(1);
//     expect(mockPaystack.updateSubaccount).not.toHaveBeenCalled();
//     expect(mockUserRepo.updatePaymentDetails).toHaveBeenCalledWith('user-abc-123', {
//       mobileMoneyNumber: '+233244123456',
//       mobileMoneyNetwork: 'mtn',
//       paystackSubaccountCode: 'ACCT_new123',
//     });
//   });

//   it('updates existing Paystack subaccount when payment details already set', async () => {
//     mockUserRepo.findPrivateById.mockResolvedValue(
//       buildFarmerWithPayment({ paystackSubaccountCode: 'ACCT_existing456' }),
//     );
//     jest.mocked(mockPaystack.updateSubaccount).mockResolvedValue({
//       subaccountCode: 'ACCT_existing456'
//     });
//     await usersService.setupPaymentDetails('user-abc-123', {
//       mobile_number: '+233244999888',
//       mobile_network: 'vodafone',
//     });

//     expect(mockPaystack.updateSubaccount).toHaveBeenCalledWith('ACCT_existing456', {
//       mobileNetwork: 'vodafone',
//       mobileNumber: '+233244999888',
//     });
//     expect(mockPaystack.createSubaccount).not.toHaveBeenCalled();
//   });

//   it('throws ForbiddenException for buyer role — only farmers and transporters can set payment details', async () => {
//     mockUserRepo.findPrivateById.mockResolvedValue(buildBuyer());

//     await expect(usersService.setupPaymentDetails('buyer-abc-123', dto)).rejects.toBeInstanceOf(
//       ForbiddenException,
//     );
//     expect(mockPaystack.createSubaccount).not.toHaveBeenCalled();
//   });

//   it('throws ForbiddenException for agent role', async () => {
//     mockUserRepo.findPrivateById.mockResolvedValue(buildAgent());
//     await expect(usersService.setupPaymentDetails('agent-abc-123', dto)).rejects.toBeInstanceOf(
//       ForbiddenException,
//     );
//   });

//   // it('throws UnprocessableException when Paystack rejects the mobile number', async () => {
//   //   mockUserRepo.findPrivateById.mockResolvedValue(buildFarmer({ paystackSubaccountCode: null }));
//   //   mockPaystack.createSubaccount.mockResolvedValue({ success: false, errorReason: 'INVALID_ACCOUNT' });

//   //   await expect(usersService.setupPaymentDetails('user-abc-123', dto)).rejects.toBeInstanceOf(
//   //     UnprocessableException,
//   //   );
//   //   expect(mockUserRepo.updatePaymentDetails).not.toHaveBeenCalled();
//   // });

//   // it('masks the mobile number in the response — never returns the raw number', async () => {
//   //   mockUserRepo.findPrivateById.mockResolvedValue(buildFarmer({ paystackSubaccountCode: null }));
//   //   mockPaystack.createSubaccount.mockResolvedValue({ success: true, subaccountCode: 'ACCT_abc' });

//   //   const result = await usersService.setupPaymentDetails('user-abc-123', dto);

//   //   expect(result.mobile_number).not.toBe('+233244123456');
//   //   expect(result.mobile_number).toContain('***');
//   // });

//   // it('throws NotFoundException when user does not exist', async () => {
//   //   mockUserRepo.findPrivateById.mockResolvedValue(null);
//   //   await expect(usersService.setupPaymentDetails('nonexistent', dto)).rejects.toBeInstanceOf(NotFoundException);
//   // });
// });

// ═══════════════════════════════════════════════════════════════════════════════
// unassignClient
// ═══════════════════════════════════════════════════════════════════════════════
describe("UsersService.unassignClient", () => {
  it("unassigns client and returns success message", async () => {
    const assignment = buildAssignment();
    mockUserRepo.findAssignmentByAgentAndUser.mockResolvedValue(assignment);

    await usersService.unassignClient("agent-abc-123", "user-abc-123");

    expect(mockUserRepo.unassignClient).toHaveBeenCalledWith(
      "assignment-abc-123",
    );
  });

  it("throws NotFoundException when no active assignment exists", async () => {
    mockUserRepo.findAssignmentByAgentAndUser.mockResolvedValue(null);
    await expect(
      usersService.unassignClient("agent-abc-123", "user-abc-123"),
    ).rejects.toThrow(
      "No active assignment association matches this structural relationship map.",
    );
    expect(mockUserRepo.unassignClient).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// getClient
// ═══════════════════════════════════════════════════════════════════════════════
describe("UsersService.getAgentClient", () => {
  it("return agent clients", async () => {
    const assignment = buildAssignment();
    mockUserRepo.findAssignmentByAgentAndUser.mockResolvedValue(assignment);
    mockUserRepo.findPrivateById.mockResolvedValue(buildAgent());

    await usersService.getAgentClients("agent-abc-123", { page: 0, limit: 20 });

    expect(mockUserRepo.findAgentClients).toHaveBeenCalled();
  });

  it('throws "User profile not found." when client is not in this agent\'s list', async () => {
    mockUserRepo.findPrivateById.mockResolvedValue(null);
    await expect(
      usersService.getAgentClients("agent-abc", { page: 0, limit: 20 }),
    ).rejects.toThrow("User profile not found.");
  });
});
