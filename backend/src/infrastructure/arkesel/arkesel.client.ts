import axios, { type AxiosInstance } from "axios";
import { logger, logError } from "../../common/utils/logger.js";

const ARKESEL_BASE_URL = "https://sms.arkesel.com/api";

export interface ArkeselSendResult {
  success: boolean;
  messageId?: string;
  rawResponse?: unknown;
  errorReason?: string;
}

class ArkeselClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: ARKESEL_BASE_URL,
      timeout: 8000, // fail fast — registration UX must not hang on a slow SMS gateway
      headers: { "api-key": process.env.ARKESEL_API_KEY || "" },
    });
  }

  /**
   * Sends a plain SMS via Arkesel's standard send endpoint. Used for
   * notifications that are not OTP-flow specific (order updates, etc).
   */
  async sendSms(phone: string, message: string): Promise<ArkeselSendResult> {
    try {
      const response = await this.http.post("/v2/sms/send", {
        sender: process.env.ARKESEL_SENDER_ID || "VegeLink",
        message,
        recipients: [phone],
      });

      const ok = response.data?.status === "success";
      if (!ok) {
        logger.warn("Arkesel SMS send returned non-success status", {
          phone,
          response: response.data,
        });
      }
      return { success: ok, rawResponse: response.data };
    } catch (error) {
      logError("Arkesel sendSms request failed", error, { phone });
      return { success: false, errorReason: "NETWORK_ERROR" };
    }
  }

  /**
   * Generates and sends an OTP via Arkesel's dedicated OTP endpoint.
   * This is awaited synchronously by the caller (auth.service) so a failed
   * send can be surfaced to the user as PHONE_CANNOT_BE_VERIFIED instead of
   * silently succeeding.
   */
  async generateOtp(
    phone: string,
    codeLength: number,
    expiryMinutes: number,
    full_name: string,
  ): Promise<ArkeselSendResult> {
    try {
      const response = await this.http.post("/otp/generate", {
        number: phone,
        medium: "sms",
        length: codeLength,
        expiry: expiryMinutes,
        message:
          "Hello " + full_name + ",\nThis is OTP from Arkesel, %otp_code%",
        sender_id: process.env.ARKESEL_SENDER_ID || "VegeLink",
        type: "numeric",
      });

      // Arkesel returns { code: "2000", message: "Successful" } on success.
      const ok = response.data?.code === "1000";
      if (!ok) {
        logger.warn("Arkesel generateOtp rejected the request", {
          phone,
          response: response.data,
        });
        return {
          success: false,
          errorReason: response.data?.message || "OTP_GENERATE_REJECTED",
          rawResponse: response.data,
        };
      }
      return { success: true, rawResponse: response.data };
    } catch (error) {
      logError("Arkesel generateOtp request failed", error, { phone });
      // Network failure, timeout, or 4xx/5xx from Arkesel — treat uniformly
      // as "could not verify this phone" from the caller's perspective.
      return { success: false, errorReason: "NETWORK_ERROR" };
    }
  }

  /**
   * Verifies an OTP previously generated via Arkesel's own OTP system.
   * NOTE: VegeLink's primary OTP flow stores its own hashed OTP in Redis
   * (see otp.repository.ts) rather than relying solely on Arkesel's verify
   * endpoint, so this method is reserved for the delivery/pickup OTP flows
   * described in the logistics addendum, not the registration flow below.
   */
  async verifyOtp(phone: string, code: string): Promise<ArkeselSendResult> {
    try {
      const response = await this.http.post("/otp/verify", {
        number: phone,
        code,
      });
      const ok = response.data?.code === "1100";
      return { success: ok, rawResponse: response.data };
    } catch (error) {
      logError("Arkesel verifyOtp request failed", error, { phone });
      return { success: false, errorReason: "NETWORK_ERROR" };
    }
  }
}

export const arkeselClient = new ArkeselClient();
