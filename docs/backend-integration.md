# Backend integration

The website uses the canonical Student and Opportunity APIs through a restricted
Next.js BFF. The Railway origin and both Student and staff JWTs remain inaccessible
to browser JavaScript.

## Runtime setup

Set the server-only origin (without requiring `/api/v1`):

```text
SECONNECTA_API_URL=http://localhost:8000
```

Browser code calls `/api/seconecta/*`. That route accepts only the explicit
allowlist in `app/api/seconecta/[...path]/route.ts`, forwards the Student cookie
as bearer authentication, and never returns the token. Staff uses its own route
and cookie; the sessions are independent.

## Provider cutover

The active journey provider:

1. hydrates authenticated state from the relationship API;
2. keep local optimistic state while each mutation is pending;
3. send the relationship `version` as `expectedVersion`;
4. use one stable `idempotencyKey` for all retries of the same action;
5. replace optimistic state with the server response;
6. on HTTP 409, refetch and ask the user to repeat only if the intent cannot be
   merged safely;
7. retains localStorage only for anonymous pre-auth state, then imports it once
   after authentication with a stable `import_id`.

Opening the official URL must call `markOfficialVisit`; opening an opportunity
card must not. Recommendation feedback is a separate signal and must never
rewrite onboarding preferences directly.

## Opportunity detail cutover

The server catalog service reads the global content needed by the detail page
from the canonical backend `Opportunity`: organization, media, audience,
structured access/cost, lifecycle, dates, overview, requirements, process,
benefits, trajectory, guide, timeline, reviewed materials and public curation.

Student-specific rationale belongs to the recommendation/Coach layer, not to the
global catalog. Community, FAQ and other unsupported surfaces stay hidden. API
errors produce recoverable empty/error states and never substitute mock data.
