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
