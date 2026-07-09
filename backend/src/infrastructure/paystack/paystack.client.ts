import axios, { type AxiosInstance } from "axios";
import { logError } from "../../common/utils/logger.js";
import { AppException } from "../../common/exceptions/app.exceptions.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";

/**
 * Maps VegeLink's mobile network names to Paystack's bank codes
 * for mobile money settlement accounts in Ghana.
 */
export const MOBILE_NETWORK_TO_PAYSTACK_BANK: Record<string, number> = {
  mtn: 67,
  vodafone: 66,
  airteltigo: 68,
};

export const SUPPORTED_MOBILE_NETWORKS = Object.keys(
  MOBILE_NETWORK_TO_PAYSTACK_BANK,
);

interface CreateSubaccountPayload {
  business_name: string;
  //   settlement_bank: string; // e.g., "MTN", "VODAFONE", "AIRTEL_TIGO"
  account_number: string; // The MoMo Phone Number
  //   percentage_charge: number; // 0 for giving them 100% of th/eir cut minus processing fees
  primary_contact_email: string; // The virtual email we generate
  mobileNetwork: string;
}

export interface PaystackSubaccountResult {
  subaccountCode?: string;
  errorReason?: string;
}

class PaystackClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: "https://api.paystack.co",
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || ""}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Creates a Paystack subaccount tied to the user's mobile money number.
   * Called once at payment-details setup. The returned subaccount_code is
   * stored on the user record and included in split payment configs.
   */
  async createSubaccount(
    payload: CreateSubaccountPayload,
  ): Promise<PaystackSubaccountResult> {
    const bankCode =
      MOBILE_NETWORK_TO_PAYSTACK_BANK[payload.mobileNetwork.toLowerCase()];
    if (!bankCode) {
      throw new AppException(
        400,
        ErrorCode.UNSUPPORTED_MOBILE_NETWORK,
        "Unsupported mobile money provider network.",
      );
    }

    // Strip country code from the MoMo number — Paystack expects local format
    // e.g. 0244123456 not +233244123456
    const localNumber = payload.account_number.replace(/^\+233/, "0");

    try {
      const response = await this.http.post("/subaccount", {
        business_name: payload.business_name,
        settlement_bank: bankCode,
        account_number: localNumber,
        currency: "GHS",
        country: "GH",
        percentage_charge: 0,
        primary_contact_email: payload.primary_contact_email,
        description: `VegeLink ${payload.mobileNetwork.toUpperCase()} payout route`,
      });

      if (response.data?.status && response.data?.data) {
        return {
          subaccountCode: response.data.data.subaccount_code,
        };
      }

      throw new Error(
        response.data?.message ||
          "Invalid registration payload from paystack routing.",
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(error.response.data)
      throw new AppException(
        422,
        ErrorCode.PAYSTACK_SUBACCOUNT_FAILED,
        error.response?.data?.message ||
          error.message ||
          "Failed to register vendor subaccount configuration.",
      );
    }
  }

  /**
   * Updates an existing subaccount — used when a user changes their MoMo number.
   */
  async updateSubaccount(
    subaccountCode: string,
    params: { mobileNetwork: string; mobileNumber: string },
  ): Promise<PaystackSubaccountResult> {
    const bankCode =
      MOBILE_NETWORK_TO_PAYSTACK_BANK[params.mobileNetwork.toLowerCase()];
    if (!bankCode) {
      throw new AppException(
        400,
        ErrorCode.UNSUPPORTED_MOBILE_NETWORK,
        "Unsupported mobile money provider network.",
      );
    }

    const localNumber = params.mobileNumber.replace(/^\+233/, "0");

    try {
      const response = await this.http.put(`/subaccount/${subaccountCode}`, {
        settlement_bank: bankCode,
        account_number: localNumber,
      });

      if (response.data?.status && response.data?.data) {
        return { subaccountCode };
      }

      throw new Error(
        response.data?.message || "Failed up-stream subaccount data patch.",
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logError("Paystack subaccount update failed", error, { subaccountCode });
      throw new AppException(
        422,
        ErrorCode.PAYSTACK_SUBACCOUNT_FAILED,
        error.response?.data?.message ||
          error.message ||
          "Failed to update vendor subaccount data mapping.",
      );
    }
  }
}

export const paystackClient = new PaystackClient();
