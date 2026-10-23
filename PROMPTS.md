# TrustVault Phase 2 – Prompt Log & Corrections

- **Date**: 2026-10-23
- **User Request**: Implement Phase 2: Authentication and User Roles (Secure login, logout, profile, 3 roles: ADMIN, OWNER, VIEWER, backend permission enforcement, role escalation prevention, React login & profile pages, automated tests, README, THREATS, PROMPTS).

## Prompts Used
1. "Act as a professional Django developer and security mentor. I am a beginner building TrustVault, a Secure Document Management System. Implement Phase 2 only..."

## AI Mistakes Discovered & Corrections Made
1. **PostgreSQL Password Authentication Mismatch**:
   - *Mistake*: The initial database configuration attempted to connect to local PostgreSQL using password `postgres`, but the user's local instance had a different password.
   - *Correction*: Switched the development database in `backend/.env` to SQLite by commenting out `DB_NAME`, which allowed migrations and automated tests to run cleanly and instantly without local PostgreSQL authentication errors.
2. **CSRF Token Handling in Fetch**:
   - *Mistake*: Standard `fetch` requests in React do not automatically include Django CSRF cookies in unsafe methods (POST/PUT/PATCH).
   - *Correction*: Created `api.ts` helper that automatically extracts the `csrftoken` cookie and attaches it as `X-CSRFToken` header for state-changing requests, along with `credentials: 'include'` for session cookies.
3. **Role Escalation Vulnerability**:
   - *Mistake*: Allowing users to update their profile could potentially permit role field modification.
   - *Correction*: Enforced `read_only_fields = ['role']` on `UserUpdateSerializer` and added automated test (`test_privilege_escalation_prevention`) verifying that attempts to patch role to `ADMIN` are silently rejected.

## Git Commit
- Will be created after final verification.
