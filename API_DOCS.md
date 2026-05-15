# DigitLeaf API Documentation

Base URL: `http://localhost:8000/api/v1`

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Error responses always return:
```json
{ "detail": "Error message here" }
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Audit Logs](#audit-logs)
3. [User Management](#user-management)
4. [Sack Registration](#sack-registration)
5. [Weigh Leaf](#weigh-leaf)
6. [Tobacco Purchase](#tobacco-purchase)

---

## Authentication

### POST `/auth/login/access-token`
Standard OAuth2 password login. Returns a short-lived access token (8 hours) and a long-lived refresh token (7 days).

**Headers:** `Content-Type: application/x-www-form-urlencoded`

**Form Body:**
| Field | Type | Required |
|-------|------|----------|
| `username` | string | Yes |
| `password` | string | Yes |
| `scope` | string | No — space-separated e.g. `"user login_system"` |

**Response `200 OK` (normal login):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 28800,
  "scope": "user login_system",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "mfa_required": false,
  "username": "johndoe"
}
```

**Response `200 OK` (TOTP required — call `/auth/login/totp-verify` next):**
```json
{
  "access_token": "",
  "token_type": "mfa",
  "mfa_required": true,
  "username": "johndoe"
}
```

**Errors:** `400` Incorrect username or password

---

### POST `/auth/login/otp-request`
Generates a 6-digit OTP for the given user. Currently returns the OTP in the response body for development.

**Body (JSON):**
```json
{ "user_name": "johndoe" }
```

**Response `200 OK`:**
```json
{ "message": "OTP generated successfully", "otp": "482910" }
```

**Errors:** `404` User not found

---

### POST `/auth/login/otp-verify`
Verifies the 6-digit OTP and returns full auth tokens.

**Body (JSON):**
```json
{
  "user_name": "johndoe",
  "otp_code": "482910"
}
```

**Response `200 OK`:** Same shape as `/auth/login/access-token` success response.

**Errors:** `400` Invalid username or OTP / OTP has expired

---

### POST `/auth/login/totp-verify`
Verifies a TOTP code (Google Authenticator) during login and returns full auth tokens.

**Body (JSON):**
```json
{
  "user_name": "johndoe",
  "totp_code": "123456"
}
```

**Response `200 OK`:** Same shape as `/auth/login/access-token` success response.

**Errors:** `400` TOTP not enabled for user / Invalid TOTP code

---

### GET `/auth/me`
Returns the profile of the currently authenticated user.

**Auth required:** Yes

**Response `200 OK`:**
```json
{
  "id": 1,
  "user_name": "johndoe",
  "role": { "name": "staff" },
  "totp_enabled": false,
  "created_at": "2026-04-28T08:00:00+07:00"
}
```

---

### POST `/auth/login/refresh`
Exchanges a valid refresh token for a new access token. The old refresh token is deleted and a new one is issued (rotation).

**Body (JSON):**
```json
{ "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..." }
```

**Response `200 OK`:** Same shape as `/auth/login/access-token` success response.

**Errors:** `401` Invalid or expired refresh token / User no longer exists

---

### POST `/auth/logout`
Deletes all refresh tokens for the current user. The existing access token remains valid until it expires naturally (8 hours).

**Auth required:** Yes

**Response `200 OK`:**
```json
{ "message": "Successfully logged out of all sessions" }
```

---

### GET `/auth/sessions`
Lists all active refresh token sessions for the current user.

**Auth required:** Yes

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "user_name": "johndoe",
    "refresh_token": "eyJ...",
    "expires_at": "2026-05-22T08:00:00+07:00",
    "ip_address": "127.0.0.1",
    "user_agent": "Mozilla/5.0..."
  }
]
```

---

### POST `/auth/totp/setup`
Generates a new TOTP secret and QR provisioning URI for the current user. Must be followed by `/auth/totp/enable` to activate.

**Auth required:** Yes

**Response `200 OK`:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "uri": "otpauth://totp/DigitLeaf:johndoe?secret=JBSWY3DPEHPK3PXP&issuer=DigitLeaf"
}
```

**Errors:** `400` TOTP is already enabled

---

### POST `/auth/totp/enable`
Confirms the TOTP setup by verifying the first code. TOTP becomes active after this call.

**Auth required:** Yes

**Body (JSON):**
```json
{
  "user_name": "johndoe",
  "totp_code": "123456"
}
```

**Response `200 OK`:**
```json
{ "message": "TOTP enabled successfully" }
```

**Errors:** `400` Already enabled / Secret not generated (call `/totp/setup` first) / Invalid TOTP code

---

### POST `/auth/totp/disable`
Disables TOTP for the current user after verifying the current code.

**Auth required:** Yes

