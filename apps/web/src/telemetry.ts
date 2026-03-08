export type FunnelEventName =
  | 'request_create_success'
  | 'request_create_failure'
  | 'checkout_start'
  | 'checkout_success'
  | 'checkout_failure'
  | 'proposal_open';

export function trackFunnelEvent(
  event: FunnelEventName,
  payload: Record<string, string | number | null>
) {
  if (typeof window === 'undefined') {
    return;
  }

  window.console.info('[telemetry:funnel]', {
    event,
    ...payload
  });
}

export const trackProductEvent = trackFunnelEvent;
