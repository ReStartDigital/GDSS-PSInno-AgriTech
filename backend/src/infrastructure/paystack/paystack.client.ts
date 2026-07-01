import axios, { type AxiosInstance } from "axios";
import { logError, logger } from "../../common/utils/logger.js";

/**
 * Maps VegeLink's mobile network names to Paystack's bank codes
 * for mobile money settlement accounts in Ghana.
 */
export const MOBILE_NETWORK_TO_PAYSTACK_BANK: Record<string, string> = {
  mtn: "MTN",
  vodafone: "VDF",
  airteltigo: "ATL",
};

export const SUPPORTED_MOBILE_NETWORKS = Object.keys(
  MOBILE_NETWORK_TO_PAYSTACK_BANK,
);

export interface PaystackSubaccountResult {
  success: boolean;
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
  async createSubaccount(params: {
    businessName: string;
    mobileNetwork: string;
    mobileNumber: string;
  }): Promise<PaystackSubaccountResult> {
    const bankCode = MOBILE_NETWORK_TO_PAYSTACK_BANK[params.mobileNetwork];
    if (!bankCode) {
      return { success: false, errorReason: "UNSUPPORTED_NETWORK" };
    }

    // Strip country code from the MoMo number — Paystack expects local format
    // e.g. 0244123456 not +233244123456
    const localNumber = params.mobileNumber.replace(/^\+233/, "0");

    try {
      const response = await this.http.post("/subaccount", {
        business_name: params.businessName,
        settlement_bank: bankCode,
        account_number: localNumber,
        // percentage_charge: 0 — VegeLink controls the split config dynamically
        // per order; we do not want a blanket % auto-deducted by Paystack on
        // every settlement.
        percentage_charge: 0,
        description: `VegeLink ${params.mobileNetwork.toUpperCase()} account`,
      });

      if (!response.data?.status || !response.data?.data?.subaccount_code) {
        logger.warn("Paystack subaccount creation returned unexpected shape", {
          body: response.data,
        });
        return { success: false, errorReason: "UNEXPECTED_RESPONSE" };
      }

      return {
        success: true,
        subaccountCode: response.data.data.subaccount_code,
      };
    } catch (error) {
      logError("Paystack subaccount creation failed", error, {
        mobile: params.mobileNumber,
      });
      return { success: false, errorReason: "NETWORK_ERROR" };
    }
  }

  /**
   * Updates an existing subaccount — used when a user changes their MoMo number.
   */
  async updateSubaccount(
    subaccountCode: string,
    params: { mobileNetwork: string; mobileNumber: string },
  ): Promise<PaystackSubaccountResult> {
    const bankCode = MOBILE_NETWORK_TO_PAYSTACK_BANK[params.mobileNetwork];
    if (!bankCode) {
      return { success: false, errorReason: "UNSUPPORTED_NETWORK" };
    }

    const localNumber = params.mobileNumber.replace(/^\+233/, "0");

    try {
      const response = await this.http.put(`/subaccount/${subaccountCode}`, {
        settlement_bank: bankCode,
        account_number: localNumber,
      });

      if (!response.data?.status) {
        return { success: false, errorReason: "UNEXPECTED_RESPONSE" };
      }

      return { success: true, subaccountCode };
    } catch (error) {
      logError("Paystack subaccount update failed", error, { subaccountCode });
      return { success: false, errorReason: "NETWORK_ERROR" };
    }
  }
}

export const paystackClient = new PaystackClient();