**Body (JSON):**
```json
{
  "user_name": "johndoe",
  "totp_code": "123456"
}
```

**Response `200 OK`:**
```json
{ "message": "TOTP disabled successfully" }
```

**Errors:** `400` Already disabled / Invalid TOTP code

---

## Audit Logs

### GET `/audit-logs/`
Returns a paginated list of all system activity.

**Auth required:** Yes — `admin` scope only

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `skip` | int | 0 |
| `limit` | int | 100 |

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "endpoint": "/api/v1/auth/login/access-token",
    "method": "POST",
    "ip_address": "127.0.0.1",
    "user_agent": "curl/7.81.0",
    "created_at": "2026-04-28T09:40:00+07:00"
  }
]
```

**Errors:** `403` Insufficient scope (non-admin users)

---

## User Management

### POST `/users/`
Creates a new user account with a designated role.

**Auth required:** Yes — `manage_users` scope

**Body (JSON):**
```json
{
  "user_name": "new_farmer",
  "password": "StrongPassword123!",
  "role_name": "Farmer"
}
```

**Constraints:** `user_name` 3–50 chars · `password` 8–128 chars · `role_name` must exist in DB

**Response `200 OK`:**
```json
{
  "id": 2,
  "user_name": "new_farmer",
  "role": { "name": "Farmer" },
  "totp_enabled": false,
  "created_at": "2026-05-05T13:40:00+07:00"
}
```

**Errors:** `400` Username already exists · `404` Role not found

---

### PATCH `/users/me/password`
Allows the authenticated user to change their own password.

**Auth required:** Yes

**Body (JSON):**
```json
{
  "current_password": "OldPassword123",
  "new_password": "NewStrongPassword456!"
}
```

**Response `200 OK`:**
```json
{ "message": "Password updated successfully" }
```

**Errors:** `400` Incorrect current password

---

### PATCH `/users/{user_id}/password`
Admin endpoint — forcefully resets a user's password without requiring their current password.

**Auth required:** Yes — `manage_users` scope

**Path Parameter:** `user_id` — integer

**Body (JSON):**
```json
{ "new_password": "AdminForcedPassword789!" }
```

**Response `200 OK`:**
```json
{ "message": "Password reset successfully by admin" }
```

**Errors:** `404` User not found

---

## Sack Registration

### GET `/sack-registrations/represents`
Returns all represents for dropdown population. Only represents with active 2026 farmer contracts are included.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
[
  { "represent_id": 1, "represent_name": "Kampong Cham", "farmer_count": 42 }
]
```

---

### GET `/sack-registrations/member-farmers`
Unified farmer lookup — fuzzy typeahead or exact match, always returns a list.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `q` | string | Fuzzy search — returns up to `limit` results |
| `name` | string | Exact name match (use without `q`) |
| `identity_card` | string | Exact ID card match (use without `q`; takes priority over `name`) |
| `represent_id` | int | Optional — scope fuzzy results to a represent |
| `limit` | int | Default `10` — applies to fuzzy mode only |

Provide either `q` (fuzzy) **or** `name`/`identity_card` (exact). The response is always a list. For exact lookup, check `list[0]` — empty list means no match.

**Response `200 OK`:**
```json
[
  { "mf_id": 10, "name": "Sok Chan", "mf_code": "KP-001", "address": "Kampong Cham" }
]
```

**Errors:** `400` No parameter provided

---

### GET `/sack-registrations/`
Returns a paginated, filterable list of sack registrations.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `skip` | int | 0 | |
| `limit` | int | 200 | |
| `search` | string | — | Matches farmer name or represent name |
| `status` | int | — | `0`=pending `1`=approved `2`=rejected |
| `date_from` | date | — | `YYYY-MM-DD` |
| `date_to` | date | — | `YYYY-MM-DD` |

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 1,
      "represent_id": 1,
      "represent_name": "Kampong Cham",
      "member_farmer_id": 10,
      "member_farmer_name": "Sok Chan",
      "dl_user_id": 2,
      "dl_user_name": "johndoe",
      "status": 0,
      "notes": null,
      "registered_at": "2026-05-01T08:00:00+07:00",
      "created_at": "2026-05-01T08:00:00+07:00",
      "updated_at": "2026-05-01T08:00:00+07:00"
    }
  ],
  "total": 150,
  "has_more": true
}
```

---

### GET `/sack-registrations/{sack_id}`
Returns a single sack registration by ID.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:** Single `SackRegistration` object (same shape as an item above).

**Errors:** `404` Sack registration not found

---

### POST `/sack-registrations/`
Creates a new sack registration. The farmer is resolved by name or identity card.

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{
  "represent_id": 1,
  "member_farmer_name": "Sok Chan",
  "member_farmer_identity_card": "KP-001",
  "status": 0,
  "notes": "Batch 3",
  "registered_at": "2026-05-10T08:00:00+07:00"
}
```

