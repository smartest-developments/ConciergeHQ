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

export async function markFeePaid(requestId: number) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/mock-pay`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? 'Failed to mark fee as paid');
  }

  return response.json() as Promise<{ id: number; status: string; feePaidAt: string }>;
}

export async function fetchRequests(email?: string) {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
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
    }>;
  }>;
}
