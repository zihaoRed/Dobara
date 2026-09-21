export type H5ItemState = {
  itemCode: string;
  itemStatus: number;
  roundNo: number;
  retestPending: number | boolean;
  resultJson: string | null;
  lastReportTime: string | null;
};

export type H5SessionState = {
  sessionId: number;
  taskId: number;
  sessionStatus: number;
  antiCheatStatus: number;
  openedTime: string | null;
  finishTime: string | null;
  expireTime: string;
  items: H5ItemState[];
};

export type H5DeviceFingerprint = {
  userAgent: string;
  deviceMemoryGb: number | null;
  cpuCores: number | null;
  screen: string;
};

type ApiEnvelope<T> = {
  code: string;
  message?: string;
  message_en?: string;
  traceId?: string;
  data: T | null;
};

const configuredBaseUrl = import.meta.env.VITE_DOBARA_API_BASE_URL?.trim() ?? '';
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');

export class H5ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly traceId?: string,
  ) {
    super(message);
  }
}

function headers(token: string, idempotencyKey?: string): HeadersInit {
  return {
    'Accept': 'application/json',
    'Accept-Language': 'en-IN',
    'X-H5-Detect-Token': token,
    ...(idempotencyKey ? {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    } : {}),
  };
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    throw new H5ApiError('NETWORK_ERROR', error instanceof Error ? error.message : 'Network request failed');
  }

  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.code !== '200' || payload.data == null) {
    throw new H5ApiError(
      payload?.code ?? `HTTP_${response.status}`,
      payload?.message_en || payload?.message || `HTTP ${response.status}`,
      payload?.traceId,
    );
  }
  return payload.data;
}

export function openH5Session(
  token: string,
  idempotencyKey: string,
  fingerprint: H5DeviceFingerprint,
): Promise<H5SessionState> {
  return request('/api/h5-detect/v1/open', token, {
    method: 'POST',
    headers: headers(token, idempotencyKey),
    body: JSON.stringify({ h5DeviceJson: JSON.stringify(fingerprint) }),
  });
}

export function getH5SessionState(token: string): Promise<H5SessionState> {
  return request('/api/h5-detect/v1/state', token, {
    method: 'GET',
    headers: headers(token),
  });
}

export function submitH5ItemResult(
  token: string,
  itemCode: string,
  itemStatus: 2 | 3 | 4,
  resultJson: string,
  idempotencyKey: string,
): Promise<H5ItemState> {
  return request(`/api/h5-detect/v1/items/${encodeURIComponent(itemCode)}/result`, token, {
    method: 'POST',
    headers: headers(token, idempotencyKey),
    body: JSON.stringify({ itemStatus, resultJson }),
  });
}