**Notes:**
- Either `member_farmer_name` or `member_farmer_identity_card` is required (not both needed)
- `registered_at` defaults to current timestamp if omitted
- `status` defaults to `0` (pending)

**Response `200 OK`:** Full `SackRegistration` object.

**Errors:** `404` Represent not found / Member farmer not found

---

### PATCH `/sack-registrations/{sack_id}`
Partially updates a sack registration. Changing `member_farmer_identity_card` re-links to a different farmer.

**Auth required:** Yes — `login_system` scope

**Body (JSON) — all fields optional:**
```json
{
  "member_farmer_identity_card": "KP-002",
  "status": 1,
  "notes": "Approved batch"
}
```

**Response `200 OK`:** Updated `SackRegistration` object.

**Errors:** `404` Record not found / Farmer not found

---

### DELETE `/sack-registrations/{sack_id}`
Deletes a sack registration and all associated weigh leaf records.

**Auth required:** Yes — `login_system` scope

**Response:** `204 No Content`

**Errors:** `404` Sack registration not found

---

## Weigh Leaf

### GET `/weigh-leaves/farmers/search`
Typeahead search for farmers by name or identity card.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `q` | string | Required |
| `limit` | int | 10 |

**Response `200 OK`:**
```json
[
  { "mf_id": 10, "name": "Sok Chan", "mf_code": "KP-001" }
]
```

---

### GET `/weigh-leaves/sack-registrations`
Returns all sack registrations belonging to a specific farmer.

**Auth required:** Yes — `login_system` scope

**Query Parameter:** `farmer_id` — integer (mf_id), required

**Response `200 OK`:**
```json
[
  { "id": 1, "sack_in_kg": 2 }
]
```

---

### GET `/weigh-leaves/leaf-types`
Returns all active tobacco leaf types for dropdown population.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
[
  { "t_id": 3, "t_name": "Grade A Leaf" }
]
```

---

### GET `/weigh-leaves/`
Returns a paginated list of all weigh leaf records, newest first.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| `skip` | int | 0 |
| `limit` | int | 100 |

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "sack_registration_id": 1,
    "sack_in_kg": 2,
    "user_id": 10,
    "user_name": "Sok Chan",
    "leaf_type_id": 3,
    "leaf_type_name": "Grade A Leaf",
    "total_in_kg": 85.5,
    "remork": 3,
    "total_weight_in_kg": 80.5,
    "dl_user_id": 2,
    "dl_user_name": "johndoe",
    "created_at": "2026-05-10T09:00:00+07:00",
    "updated_at": "2026-05-10T09:00:00+07:00"
  }
]
```

---

### POST `/weigh-leaves/`
Creates a new weigh leaf record. Automatically approves the linked sack registration (status → 1).

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{
  "sack_registration_id": 1,
  "leaf_type_id": 3,
  "total_in_kg": 85.5,
  "remork": 3
}
```

**Computed field:** `total_weight_in_kg = total_in_kg - remork - sack_in_kg`

**Response `200 OK`:** Full `WeighLeaf` object.

**Errors:** `404` Sack registration not found / Leaf type not found

---

### PATCH `/weigh-leaves/{weigh_id}`
Partially updates a weigh leaf record. Changing `leaf_type_id` re-links to a different leaf type.

**Auth required:** Yes — `login_system` scope

**Body (JSON) — all fields optional:**
```json
{
  "leaf_type_id": 4,
  "total_in_kg": 90.0,
  "remork": 2
}
```

**Response `200 OK`:** Updated `WeighLeaf` object.

**Errors:** `404` Record not found / Leaf type not found

---

### DELETE `/weigh-leaves/{weigh_id}`
Deletes a weigh leaf record.

**Auth required:** Yes — `login_system` scope

**Response:** `204 No Content`

**Errors:** `404` Weigh leaf record not found

---

## Tobacco Purchase

### GET `/tobacco-purchases/purchasers`
Returns all active purchasers (buyers) for dropdown population.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
[
  { "p_id": 1, "p_name": "Buyer Co. Ltd" }
]
```

---

### GET `/tobacco-purchases/regions`
Returns all active regions (`do_not_show = 0`) for dropdown population.

**Auth required:** Yes — `login_system` scope

---

### GET `/tobacco-purchases/ovens`
Returns all active ovens (`do_not_show = 0`) for dropdown population.

**Auth required:** Yes — `login_system` scope

---

