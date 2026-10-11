/**
 * paymentService — Stub de pasarela de pagos (PayPal REST / Stripe).
 *
 * Para producción, define en `.env`:
 *   PAYMENT_PROVIDER="paypal" | "stripe"
 *   PAYMENT_API_URL="https://api-m.sandbox.paypal.com"
 *   PAYMENT_CLIENT_ID="xxxx"
 *   PAYMENT_CLIENT_SECRET="xxxx"
 *
 * Sin configuración, opera en modo MOCK aprobando transacciones simuladas.
 */

export type PaymentMethodId = 'CARD' | 'PAYPAL';

export interface CardDetails {
  number: string;
  holder: string;
  expiry: string;
  cvc: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  method: PaymentMethodId;
  donorName: string;
  donorEmail: string;
  targetCountryId?: string;
  card?: CardDetails;
}

export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

export interface PaymentResponse {
  transactionId: string;
  providerReference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethodId;
  processedAt: Date;
  mode: 'mock' | 'live';
  error?: string;
}

const PAYMENT_PROVIDER = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;
const PAYMENT_API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL;
const PAYMENT_CLIENT_ID = process.env.NEXT_PUBLIC_PAYMENT_CLIENT_ID;
const PAYMENT_CLIENT_SECRET = process.env.NEXT_PUBLIC_PAYMENT_CLIENT_SECRET;

export function isPaymentConfigured(): boolean {
  return Boolean(PAYMENT_PROVIDER && PAYMENT_API_URL && PAYMENT_CLIENT_ID && PAYMENT_CLIENT_SECRET);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function luhnValid(numberRaw: string): boolean {
  const digits = numberRaw.replace(/\D/g, '');
  if (digits.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function validateCard(card?: CardDetails): string | null {
  if (!card) return 'Datos de tarjeta ausentes';
  if (!luhnValid(card.number)) return 'Número de tarjeta inválido';
  const expiryMatch = /^(\d{2})\s*\/\s*(\d{2})$/.exec(card.expiry);
  if (!expiryMatch) return 'Vencimiento inválido (MM/AA)';
  const month = Number(expiryMatch[1]);
  if (month < 1 || month > 12) return 'Mes de vencimiento inválido';
  if (!/^\d{3,4}$/.test(card.cvc)) return 'CVC inválido';
  return null;
}

async function authorizeWithProvider(request: PaymentRequest): Promise<PaymentResponse> {
  // Punto de extensión real: OAuth token + Orders API / Payment Intents.
  void request;

  await delay(600 + Math.random() * 700);

  return {
    transactionId: `mock-txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    providerReference: `MOCK-${request.method}-${Math.random().toString(36).toUpperCase().slice(2, 12)}`,
    status: 'COMPLETED',
    amount: request.amount,
    currency: request.currency,
    method: request.method,
    processedAt: new Date(),
    mode: 'mock',
  };
}

export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  if (request.amount <= 0) {
    return {
      transactionId: '',
      providerReference: '',
      status: 'FAILED',
      amount: request.amount,
      currency: request.currency,
      method: request.method,
      processedAt: new Date(),
      mode: isPaymentConfigured() ? 'live' : 'mock',
      error: 'El monto debe ser mayor a cero',
    };
  }

  if (request.method === 'CARD') {
    const cardError = validateCard(request.card);
    if (cardError) {
      return {
        transactionId: '',
        providerReference: '',
        status: 'FAILED',
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        processedAt: new Date(),
        mode: isPaymentConfigured() ? 'live' : 'mock',
        error: cardError,
      };
    }
  }

  if (isPaymentConfigured()) {
    try {
      const response = await fetch(`${PAYMENT_API_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${PAYMENT_CLIENT_ID}:${PAYMENT_CLIENT_SECRET}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: { currency_code: request.currency, value: request.amount.toFixed(2) },
              custom_id: request.targetCountryId ?? 'general-fund',
            },
          ],
        }),
      });

      if (!response.ok) throw new Error(`Provider responded ${response.status}`);
      const data = (await response.json()) as { id?: string };

      return {
        transactionId: data.id ?? `txn-${Date.now()}`,
        providerReference: data.id ?? 'unknown',
        status: 'COMPLETED',
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        processedAt: new Date(),
        mode: 'live',
      };
    } catch (error) {
      return {
        transactionId: '',
        providerReference: '',
        status: 'FAILED',
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        processedAt: new Date(),
        mode: 'live',
        error: error instanceof Error ? error.message : 'Unknown provider error',
      };
    }
  }

  return authorizeWithProvider(request);
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
}

export async function refundTransaction(request: RefundRequest): Promise<{ status: 'REFUNDED' | 'FAILED'; refundedAmount: number; mode: 'mock' | 'live'; error?: string }> {
  await delay(400);
  void request;
  return {
    status: 'REFUNDED',
    refundedAmount: request.amount ?? 0,
    mode: isPaymentConfigured() ? 'live' : 'mock',
  };
}