import crypto from "crypto";

// VIPPS Configuration
const VIPPS_CONFIG = {
  clientId: process.env.VIPPS_CLIENT_ID || "",
  clientSecret: process.env.VIPPS_CLIENT_SECRET || "",
  merchantSerialNumber: process.env.VIPPS_MERCHANT_SERIAL_NUMBER || "123456",
  // Test environment
  apiUrl: "https://apitest.vipps.no",
  tokenUrl: "https://apitest.vipps.no/accesstoken/get",
  callbackUrl: process.env.VIPPS_CALLBACK_URL || "https://wedflow.no/api/vipps/callback",
  redirectUrl: process.env.VIPPS_REDIRECT_URL || "https://wedflow.no/payment-success",
};

interface VIPPSPaymentInit {
  orderId: string;
  amount: number; // in øre (cents)
  description: string;
  vendorId: string;
  subscriptionTierId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

interface VIPPSAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  ext_expires_in: number;
  expires_on: number;
  not_before: number;
  resource: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Get VIPPS access token
 */
export async function getVIPPSAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  try {
    const response = await fetch(VIPPS_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "client_id": VIPPS_CONFIG.clientId,
        "client_secret": VIPPS_CONFIG.clientSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`VIPPS token error: ${response.status}`);
    }

    const data = (await response.json()) as VIPPSAccessToken;
    const expiresAt = Date.now() + (data.expires_in * 1000 - 10000); // Refresh 10 seconds before expiry

    cachedAccessToken = { token: data.access_token, expiresAt };
    return data.access_token;
  } catch (error) {
    console.error("Error getting VIPPS access token:", error);
    throw error;
  }
}

/**
 * Initiate VIPPS payment
 */
export async function initiateVIPPSPayment(
  payment: VIPPSPaymentInit
): Promise<{ paymentUrl: string; vippsOrderId: string }> {
  const accessToken = await getVIPPSAccessToken();

  const payload = {
    customerInfo: {
      mobileNumber: "4712345678", // Will be prompted to user
    },
    merchantInfo: {
      orderId: payment.orderId,
      callbackPrefix: VIPPS_CONFIG.callbackUrl,
      callbackAuthToken: generateAuthToken(),
      isApp: false,
      merchantWebsiteUrl: "https://wedflow.no",
      termsUrl: "https://wedflow.no/terms",
      staticShippingDetails: {
        isShippingRequired: false,
      },
    },
    transaction: {
      amount: payment.amount, // in øre
      orderId: payment.orderId,
      transactionText: payment.description,
      paymentText: `Wedflow subscription - ${payment.description}`,
      refOrderId: payment.subscriptionTierId,
    },
  };

  try {
    const response = await fetch(`${VIPPS_CONFIG.apiUrl}/ecomm/v2/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Request-Id": crypto.randomUUID(),
        "Merchant-Serial-Number": VIPPS_CONFIG.merchantSerialNumber,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("VIPPS payment initiation error:", error);
      throw new Error(`VIPPS error: ${error.message || response.status}`);
    }

    const data = await response.json();

    return {
      paymentUrl: data.url,
      vippsOrderId: payment.orderId,
    };
  } catch (error) {
    console.error("Error initiating VIPPS payment:", error);
    throw error;
  }
}

/**
 * Get payment status
 */
export async function getVIPPSPaymentStatus(
  orderId: string
): Promise<{
  orderId: string;
  transactionStatus: string;
  amount: number;
}> {
  const accessToken = await getVIPPSAccessToken();

  try {
    const response = await fetch(
      `${VIPPS_CONFIG.apiUrl}/ecomm/v2/payments/${orderId}/status`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Request-Id": crypto.randomUUID(),
          "Merchant-Serial-Number": VIPPS_CONFIG.merchantSerialNumber,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`VIPPS status error: ${response.status}`);
    }

    const data = await response.json();
    return {
      orderId: data.orderId,
      transactionStatus: data.transactionLogHistory?.[0]?.transactionStatus || "UNKNOWN",
      amount: data.amount,
    };
  } catch (error) {
    console.error("Error getting VIPPS payment status:", error);
    throw error;
  }
}

/**
 * Capture payment (complete transaction)
 */
export async function captureVIPPSPayment(
  orderId: string,
  amount: number
): Promise<{ transactionId: string; status: string }> {
  const accessToken = await getVIPPSAccessToken();

  try {
    const response = await fetch(
      `${VIPPS_CONFIG.apiUrl}/ecomm/v2/payments/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Request-Id": crypto.randomUUID(),
          "Merchant-Serial-Number": VIPPS_CONFIG.merchantSerialNumber,
        },
        body: JSON.stringify({ amount }),
      }
    );

    if (!response.ok) {
      throw new Error(`VIPPS capture error: ${response.status}`);
    }

    const data = await response.json();
    return {
      transactionId: data.transactionId || orderId,
      status: "captured",
    };
  } catch (error) {
    console.error("Error capturing VIPPS payment:", error);
    throw error;
  }
}

/**
 * Refund payment
 */
export async function refundVIPPSPayment(
  orderId: string,
  amount: number
): Promise<{ status: string }> {
  const accessToken = await getVIPPSAccessToken();

  try {
    const response = await fetch(
      `${VIPPS_CONFIG.apiUrl}/ecomm/v2/payments/${orderId}/refund`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Request-Id": crypto.randomUUID(),
          "Merchant-Serial-Number": VIPPS_CONFIG.merchantSerialNumber,
        },
        body: JSON.stringify({ amount }),
      }
    );

    if (!response.ok) {
      throw new Error(`VIPPS refund error: ${response.status}`);
    }

    return { status: "refunded" };
  } catch (error) {
    console.error("Error refunding VIPPS payment:", error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyVIPPSWebhookSignature(
  signature: string,
  body: string,
  authToken: string
): boolean {
  const hash = crypto
    .createHmac("sha256", authToken)
    .update(body)
    .digest("base64");

  return hash === signature;
}

/**
 * Generate auth token for callbacks
 */
function generateAuthToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export default {
  getVIPPSAccessToken,
  initiateVIPPSPayment,
  getVIPPSPaymentStatus,
  captureVIPPSPayment,
  refundVIPPSPayment,
  verifyVIPPSWebhookSignature,
};
