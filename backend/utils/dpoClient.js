import xml2js from "xml2js";
import axios from "axios";

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
const builder = new xml2js.Builder({ rootName: "API3G" });

function apiUrl() {
  return process.env.DPO_API_URL || "https://secure.3gdirectpay.com/API/v6/";
}
function paymentUrl() {
  return process.env.DPO_PAYMENT_URL || "https://secure.3gdirectpay.com/payv3.php";
}

export async function callDpo(payload) {
  const xmlBody = builder.buildObject(payload);
  const response = await axios.post(apiUrl(), xmlBody, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "User-Agent": "Mozilla/5.0 (compatible; HighveldFireButchery/1.0)",
    },
  });
  const parsed = await parser.parseStringPromise(response.data);
  return parsed;
}

//Creates a DPO payment token for an order which redirects a customer to DPO's hosted payment page,
export async function createToken({ order, email, phone, redirectUrl, backUrl }) {
  const payload = {
    CompanyToken: process.env.DPO_COMPANY_TOKEN,
    Request: "createToken",
    Transaction: {
      PaymentAmount: order.totalAmount.toFixed(2),
      PaymentCurrency: order.currency || process.env.CURRENCY || "ZAR",
      CompanyRef: order.ticketNumber,
      RedirectURL: redirectUrl,
      BackURL: backUrl,
      CustomerFirstName: (order.customerName || "").split(" ")[0] || order.customerName,
      CustomerLastName: (order.customerName || "").split(" ").slice(1).join(" ") || "-",
      CustomerEmail: email,
      CustomerPhone: phone || order.phone,
    },
    Services: {
      Service: {
        ServiceType: process.env.DPO_SERVICE_TYPE,
        ServiceDescription: `Braai pre-order ${order.ticketNumber}`,
        ServiceDate: new Date().toISOString().slice(0, 10).replace(/-/g, "/"),
      },
    },
  };

  const result = await callDpo(payload);
  if (result?.API3G?.Result !== "000") {
    throw new Error(result?.API3G?.ResultExplanation || "DPO could not create a payment token.");
  }
  const transToken = result.API3G.TransToken;
  return { transToken, redirectTo: `${paymentUrl()}?ID=${transToken}` };
}

export async function verifyToken(transToken) {
  const payload = {
    CompanyToken: process.env.DPO_COMPANY_TOKEN,
    Request: "verifyToken",
    TransactionToken: transToken,
  };
  const result = await callDpo(payload);
  const api = result?.API3G || {};
  return {
    success: api.Result === "000",
    result: api.Result,
    explanation: api.ResultExplanation,
    raw: api,
  };
}

