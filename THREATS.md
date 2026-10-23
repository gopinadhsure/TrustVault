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
