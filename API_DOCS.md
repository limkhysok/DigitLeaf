# DigitLeaf API Documentation

Base URL: `http://localhost:8000/api/v1`

---

## 🔐 Authentication Endpoints

### 1. Login (Get Tokens)
Authenticates a user using standard OAuth2 Password flow. Returns a short-lived access token and a long-lived refresh token.

**Endpoint:** `POST /auth/login/access-token`

**Request Headers:**
- `Content-Type: application/x-www-form-urlencoded`

**Request Body (Form Data):**
- `username`: `string` (Required)
- `password`: `string` (Required)
- `scope`: `string` (Optional, space-separated e.g., "user admin")

**Example Request (curl):**
```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/auth/login/access-token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=johndoe&password=mysecretpassword'
```

**Example Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 900,
  "scope": "user admin",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

---

### 2. Get Current User Profile (Me)
Retrieves the profile information of the currently authenticated user.

**Endpoint:** `GET /auth/me`

**Request Headers:**
- `Authorization: Bearer <access_token>`

**Example Request (curl):**
```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/auth/me' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...'
```

**Example Response (200 OK):**
```json
{
  "id": 1,
  "user_name": "johndoe",
  "access_type": "admin",
  "login_type": "email",
  "do_date": "2026-04-28T08:00:00Z"
}
```

---

### 3. Refresh Access Token
When the 15-minute `access_token` expires, the frontend must call this endpoint with the 7-day `refresh_token` to get a new session silently.

**Endpoint:** `POST /auth/login/refresh`

**Request Headers:**
- `Content-Type: application/json`

**Request Body (JSON):**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

**Example Request (curl):**
```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/auth/login/refresh' \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."}'
```

**Example Response (200 OK):**
```json
{
  "access_token": "new_eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 900,
  "scope": "user admin",
  "refresh_token": "new_refresh_eyJhbGciOiJIUzI1NiIsIn..."
}
```

---

### 4. Logout
Permanently logs the user out by deleting their active `refresh_token` from the database. Once their current 15-minute access token expires, they will be completely locked out.

**Endpoint:** `POST /auth/logout`

**Request Headers:**
- `Authorization: Bearer <access_token>`

**Example Request (curl):**
```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/auth/logout' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...'
```

**Example Response (200 OK):**
```json
{
  "message": "Successfully logged out of all sessions"
}
```

---

### 5. Request Login OTP
Generates a 6-digit OTP for the specified user and returns it (for development/testing).

**Endpoint:** `POST /auth/login/otp-request`

**Request Body (JSON):**
```json
{
  "user_name": "string"
}
```

---

### 6. Verify Login OTP
Verifies the 6-digit OTP and returns access tokens.

**Endpoint:** `POST /auth/login/otp-verify`

**Request Body (JSON):**
```json
{
  "user_name": "string",
  "otp_code": "string"
}
```

---

### 7. Setup Google Authenticator (TOTP)
Generates a TOTP secret and provisioning URI for the current user.

**Endpoint:** `POST /auth/totp/setup`

**Request Headers:**
- `Authorization: Bearer <access_token>`

