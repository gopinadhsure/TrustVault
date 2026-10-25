# TrustVault

Secure document-sharing web application with end-to-end security best practices, session authentication, role-based access control, and granular permissions.

## Tech Stack
- **Backend**: Python 3.13, Django 5+, Django REST Framework, PostgreSQL / SQLite
- **Frontend**: React, Vite, TypeScript, React Router

## Getting Started

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Phase 2 API Endpoints
- `POST /api/auth/login/` - Authenticates user and establishes secure session cookie
- `POST /api/auth/logout/` - Clears session
- `GET /api/auth/me/` - Returns current authenticated user profile and role
- `PATCH /api/auth/me/` - Updates user profile (role escalation prevented)

## Running Automated Tests
```bash
cd backend
python manage.py test accounts documents
```

## Audit Activity
- Administrators can retrieve audit events at `GET /api/audit-logs/`; the endpoint supports `page`, `page_size` (maximum 100), `action`, `outcome`, `actor` (username substring), and `target_id` filters.
- Audit events are application-level records and are not tamper-proof. See [THREATS.md](THREATS.md) for the integrity limitations and independent controls needed for stronger guarantees.

