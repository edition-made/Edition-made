const DEFAULT_LIVE_API_URL = 'https://api.getalma.eu';
const DEFAULT_TEST_API_URL = 'https://api.sandbox.getalma.eu';

export class AlmaApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'AlmaApiError';
    this.status = status;
    this.details = details;
  }
}

function getApiKey() {
  const apiKey = process.env.ALMA_API_KEY?.trim();
  if (!apiKey) throw new AlmaApiError('ALMA_API_KEY manquante', 500);
  return apiKey;
}

function getApiBaseUrl(apiKey) {
  const configuredUrl = process.env.ALMA_API_URL?.trim();
  if (configuredUrl) {
    const parsedUrl = new URL(configuredUrl);
    if (parsedUrl.protocol !== 'https:' || !['api.getalma.eu', 'api.sandbox.getalma.eu'].includes(parsedUrl.hostname)) {
      throw new AlmaApiError('ALMA_API_URL invalide', 500);
    }
    return parsedUrl.origin;
  }
  return apiKey.startsWith('sk_test_') ? DEFAULT_TEST_API_URL : DEFAULT_LIVE_API_URL;
}

export async function almaRequest(path, { method = 'GET', body } = {}) {
  const apiKey = getApiKey();
  const response = await fetch(`${getApiBaseUrl(apiKey)}/v1${path}`, {
    method,
    headers: {
      Authorization: `Alma-Auth ${apiKey}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const rawBody = await response.text();
  let payload = null;
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { message: rawBody.slice(0, 500) };
    }
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Erreur Alma (${response.status})`;
    throw new AlmaApiError(message, response.status, payload);
  }

  return payload;
}

export function getAlmaEligibility(purchaseAmount, installments = [2, 3, 4]) {
  return almaRequest('/payments/eligibility', {
    method: 'POST',
    body: {
      payment: {
        purchase_amount: purchaseAmount,
        installments_count: installments,
      },
    },
  });
}

export function createAlmaPayment(payload) {
  return almaRequest('/payments', { method: 'POST', body: payload });
}

export function retrieveAlmaPayment(paymentId) {
  return almaRequest(`/payments/${encodeURIComponent(paymentId)}`);
}

export function isTrustedAlmaPaymentUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && [
      'checkout.getalma.eu',
      'checkout.sandbox.getalma.eu',
      'pay.getalma.eu',
      'pay.sandbox.getalma.eu',
    ].includes(url.hostname);
  } catch {
    return false;
  }
}
