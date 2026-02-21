# PRD - Acquisition Concierge v1

## Problem
Users want vetted sourcing options within a budget without manually comparing many marketplaces.

## v1 scope
- Paid sourcing workflow for EU + CH requests.
- Request fields: budget, specs, condition, country, urgency, category.
- Fee calculation: `max(50 CHF, 10% of budget)`.
- User pays sourcing fee before sourcing starts.
- Concierge publishes one proposal with external merchant link.
- Proposal expires 2 hours after publication.
- Dashboard to track request state.

## Out of scope (v1)
- We are not seller-of-record.
- No checkout/payment for purchased goods.
- No after-sales support.
- No warranty or returns handling.
- No negotiations with merchants after proposal publication.
- No categories beyond the approved three.

## Category policy
Allowed:
- Electronics
- Home Appliances
- Sports Equipment

Blocked:
- Cars
- Real estate
- Medicines
- Weapons
- Illegal items

## Pricing policy
- Sourcing Fee = `max(50 CHF, 10% of budget)`.
- Fee is non-refundable because it pays for research and curation labor.

## Success criteria (v1)
- User can create request and see fee.
- User can mark fee paid (mock placeholder in bootstrap).
- User can see request statuses in dashboard.
- API enforces category and country constraints.
