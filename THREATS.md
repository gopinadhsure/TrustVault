# TrustVault Threat Model – Authentication & User Roles

This document outlines authentication-related security threats, attack vectors, and mitigations implemented in TrustVault.

## 1. Credential Stuffing & Brute-Force Attacks
- **Threat**: Attackers attempt automated guessing of usernames and passwords.
- **Mitigation**: 
  - Django's built-in secure password hashing (`PBKDF2` with SHA-256 and high work factor) is enforced.
  - Rate-limiting and account lockout policies can be integrated at the proxy/gateway level.

## 2. Session Hijacking & Cookie Theft
- **Threat**: Attackers intercept session cookies over unencrypted channels or via XSS.
- **Mitigation**:
  - `SESSION_COOKIE_SECURE` (in production) and `HttpOnly` flags prevent JavaScript access to session cookies.
  - `SESSION_COOKIE_SAMESITE = 'Lax'` protects against cross-site request forgery via cookies.

## 3. Cross-Site Request Forgery (CSRF)
- **Threat**: Malicious sites trick authenticated users into executing unauthorized requests against TrustVault backend.
- **Mitigation**:
  - Django's `CsrfViewMiddleware` is active globally.
  - The frontend `api.ts` automatically extracts the `csrftoken` cookie and attaches it to the `X-CSRFToken` header for all state-changing requests (POST, PUT, PATCH, DELETE).

## 4. Privilege Escalation & Insecure Direct Object References (IDOR)
- **Threat**: A `VIEWER` or `OWNER` user attempts to access administrative endpoints or elevate their own role to `ADMIN`.
- **Mitigation**:
  - Backend role enforcement via custom DRF permission classes (`IsAdminRole`, `IsOwnerOrAdmin`).
  - Serializers (`UserUpdateSerializer`) explicitly mark the `role` field as `read_only_fields`, preventing users from changing their own role even if they send a patch request with `{ "role": "ADMIN" }`.
  - Automated tests verify that privilege escalation attempts fail and 403 Forbidden is returned.

## 5. Audit Event Confidentiality and Integrity
- **Threat**: Users attempt to read or alter administrative activity records, or event details accidentally retain credentials or document contents.
- **Mitigations**:
  - The audit API is administrator-only; its list endpoint is read-only and has server-side pagination and filters.
  - The Django admin audit view is read-only. Event details are constructed through a safe-key allowlist and do not include request bodies, passwords, tokens, secret keys, or document contents.
  - Document and permission mutations record their event in the same database transaction where practical. Failed/denied operations record a minimal reason and target identifier when available.
- **Limitations**:
  - These are application-level records in the application database. They are not tamper-proof: a database administrator, compromised application credentials, direct database access, or privileged code can alter or remove them.
  - Stronger integrity requires independent controls such as a separately administered append-only log service, immutable/WORM storage, restricted database roles, backups, and monitoring of audit-log access. No such independent protection is configured here.
