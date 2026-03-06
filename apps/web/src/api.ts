const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export type CreateRequestInput = {
  userEmail: string;
  budgetChf: number;
  specs: string;
  category: 'ELECTRONICS' | 'HOME_APPLIANCES' | 'SPORTS_EQUIPMENT';
  condition: 'NEW' | 'USED';
  country: string;
  urgency: 'STANDARD' | 'FAST' | 'CRITICAL';
};

export async function fetchCategories() {
  const response = await fetch(`${API_BASE_URL}/api/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json() as Promise<{ categories: Array<{ id: string; label: string }> }>;
}

export async function createRequest(payload: CreateRequestInput) {
  const response = await fetch(`${API_BASE_URL}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? 'Failed to create request');
  }

  return response.json() as Promise<{ id: number; status: string; sourcingFeeChf: number }>;
}

export async function createCheckoutSession(requestId: number) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/checkout`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? 'Failed to create checkout session');
  }

  return response.json() as Promise<{ checkoutUrl: string; sessionId: string }>;
}

export async function confirmPayment(requestId: number, sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/confirm-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? 'Failed to confirm payment');
  }

  return response.json() as Promise<{ id: number; status: string; feePaidAt: string }>;
}

export type FetchRequestsParams = {
  email?: string;
  status?: string;
  category?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'budgetChf';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export async function fetchRequests(params?: string | FetchRequestsParams) {
  const queryParams = new URLSearchParams();
  if (typeof params === 'string') {
    if (params) queryParams.set('email', params);
  } else if (params) {
    const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
    for (const [key, value] of entries) {
      queryParams.set(key, String(value));
    }
  }

  const query = queryParams.size > 0 ? `?${queryParams.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/api/requests${query}`);
  if (!response.ok) throw new Error('Failed to fetch requests');
  return response.json() as Promise<{
    requests: Array<{
      id: number;
      status: string;
      userEmail: string;
      budgetChf: number;
      sourcingFeeChf: number;
      category: string;
      country: string;
      condition: string;
      urgency: string;
      createdAt: string;
      feePaidAt: string | null;
      proposal: {
        id: number;
        merchantName: string;
        externalUrl: string;
        summary: string | null;
        publishedAt: string;
        expiresAt: string;
      } | null;
    }>;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>;
}

export async function fetchRequestDetail(requestId: number) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`);
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? 'Failed to fetch request detail');
  }

  return response.json() as Promise<{
    request: {
      id: number;
      userEmail: string;
      budgetChf: number;
      sourcingFeeChf: number;
      specs: string;
      category: string;
      country: string;
      condition: string;
      urgency: string;
      status: string;
      feePaidAt: string | null;
      createdAt: string;
      updatedAt: string;
    };
    proposals: Array<{
      id: number;
      merchantName: string;
      externalUrl: string;
      summary: string | null;
      publishedAt: string;
      expiresAt: string;
      actedAt: string | null;
    }>;
    statusTimeline: Array<{
      id: number;
      fromStatus: string | null;
      toStatus: string;
      reason: string | null;
      metadata: Record<string, unknown> | null;
      occurredAt: string;
    }>;
  }>;
}

export async function transitionRequestStatus(
  requestId: number,
  payload: { toStatus: 'SOURCING' | 'COMPLETED' | 'CANCELED'; reason?: string }
) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? 'Failed to transition request status');
  }

  return response.json() as Promise<{ id: number; status: string; transitionedAt: string }>;
}
