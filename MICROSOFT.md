# Microsoft 365 Integration — WINGS Counselling Centre

This document describes the complete Microsoft 365 integration, including:
- **Admin login via Microsoft Entra ID** (OAuth 2.0 Authorization Code Flow)
- **Appointment notification emails via Microsoft Graph API** (Client Credentials Flow)

---

## Table of Contents

1. [Files Created / Modified](#files-created--modified)
2. [Package Installation](#package-installation)
3. [Environment Variables (.env)](#environment-variables-env)
4. [Microsoft Entra ID App Registration Steps](#microsoft-entra-id-app-registration-steps)
5. [Required API Permissions](#required-api-permissions)
6. [Admin Consent Step](#admin-consent-step)
7. [Frontend Microsoft Login Flow](#frontend-microsoft-login-flow)
8. [Backend Callback Flow](#backend-callback-flow)
9. [Appointment Email Flow](#appointment-email-flow)
10. [Redirect URIs](#redirect-uris)
11. [Testing Instructions](#testing-instructions)
12. [Common Errors and Fixes](#common-errors-and-fixes)
13. [Final Checklist](#final-checklist)

---

## Files Created / Modified

### Files Created

| File | Purpose |
|------|---------|
| `apps/api/src/config/microsoftConfig.js` | MSAL ConfidentialClientApplication factory, env var helpers |
| `apps/api/src/routes/microsoftAuthRoutes.js` | OAuth login initiation + callback handler |
| `apps/api/src/middlewares/requireMicrosoftAuth.js` | Session-based Microsoft auth guard (optional use) |
| `apps/api/src/services/microsoftMailService.js` | Graph API email service using client credentials |
| `apps/admin/.env.example` | Frontend env var template |
| `MICROSOFT.md` | This documentation file |

### Files Modified

| File | Change |
|------|--------|
| `apps/api/src/routes/auth.js` | Added `GET /api/auth/logout` route |
| `apps/api/src/routes/appointment.js` | Added Microsoft Graph email notification after appointment save |
| `apps/api/src/server.js` | Added `express-session`, mounted `microsoftAuthRouter` |
| `apps/api/.env.example` | Added all Microsoft environment variables |
| `apps/admin/src/admin/Pages/Login.jsx` | Added Microsoft login button + callback token handler |

---

## Package Installation

Run this command inside `apps/api/`:

```bash
npm install @azure/msal-node@2.16.2 express-session@1.18.1
```

Both packages are already installed if you are reading this after setup.

---

## Environment Variables (.env)

Add the following to `apps/api/.env`:

```env
# Microsoft 365 / Entra ID
MS_CLIENT_ID=
MS_TENANT_ID=
MS_CLIENT_SECRET=
MS_REDIRECT_URI=http://localhost:5001/api/auth/microsoft/callback

# Session (required for OAuth state/CSRF protection)
SESSION_SECRET=some-long-random-string-change-in-production

# Organization Microsoft 365 mailbox
# ORGANIZATION_EMAIL is the mailbox that sends appointment notifications via Graph API
# It must exist in your Microsoft 365 tenant and the app must have Mail.Send permission
ORGANIZATION_EMAIL=appointments@yourorganization.com

# ORGANIZATION_NOTIFICATION_EMAIL receives the appointment notification
ORGANIZATION_NOTIFICATION_EMAIL=admin@yourorganization.com

# Frontend URL (used for post-login redirects)
FRONTEND_URL=http://localhost:5173
```

**Rules:**
- Never commit real values — `.env` is in `.gitignore`
- `MS_CLIENT_SECRET` must only live on the backend — never expose it to the frontend
- Do not hardcode these values anywhere in source code

---

## Microsoft Entra ID App Registration Steps

1. Go to [portal.azure.com](https://portal.azure.com) and sign in with your organization admin account.
2. Navigate to **Microsoft Entra ID** → **App registrations** → **New registration**.
3. Fill in the registration form:
   - **Name**: `WINGS Counselling Centre`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: select `Web` and enter:
     ```
     http://localhost:5001/api/auth/microsoft/callback
     ```
4. Click **Register**.
5. On the app overview page, copy these values to your `.env`:
   - **Application (client) ID** → `MS_CLIENT_ID`
   - **Directory (tenant) ID** → `MS_TENANT_ID`
6. Go to **Certificates & secrets** → **Client secrets** → **New client secret**.
   - Set a description (e.g., `WINGS Backend`) and an expiry period.
   - Copy the **Value** immediately (it is only shown once) → `MS_CLIENT_SECRET`
7. Go to **API permissions** → add the permissions listed in the next section.

---

## Required API Permissions

### Delegated permissions (Admin Login — Authorization Code Flow)

These are automatically requested during login and consented to by the admin.

| Permission | Type | Purpose |
|-----------|------|---------|
| `openid` | Delegated | Required for OpenID Connect login |
| `profile` | Delegated | Read user profile |
| `email` | Delegated | Read user email address |
| `User.Read` | Delegated | Read signed-in user details |

### Application permissions (Appointment Email — Client Credentials Flow)

This permission allows the backend to send email **without any user login**.
**Admin consent is required.**

| Permission | Type | Purpose |
|-----------|------|---------|
| `Mail.Send` | Application | Send email from the organization mailbox |

---

## Admin Consent Step

`Mail.Send` as an application permission requires an Azure AD administrator to grant consent.

1. In the Azure portal, go to your app registration.
2. Click **API permissions**.
3. Under the `Mail.Send` application permission, click **Grant admin consent for [Your Organization]**.
4. Confirm the consent dialog.

Without this step, the Microsoft Graph API will return **403 Forbidden** when the backend tries to send appointment emails.

---

## Frontend Microsoft Login Flow

```
Admin clicks "Continue with Microsoft" on the Login page
        ↓
Browser redirects to: GET /api/auth/microsoft
        ↓
Backend generates a secure state value and stores it in session
        ↓
Backend builds the Microsoft authorization URL via MSAL
        ↓
Backend redirects browser to Microsoft's login page
        ↓
Admin enters their organization Microsoft 365 email and password on Microsoft's page
        ↓
Microsoft authenticates the admin
        ↓
Microsoft redirects to: GET /api/auth/microsoft/callback?code=...&state=...
        ↓
Backend validates state (CSRF check)
Backend exchanges the code for tokens via MSAL acquireTokenByCode()
Backend checks if the authenticated email matches ADMIN_USERNAME in .env
Backend issues a JWT (same format as the existing username/password login)
        ↓
Backend redirects browser to: http://localhost:5173/admin?msToken=<jwt>
        ↓
Frontend Login.jsx reads the token from URL, stores in sessionStorage, navigates to /admin
        ↓
Admin is now on the existing Admin Dashboard
```

**Key security notes:**
- Admin credentials are entered only on Microsoft's official login page — never in the WINGS app
- The JWT issued is identical to the one from username/password login — all existing `requireAdmin` middleware works unchanged
- Access tokens from Microsoft are never sent to the frontend or logged
- A cryptographic `state` parameter prevents CSRF attacks

---

## Backend Callback Flow

```
GET /api/auth/microsoft/callback?code=XXXXX&state=YYYYY

1. Check for error params from Microsoft (access_denied, etc.)
2. Extract authorization code and state
3. Validate state against session (CSRF protection) → reject if mismatch
4. Call MSAL acquireTokenByCode() to exchange code for tokens
5. Extract email from id_token claims
6. Check email matches ADMIN_USERNAME in .env
   → If not authorized: redirect with "Access denied" error
7. Store minimal user info in session (name, email, MS account ID)
8. Issue JWT: jwt.sign({ username: ADMIN_USERNAME }, JWT_SECRET, { expiresIn: "1d" })
9. Redirect to: FRONTEND_URL/admin?msToken=<jwt>
```

---

## Appointment Email Flow

```
Public user submits appointment form
        ↓
POST /api/appointments
        ↓
1. Validate required fields (nric_fin_number, name, age, gender, nationality, email, phone, counselling_type)
2. Save appointment to PostgreSQL database
        ↓  ← Appointment is guaranteed to be saved before email attempts
3. Send existing Nodemailer/SMTP confirmation email (sendAppointmentConfirmationEmail)
        ↓
4. Send Microsoft Graph API notification email (sendAppointmentNotification)
   - Acquires application token via Client Credentials Flow
   - POST https://graph.microsoft.com/v1.0/users/{ORGANIZATION_EMAIL}/sendMail
   - From: ORGANIZATION_EMAIL
   - To: ORGANIZATION_NOTIFICATION_EMAIL
   - Reply-To: appointment user's email (so organization can reply directly)
   - saveToSentItems: true
        ↓
5. Return success response to user
   { success: true, appointment: {...}, emailSent: bool, msEmailSent: bool }
```

**Important:** If the Microsoft Graph email fails, the appointment is NOT deleted. The error is logged and the user receives a success response. The appointment data is safe in the database.

### Email content

The appointment notification email includes all fields from the `appointments` table:

- Appointment ID
- Full Name
- Email
- Phone Number
- NRIC / FIN Number
- Age
- Gender
- Nationality
- Counselling Type
- Sub Counselling Type(s)
- Description / Message
- Remarks
- Submitted On (created_at)

---

## Redirect URIs

### Development

```
http://localhost:5001/api/auth/microsoft/callback
```

Set in `MS_REDIRECT_URI` in `apps/api/.env` and in Microsoft Entra app registration.

### Production

1. In `apps/api/.env`:
   ```env
   MS_REDIRECT_URI=https://api.yourproductiondomain.com/api/auth/microsoft/callback
   FRONTEND_URL=https://yourproductiondomain.com
   ```
2. In Microsoft Entra app registration → **Authentication** → **Redirect URIs**, add:
   ```
   https://api.yourproductiondomain.com/api/auth/microsoft/callback
   ```
3. Set `SESSION_SECRET` to a long random string (different from development).
4. Install a persistent session store (Redis recommended):
   ```bash
   npm install connect-redis redis
   ```
   Update `server.js` session config as indicated in the comment block.

---

## Testing Instructions

### Prerequisites

Before testing, ensure:
1. All Microsoft env vars are set in `apps/api/.env`
2. Microsoft Entra app registration is complete
3. Redirect URI is registered in Microsoft Entra
4. API permissions are added
5. Admin consent is granted for `Mail.Send`
6. Backend is restarted after `.env` changes

### Test 1 — Microsoft Admin Login

1. Start the backend: `cd apps/api && npm run dev`
2. Start the frontend: `cd apps/admin && npm run dev`
3. Go to `http://localhost:5173/admin`
4. Click **Continue with Microsoft**
5. You should be redirected to `login.microsoftonline.com`
6. Sign in with the organization Microsoft 365 account whose email matches `ADMIN_USERNAME` in `.env`
7. After successful login, you should be redirected to the admin dashboard
8. Verify the token is in `sessionStorage` under `wings_admin_token`

### Test 2 — Unauthorized Microsoft Account

1. Click **Continue with Microsoft**
2. Sign in with a Microsoft account whose email does NOT match `ADMIN_USERNAME`
3. You should see: `Access denied. Your Microsoft account is not authorized to access the Admin Portal.`

### Test 3 — Existing Username/Password Login

1. Enter the username and password on the login form
2. Click **Sign In**
3. Should work exactly as before — Microsoft integration must not break this

### Test 4 — Appointment Email via Microsoft Graph

1. Submit an appointment through the public-facing form
2. Check the backend logs for:
   ```
   [MS Mail] Appointment notification sent via Graph API. Appointment ID: X, To: admin@yourorg.com
   ```
3. Check the `ORGANIZATION_NOTIFICATION_EMAIL` inbox for the notification email
4. Check the `ORGANIZATION_EMAIL` Sent Items folder for the copy
5. Verify Reply-To is set to the appointment submitter's email

---

## Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Microsoft login is not configured` | MS env vars missing | Add `MS_CLIENT_ID`, `MS_TENANT_ID`, `MS_CLIENT_SECRET` to `.env` |
| `Invalid login state` (CSRF error) | Session expired or missing | Restart browser, ensure `SESSION_SECRET` is set |
| `AADSTS70011 / invalid_client` | Wrong Client ID or Secret | Double-check `MS_CLIENT_ID` and `MS_CLIENT_SECRET` |
| `Redirect URI mismatch` | URI not registered in Entra | Add exact URI to app registration in Azure portal |
| `Access denied` (cancelled) | User closed Microsoft login | Normal — user can retry |
| `Access denied. Your Microsoft account is not authorized` | Email ≠ ADMIN_USERNAME | Update `ADMIN_USERNAME` in `.env` or use the correct Microsoft account |
| `AADSTS65001` (admin consent) | Admin consent not granted | Grant admin consent in Azure portal API permissions |
| `Graph 401` | Token expired / wrong tenant | Check `MS_TENANT_ID` matches your organization |
| `Graph 403` | `Mail.Send` permission missing | Add `Mail.Send` application permission and grant admin consent |
| `ORGANIZATION_EMAIL is not set` | Missing env var | Add `ORGANIZATION_EMAIL` to `.env` |
| `Graph 404 on /users/{email}` | Mailbox not in tenant | Ensure `ORGANIZATION_EMAIL` is a valid mailbox in your Microsoft 365 tenant |
| Appointment saved but no MS email | MS not configured | Normal until MS values are added — appointment data is safe |

---

## Final Checklist

Before going to production, verify each item:

- [ ] `MS_CLIENT_ID` added to `apps/api/.env`
- [ ] `MS_TENANT_ID` added to `apps/api/.env`
- [ ] `MS_CLIENT_SECRET` added to `apps/api/.env`
- [ ] `SESSION_SECRET` set to a long random string in `apps/api/.env`
- [ ] `MS_REDIRECT_URI` set correctly in `apps/api/.env`
- [ ] Redirect URI added in Microsoft Entra app registration (Authentication → Redirect URIs)
- [ ] Supported account type set to `Accounts in this organizational directory only`
- [ ] Delegated permissions added: `openid`, `profile`, `email`, `User.Read`
- [ ] Application permission added: `Mail.Send`
- [ ] Admin consent granted for `Mail.Send`
- [ ] `ORGANIZATION_EMAIL` set to the sending mailbox in `apps/api/.env`
- [ ] `ORGANIZATION_NOTIFICATION_EMAIL` set to the receiving address in `apps/api/.env`
- [ ] `FRONTEND_URL` set correctly in `apps/api/.env`
- [ ] Backend restarted after `.env` changes
- [ ] **Continue with Microsoft** button tested → redirected to Microsoft login ✓
- [ ] Authorized admin tested → reaches dashboard ✓
- [ ] Unauthorized admin tested → sees "Access denied" message ✓
- [ ] Existing username/password login still works ✓
- [ ] Appointment submitted → saved in database ✓
- [ ] Organization email received appointment notification ✓
- [ ] Reply-To on notification email is the appointment user's email ✓
- [ ] `.env` is listed in `.gitignore` (it is — verified) ✓
- [ ] No secrets committed to source control ✓

---

*Microsoft integration implemented without breaking or removing any existing WINGS functionality.*
*The existing username/password admin login, all existing routes, Nodemailer email, and the appointment API all continue to work unchanged.*