**Example Response (200 OK):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "uri": "otpauth://totp/DigitLeaf:johndoe?secret=JBSWY3DPEHPK3PXP&issuer=DigitLeaf"
}
```

---

### 8. Enable Google Authenticator (TOTP)
Verifies the first TOTP code and permanently enables TOTP for the user.

**Endpoint:** `POST /auth/totp/enable`

**Request Headers:**
- `Authorization: Bearer <access_token>`

**Request Body (JSON):**
```json
{
  "user_name": "string",
  "totp_code": "string"
}
```

---

### 9. Verify Google Authenticator Login
Verifies the TOTP code during login and returns access tokens.

**Endpoint:** `POST /auth/login/totp-verify`

**Request Body (JSON):**
```json
{
  "user_name": "string",
  "totp_code": "string"
}
```

---

## 📋 System Audit Endpoints

### 5. View Audit Logs
Retrieves a paginated list of all system activity.
**Security:** Requires `admin` scope. Normal users will receive a 403 Forbidden error.

**Endpoint:** `GET /audit-logs/`

**Request Headers:**
- `Authorization: Bearer <access_token>` (Must have "admin" scope)

**Query Parameters:**
- `skip`: int (Default: 0)
- `limit`: int (Default: 100)

**Example Request (curl):**
```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/audit-logs/?skip=0&limit=10' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...'
```

**Example Response (200 OK):**
```json
[
  {
    "id": 1,
    "user_name": "admin_user",
    "endpoint": "/api/v1/auth/login/access-token",
    "method": "POST",
    "headers": "{\"host\": \"localhost:8000\", \"user-agent\": \"curl/7.81.0\"}",
    "body": "<redacted for security>",
    "ip_address": "127.0.0.1",
    "user_agent": "curl/7.81.0",
    "created_at": "2026-04-28T09:40:00.000Z"
  }
]
```

---

## 👥 User Management Endpoints

### 1. Create User
Creates a new user account with a designated role.
**Security:** Requires `manage_users` permission scope.

**Endpoint:** `POST /users/`

**Request Headers:**
- `Authorization: Bearer <access_token>`

**Request Body (JSON):**
```json
{
  "user_name": "new_farmer",
  "password": "StrongPassword123!",
  "role_name": "Farmer"
}
```

**Example Response (200 OK):**
```json
{
  "id": 2,
  "user_name": "new_farmer",
  "totp_enabled": false,
  "created_at": "2026-05-05T13:40:00.000Z"
}
```

---

### 2. Change Own Password
Allows the currently authenticated user to change their password by providing their current password.

**Endpoint:** `PATCH /users/me/password`

**Request Headers:**
- `Authorization: Bearer <access_token>`

**Request Body (JSON):**
```json
{
  "current_password": "OldPassword123",
  "new_password": "NewStrongPassword456!"
}
```

**Example Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

---

### 3. Admin Reset Password
Allows an administrator to forcefully reset the password of any user by their User ID, without needing their current password.
**Security:** Requires `manage_users` permission scope.

**Endpoint:** `PATCH /users/{user_id}/password`

**Request Headers:**
- `Authorization: Bearer <access_token>`

**Request Body (JSON):**
```json
{
  "new_password": "AdminForcedPassword789!"
}
```

**Example Response (200 OK):**
```json
{
  "message": "Password for user 'new_farmer' has been reset successfully"
}
```

---

## 🍂 Tobacco Purchase Endpoints

### 1. Create Tobacco Purchase
Creates a new tobacco purchase header with multiple item details in a single transaction.
**Endpoint:** `POST /tobacco-purchases/`

**Request Headers:**
- `Authorization: Bearer <access_token>`

**Request Body (JSON):**
```json
{
  "invoice_num": "string (Optional, auto-generated if omitted)",
  "buyer": 1,
  "vendor": "string (mf_id)",
  "v_addr": "string (address)",
  "region": 1,
  "tp_date": "2026-05-11",
  "tp_note": "string",
  "closing": "string",
  "oven": 1,
  "rate": 100,
  "details": [
    {
      "tobacco_name": 1,
      "qty": 50.5,
      "price": 10.0,
      "CreatedDate": "2026-05-11"
    }
  ]
}
```

### 2. List Tobacco Purchases
**Endpoint:** `GET /tobacco-purchases/`

**Query Parameters:**
- `skip`: int (Default: 0)
- `limit`: int (Default: 100)
- `search`: string (Optional, search by invoice or vendor)

### 3. Get Purchase Lookups (Dropdowns)
Endpoints for populating frontend selection menus:
- `GET /tobacco-purchases/purchasers`: List available buyers.
- `GET /tobacco-purchases/regions`: List available regions (where `do_now_show=0`).
- `GET /tobacco-purchases/ovens`: List all ovens.
- `GET /tobacco-purchases/tobacco-types`: List active tobacco types.

