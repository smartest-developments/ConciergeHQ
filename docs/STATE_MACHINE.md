# Request State Machine

## States
- `FEE_PENDING`: request submitted, sourcing fee not paid.
- `FEE_PAID`: sourcing fee paid, ready for sourcing queue.
- `SOURCING`: concierge actively researching offers.
- `PROPOSAL_PUBLISHED`: proposal delivered, 2-hour action window active.
- `PROPOSAL_EXPIRED`: user did not act within 2 hours.
- `COMPLETED`: user acted on proposal link.
- `CANCELED`: request canceled by policy/admin decision.

## Transition rules
1. `FEE_PENDING -> FEE_PAID`
   - Trigger: sourcing fee confirmation.
2. `FEE_PAID -> SOURCING`
   - Trigger: operator starts sourcing work.
3. `SOURCING -> PROPOSAL_PUBLISHED`
   - Trigger: proposal created with external merchant URL.
   - Side effect: `expiresAt = publishedAt + 2 hours`.
4. `PROPOSAL_PUBLISHED -> COMPLETED`
   - Trigger: user confirms action within 2-hour window.
5. `PROPOSAL_PUBLISHED -> PROPOSAL_EXPIRED`
   - Trigger: no action at `expiresAt`.
6. `* -> CANCELED`
   - Trigger: policy breach, unsupported item, compliance issue.

## Event logging
Each transition writes `RequestStatusEvent` with:
- `fromStatus`
- `toStatus`
- `reason`
- `occurredAt`
- optional metadata