### GET `/tobacco-purchases/tobacco-types`
Returns all active tobacco types (category 2, not discontinued).

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
[
  { "t_id": 3, "t_name": "Grade A", "t_name_kh": "ថ្នាក់ A" }
]
```

---

### GET `/tobacco-purchases/vendors`
Returns all active member farmers belonging to a buyer's represent groups.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `buyer_id` | int | Yes |

**Response `200 OK`:**
```json
[
  { "mf_id": 10, "name": "Sok Chan", "mf_code": "KP-001", "address": "Kampong Cham" }
]
```

---

### POST `/tobacco-purchases/`
Creates a new tobacco purchase header with all line item details in a single transaction. Invoice number is auto-generated.

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{
  "buyer": 1,
  "vendor": "Sok Chan",
  "v_addr": "Kampong Cham",
  "region": 2,
  "tp_date": "2026-05-11",
  "tp_note": "Morning batch",
  "closing": "NO",
  "oven": 1,
  "rate": 100,
  "details": [
    {
      "tobacco_name": 3,
      "gross_weight": 90.0,
      "price": 1200.0,
      "remork_in_kg": 3.0,
      "sack_in_kg": 2.0,
      "CreatedDate": "2026-05-11",
      "closing": "NO",
      "buyer": 1,
      "oven": 1,
      "region": 2
    }
  ]
}
```

**Notes:**
- `invoice_num` is auto-generated in format `YYYYMMDD-00001` and should not be sent
- `closing`: `"YES"` or `"NO"`
- `rate` is required
- Per detail: `net = gross_weight - remork_in_kg - sack_in_kg`, `total_amount = net × price`
- If the vendor has a pending sack registration (`status=0`) and `sack_in_kg > 0`, it is auto-approved

**Response `200 OK`:**
```json
{
  "tp_id": 1,
  "invoice_num": "20260511-00000",
  "buyer": 1,
  "vendor": "Sok Chan",
  "v_addr": "Kampong Cham",
  "region": 2,
  "tp_date": "2026-05-11",
  "tp_note": "Morning batch",
  "closing": "NO",
  "oven": 1,
  "rate": 100,
  "user": "johndoe",
  "do_date": "2026-05-11T08:00:00+07:00",
  "tobacco_item_count": 1,
  "total_net_weight": 85.0,
  "grand_total": 102000.0,
  "details": [
    {
      "tpd_id": 1,
      "invoice_num": "20260511-00000",
      "tobacco_name": 3,
      "gross_weight": 90.0,
      "price": 1200.0,
      "remork_in_kg": 3.0,
      "sack_in_kg": 2.0,
      "CreatedDate": "2026-05-11",
      "closing": "NO",
      "buyer": 1,
      "oven": 1,
      "region": 2,
      "m_id": 1,
      "total_amount": 102000.0,
      "user": "johndoe",
      "do_date": "2026-05-11T08:00:00+07:00"
    }
  ]
}
```

---

### GET `/tobacco-purchases/`
Returns a paginated, searchable list of tobacco purchases.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `skip` | int | 0 | |
| `limit` | int | 100 | |
| `search` | string | — | Matches invoice number or vendor name |

**Response `200 OK`:**
```json
{
  "items": [ /* Purchase objects */ ],
  "total": 200
}
```

---

### GET `/tobacco-purchases/{tp_id}`
Returns a single tobacco purchase including all detail lines.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:** Full `Purchase` object (same shape as create response).

**Errors:** `404` Tobacco purchase not found

---

### PATCH `/tobacco-purchases/{tp_id}`
Updates a tobacco purchase header and optionally replaces all detail lines.

**Auth required:** Yes — `login_system` scope

**Body (JSON) — all fields optional:**
```json
{
  "vendor": "New Vendor Name",
  "tp_date": "2026-05-12",
  "rate": 110,
  "details": [ /* If provided, ALL existing details are replaced */ ]
}
```

**Response `200 OK`:** Updated full `Purchase` object.

**Errors:** `404` Tobacco purchase not found

---

### DELETE `/tobacco-purchases/{tp_id}`
Deletes a tobacco purchase and all its detail lines (cascade).

**Auth required:** Yes — `login_system` scope

**Response:** `204 No Content`

**Errors:** `404` Tobacco purchase not found

---

## Permission Scopes Reference

| Scope | Description |
|-------|-------------|
| `user` | Base scope — included in all tokens |
| `login_system` | Access to all domain endpoints (sack, weigh, purchase) |
| `manage_users` | Create users, reset any password |
| `admin` | Access audit logs |

---

## Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created — returned by all POST create endpoints |
| `204` | Success — no content (DELETE) |
| `400` | Bad request (validation failure, wrong password, duplicate) |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (insufficient scope) |
| `404` | Resource not found |
| `422` | Unprocessable entity (Pydantic validation error) |
| `500` | Internal server error |
