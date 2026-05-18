import crypto from "crypto";

export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

export const PLANES_WOMPI = {
  pro_mensual: {
    label: "Pro Mensual",
    precioCOP: 49900,
    centavos: 4990000,
    ciclo: "mensual" as const,
    dias: 30,
  },
  pro_anual: {
    label: "Pro Anual",
    precioCOP: 479000,
    centavos: 47900000,
    ciclo: "anual" as const,
    dias: 365,
  },
} as const;

export type PlanKey = keyof typeof PLANES_WOMPI;

// SHA256(reference + amountCents + currency + integrityKey)
export function generarFirmaIntegridad(
  reference: string,
  amountCents: number,
  currency: string,
  integrityKey: string
): string {
  const data = `${reference}${amountCents}${currency}${integrityKey}`;
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

export function construirUrlCheckout(params: {
  reference: string;
  amountCents: number;
  redirectUrl: string;
}): string {
  const publicKey = process.env.WOMPI_PUBLIC_KEY!;
  const integrityKey = process.env.WOMPI_INTEGRITY_KEY!;

  const firma = generarFirmaIntegridad(
    params.reference,
    params.amountCents,
    "COP",
    integrityKey
  );

  const url = new URL(WOMPI_CHECKOUT_URL);
  url.searchParams.set("public-key", publicKey);
  url.searchParams.set("currency", "COP");
  url.searchParams.set("amount-in-cents", String(params.amountCents));
  url.searchParams.set("reference", params.reference);
  url.searchParams.set("signature:integrity", firma);
  url.searchParams.set("redirect-url", params.redirectUrl);

  return url.toString();
}

// Verificación de eventos de webhook de Wompi
// Referencia: https://docs.wompi.co/docs/colombia/eventos
export function verificarWebhook(body: WompiWebhookBody, eventsKey: string): boolean {
  const { signature, timestamp } = body;
  if (!signature || !timestamp) return false;

  const propValues = signature.properties
    .map((prop) => String(getNestedValue(body.data, prop) ?? ""))
    .join("");

  const stringToHash = `${propValues}${timestamp}${eventsKey}`;
  const expected = crypto.createHash("sha256").update(stringToHash, "utf8").digest("hex");

  return expected === signature.checksum;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc !== null && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export interface WompiTransaction {
  id: string;
  reference: string;
  status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";
  amount_in_cents: number;
  currency: string;
}

export interface WompiWebhookBody {
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
  signature: {
    properties: string[];
    checksum: string;
  };
}
