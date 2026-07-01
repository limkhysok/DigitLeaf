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

Uploaded/processed images (tobacco purchase detail `picture`) are served statically from `/uploads/<year>/<month>/<file>.webp`.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Audit Logs](#audit-logs)
3. [User Management](#user-management)
4. [Farmers](#farmers)
5. [Farmer Contract](#farmer-contract)
6. [Sack Registration](#sack-registration)
7. [Tobacco Purchase](#tobacco-purchase)
8. [Tobacco Repay (Contracts & Repayments)](#tobacco-repay-contracts--repayments)
9. [Dashboard](#dashboard)

---

## Authentication

### POST `/auth/login/access-token`
Standard OAuth2 password login. Returns a short-lived access token (8 hours) and a long-lived refresh token (7 days). There is no MFA/OTP/TOTP step — this returns full tokens directly.

**Headers:** `Content-Type: application/x-www-form-urlencoded`

**Form Body:**
| Field | Type | Required |
|-------|------|----------|
| `username` | string | Yes |
| `password` | string | Yes |
| `scope` | string | No — space-separated e.g. `"login_system manage_users"`; restricts the issued token to the intersection with the user's actual permissions |

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 28800,
  "scope": "user login_system",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

**Errors:** `400` Incorrect username or password

---

### GET `/auth/me`
Returns the profile of the currently authenticated user.

**Auth required:** Yes

**Response `200 OK`:**
```json
{
  "id": 1,
  "user_name": "johndoe",
  "access_type": "all",
  "login_type": "1",
  "regions": [1, 2, 3],
  "do_date": "2026-04-28T08:00:00+07:00",
  "role_id": 4,
  "role_name": "field_staff"
}
```

---

### POST `/auth/login/refresh`
Exchanges a valid refresh token for a new access token. The old refresh token is deleted and a new one is issued (rotation).

**Body (JSON):**
```json
{ "refresh_token": "eyJhbGciOiJIUzI1NiIsIn..." }
```

**Response `200 OK`:** Same shape as `/auth/login/access-token`.

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

## Audit Logs

Backed by the legacy `user_action` table. Only rows whose `page_name` starts with a monitored prefix (`sack-registrations`, `tobacco-purchases`, `tobacco-repays`, `farmer-contract`, `users`) are returned.

### GET `/audit-logs/`
Returns a paginated list of monitored-domain activity, newest first.

**Auth required:** Yes — `view_audit_logs` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | 1 | |
| `limit` | int | 20 | Max `200` |
| `action` | string | — | Comma-separated, e.g. `"UPDATE,DELETE"` |
| `since` | datetime | — | Only rows with `date > since` |

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 1,
      "page_name": "/api/v1/sack-registrations/42",
      "field_type": "sack_in_kg",
      "old_value": "20.0",
      "new_value": "25.0",
      "user": "johndoe",
      "action": "UPDATE",
      "ip_address": "127.0.0.1",
      "date": "2026-04-28T09:40:00+07:00"
    }
  ],
  "total": 1,
  "has_more": false
}
```

**Errors:** `403` Insufficient scope (missing `view_audit_logs`)

---

## User Management

### GET `/users/`
Returns a paginated list of user accounts with their assigned role.

**Auth required:** Yes — `manage_users` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | 1 | |
| `limit` | int | 50 | Max `200` |

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 2,
      "user_name": "new_farmer",
      "access_type": "",
      "login_type": "",
      "regions": [1, 2],
      "do_date": "2026-05-05T13:40:00+07:00",
      "role_id": 4,
      "role_name": "field_staff"
    }
  ],
  "total": 1,
  "has_more": false
}
```

---

### POST `/users/`
Creates a new user account (password is stored as given — hashing happens on login comparison via `security.verify_password`; roles are assigned separately via `PUT /users/{user_id}/role`).

**Auth required:** Yes — `manage_users` scope

**Body (JSON):**
```json
{
  "user_name": "new_farmer",
  "password": "StrongPassword123!",
  "access_type": "",
  "login_type": "",
  "regions": [1, 2]
}
```

**Constraints:** `user_name` 3–50 chars · `password` 8–128 chars

**Response `201 Created`:** `UserPublic` object (same shape as a list item, `role_id`/`role_name` are `null` until assigned).

**Errors:** `400` Username already exists

---

### GET `/users/regions`
Returns all regions assignable to a user (dropdown population).

**Auth required:** Yes — `manage_users` scope

---

### PUT `/users/{user_id}/regions`
Replaces the full set of region IDs a user is assigned to.

**Auth required:** Yes — `manage_users` scope

**Body (JSON):**
```json
{ "regions": [1, 2, 3] }
```

**Response `200 OK`:** Updated `UserPublic` object.

**Errors:** `404` User not found

---

### GET `/users/roles`
Returns all available roles (dropdown population).

**Auth required:** Yes — `manage_users` scope

**Response `200 OK`:**
```json
[{ "id": 4, "name": "field_staff", "description": "Field staff working directly with farmers/regions" }]
```

---

### PUT `/users/{user_id}/role`
Assigns (or reassigns) a single role to a user.

**Auth required:** Yes — `manage_users` scope

**Body (JSON):**
```json
{ "role_id": 4 }
```

**Response `200 OK`:** Updated `UserPublic` object.

**Errors:** `404` User not found

---

### DELETE `/users/{user_id}`
Deletes a user account.

**Auth required:** Yes — `manage_users` scope

**Response:** `204 No Content`

**Errors:** `400` Cannot delete your own account, or a user with the `admin`/`boss` role · `404` User not found

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

## Farmers

Read-only lookups over `represent` and `member_farmer`, used to populate dropdowns/typeahead in other domains.

### GET `/farmers/represents`
Returns all represents for dropdown population, with a farmer count per represent.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
[{ "represent_id": 1, "represent_name": "Kampong Cham", "farmer_count": 42 }]
```

---

### GET `/farmers/member-farmers`
Unified farmer lookup: either a paginated fuzzy typeahead (`q`) or an exact match (`name`/`identity_card`).

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `q` | string | Fuzzy search — paginated by `page`/`limit` |
| `name` | string | Exact name match (use without `q`) |
| `identity_card` | string | Exact ID card match (use without `q`; takes priority over `name`) |
| `represent_id` | int | Optional — scope fuzzy results to a represent |
| `page` | int | Default `1` — fuzzy mode only |
| `limit` | int | Default `20`, max `200` — fuzzy mode only |

Provide either `q` (fuzzy) **or** `name`/`identity_card` (exact). The response is always a list. For exact lookup, check `list[0]` — empty list means no match.

**Response `200 OK`:**
```json
[
  { "mf_id": 10, "name": "Sok Chan", "mf_code": "KP-001", "address": "Kampong Cham", "represent_id": 1, "represent_name": "Kampong Cham" }
]
```

**Errors:** `400` No parameter provided (must pass `q`, `name`, or `identity_card`)

---

## Farmer Contract

CRUD over `mf_con_year` — a farmer's per-year contracted tobacco type, land size, and sapling count.

### GET `/farmer-contract/form-metadata`
Returns active tobacco types for the create/edit contract form.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
{ "tobacco_types": [{ "t_id": 3, "t_name": "Grade A", "t_name_kh": "ថ្នាក់ A" }] }
```

---

### GET `/farmer-contract/`
Returns a paginated, searchable list of contracts for a given year, including expected yield (`tobac_num * 0.8`) and weight already purchased against that farmer this year.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `year` | int | `2026` | |
| `page` | int | 1 | |
| `limit` | int | 20 | Max `500` |
| `search` | string | — | Matches farmer name/code |

**Response `200 OK`:**
```json
{
  "items": [
    {
      "mf_con_id": 15,
      "mf_id": 4,
      "year": 2026,
      "name": "Sok Chan",
      "mf_code": "KP-001",
      "t_id": 3,
      "land": 2.5,
      "tobac_num": 12000,
      "expected_yield": 9600.0,
      "purchased_weight": 350.0,
      "do_date": "2026-04-01"
    }
  ],
  "total": 1,
  "has_more": false
}
```

---

### POST `/farmer-contract/`
Creates a new yearly contract for a farmer. `mf_code` is snapshotted from the farmer record at creation time.

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{ "mf_id": 4, "t_id": 3, "year": 2026, "land": 2.5, "tobac_num": 12000 }
```

**Response `201 Created`:**
```json
{ "mf_con_id": 15, "mf_id": 4, "year": 2026, "land": 2.5, "tobac_num": 12000 }
```

---

### GET `/farmer-contract/{mf_con_id}`
Returns a single contract (same shape as a list item).

**Auth required:** Yes — `login_system` scope

**Errors:** `404` Farmer contract not found

---

### PUT `/farmer-contract/{mf_con_id}`
Full update — all fields required (same body shape as create).

**Auth required:** Yes — `login_system` scope

**Errors:** `404` Contract or farmer not found

---

### PATCH `/farmer-contract/{mf_con_id}`
Partial update — all fields optional.

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{ "land": 3.0 }
```

**Errors:** `404` Contract or farmer not found

---

### DELETE `/farmer-contract/{mf_con_id}`
Deletes a contract.

**Auth required:** Yes — `login_system` scope

**Response:** `204 No Content`

**Errors:** `404` Contract not found

---

## Sack Registration

Tracks empty sacks handed out to farmers so their weight can be deducted from gross tobacco weight at purchase time. **`status` is not a stored column** — "pending" vs "confirmed" is derived on every read from a FIFO calculation: a registration is `confirmed` once its sack weight has been fully consumed (in registration order) by non-`farmer_own_sack` purchase details for that farmer.

### GET `/sack-registrations/`
Returns a paginated, filterable list of sack registrations. Default order is pending-first, then confirmed, each by newest first; passing `status` switches to newest-first only.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | 1 | |
| `limit` | int | 20 | Max `200` |
| `search` | string | — | Matches farmer name/code or represent name |
| `date_from` / `date_to` | date | — | `YYYY-MM-DD`, filters on `created_at` |
| `sort_sack_in_kg` | `asc` \| `desc` | — | Sorts by remaining balance |
| `status` | `pending` \| `confirmed` | — | Derived, see above |
| `represent_id` | int | — | |

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 1,
      "represent_id": 1,
      "represent_name": "Kampong Cham",
      "farmer_id": 10,
      "member_farmer_name": "Sok Chan",
      "member_farmer_mf_code": "KP-001",
      "action_by_id": 2,
      "action_by": "johndoe",
      "sack_in_kg": 20.0,
      "registered_sack_in_kg": 50.0,
      "notes": null,
      "created_at": "2026-05-01T08:00:00+07:00",
      "updated_at": "2026-05-01T08:00:00+07:00"
    }
  ],
  "total": 150,
  "has_more": true
}
```
* `sack_in_kg`: remaining unconsumed balance (the derived FIFO value) — display this.
* `registered_sack_in_kg`: the raw stored value from when the registration was created/edited.

---

### GET `/sack-registrations/export`
Same filters as the list endpoint (minus pagination/sort), streamed as an `.xlsx` workbook with a totals row. Capped at 10,000 rows.

**Auth required:** Yes — `login_system` scope

**Errors:** `400` Export exceeds 10,000 records — narrow filters

---

### GET `/sack-registrations/stats`
Returns registration counts and sack-weight totals for dashboard cards.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
{
  "registration_counts": { "total": 140, "today": 5 },
  "sack_weight_kg": { "total": 3200.0, "today": 100.0, "yesterday": 80.0 },
  "change_pct": 25.0
}
```

---

### GET `/sack-registrations/{sack_id}`
Returns a single sack registration by ID (same shape as a list item).

**Auth required:** Yes — `login_system` scope

**Errors:** `404` Sack registration not found

---

### POST `/sack-registrations/`
Creates a new sack registration. The farmer is resolved by name or identity card (`mf_code`).

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{
  "represent_id": 1,
  "member_farmer_name": "Sok Chan",
  "member_farmer_identity_card": "KP-001",
  "sack_in_kg": 50.0,
  "notes": "Batch 3"
}
```

**Notes:**
- Either `member_farmer_name` or `member_farmer_identity_card` is required (not both needed)
- `sack_in_kg` must have at most 2 decimal places

**Response `201 Created`:** Full registration object (as in the list response).

**Errors:** `404` Represent not found / Member farmer not found

---

### PATCH `/sack-registrations/{sack_id}`
Partially updates a sack registration. Changing `member_farmer_mf_code` re-links to a different farmer (must belong to the effective represent). Changing `represent_id` alone re-validates that the existing farmer still belongs to it.

**Auth required:** Yes — `login_system` scope

**Body (JSON) — all fields optional:**
```json
{ "member_farmer_mf_code": "KP-002", "notes": "Corrected farmer" }
```

**Response `200 OK`:** Updated registration object.

**Errors:** `404` Record not found / Represent not found / Farmer not found · `422` Farmer does not belong to the selected represent

---

### DELETE `/sack-registrations/{sack_id}`
Deletes a sack registration.

**Auth required:** Yes — `login_system` scope

**Response:** `204 No Content`

**Errors:** `404` Sack registration not found

---

## Tobacco Purchase

### GET `/tobacco-purchases/form-metadata`
Convenience endpoint bundling purchasers, regions, ovens, and tobacco types in one call (equivalent to calling the four endpoints below individually).

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
{
  "purchasers": [{ "p_id": 1, "p_name": "Buyer Co. Ltd", "p_name_kh": null, "region": 2, "do_not_show": 0 }],
  "regions": [{ "reg_id": 2, "reg_name": "Region B", "reg_name_kh": null, "do_not_show": 0, "w_id": 0 }],
  "ovens": [{ "id": 1, "name_en": "Oven 1", "name_kh": null, "do_not_show": 0 }],
  "tobacco_types": [{ "t_id": 3, "t_name": "Grade A", "t_name_kh": "ថ្នាក់ A" }]
}
```

---

### GET `/tobacco-purchases/purchasers`
Returns purchasers belonging to a represent with `do_not_show = 0` ("active").

**Auth required:** Yes — `login_system` scope

---

### GET `/tobacco-purchases/regions`
Returns distinct regions linked to an active purchaser/represent.

**Auth required:** Yes — `login_system` scope

---

### GET `/tobacco-purchases/ovens`
Returns all ovens with `do_not_show = 0`.

**Auth required:** Yes — `login_system` scope

---

### GET `/tobacco-purchases/tobacco-types`
Returns tobacco types with `t_cate = 2` (leaf) and `discontinue = 0`.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
[{ "t_id": 3, "t_name": "Grade A", "t_name_kh": "ថ្នាក់ A" }]
```

---

### GET `/tobacco-purchases/vendor-sack`
Returns the farmer's available sack quota: `SUM(all sack registrations) - SUM(purchase details where farmer_own_sack=0)`. Used to validate and auto-populate weights in the purchase dialog.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `vendor_id` | int | Yes — `member_farmer.mf_id` |

**Response `200 OK`:**
```json
{ "sack_in_kg": 20.0, "total_sack_in_kg": 20.0 }
```
Both fields currently return the same available-quota value.

---

### GET `/tobacco-purchases/vendors`
Returns active (`active = "YES"`) member farmers with a current-year contract, either scoped to one buyer's represent groups or via a name/code search across all buyers.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `buyer_id` | int | If given, returns all vendors under that buyer's represents (with `purchased_weight` this year) |
| `search` | string | Used only when `buyer_id` is omitted — name/code search across all buyers (max 20 results) |

**Response `200 OK`:**
```json
[{ "mf_id": 10, "name": "Sok Chan", "mf_code": "KP-001", "address": "Kampong Cham", "tobac_num": 12000, "purchased_weight": 350.0, "buyer_id": 1 }]
```

---

### POST `/tobacco-purchases/`
Creates a tobacco purchase header with its line items in a single transaction, and/or standalone contract repayments (`returns`). Invoice number is auto-generated.

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{
  "buyer": 1,
  "vendor_id": 10,
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
      "farmer_own_sack": 0,
      "closing": "NO",
      "buyer": 1,
      "oven": 1,
      "region": 2,
      "picture": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
  ],
  "returns": [
    { "con_id": 7, "tobac_type": 3, "qty_repay": 15.0 }
  ]
}
```

**Notes:**
- `invoice_num` is auto-generated in format `TPddmmyy-NN` (daily sequence) and should not be sent
- `vendor_id` is `member_farmer.mf_id` (stored internally as a string column)
- `closing`: `"YES"` or `"NO"`
- `rate` is required
- Per detail: `net = gross_weight - remork_in_kg - sack_in_kg`, `qty = net`, `total_amount = net × price`
- `farmer_own_sack: 1` skips sack-quota deduction/validation for that line (farmer brought their own sack)
- `sack_in_kg` across non-own-sack details must not exceed the vendor's available sack quota (see `/vendor-sack`), or the request fails with `400`
- `picture` accepts a base64 data URL (decoded, EXIF-corrected, center-cropped to a square, and saved as `.webp` under `uploads/<year>/<month>/`) or an existing path/URL to keep unchanged
- `details` may be omitted entirely for a **repay-only** submission — no invoice/header row is created, only `t_contract_repay` rows from `returns`
- `returns` repays one or more `t_contract` records; the requested `qty_repay` per contract cannot exceed `contract.qty - already repaid`, or the request fails with `400`
- Each return's `tobac_type` must match its contract's `tobac_type`, or the request fails with `404`

**Response `201 Created`:**
```json
{
  "purchase": {
    "tp_id": 1,
    "invoice_num": "TP110526-01",
    "buyer": 1,
    "vendor_id": 10,
    "vendor_name": "Sok Chan",
    "v_addr": "Kampong Cham",
    "region": 2,
    "tp_date": "2026-05-11",
    "tp_note": "Morning batch",
    "closing": "NO",
    "oven": 1,
    "rate": 100,
    "user": "johndoe",
    "do_date": "2026-05-11T08:00:00+07:00",
    "total_net_weight": 85.0,
    "grand_total": 102000.0,
    "tobacco_item_count": 1,
    "details": [
      {
        "tpd_id": 1,
        "invoice_num": "TP110526-01",
        "tobacco_name": 3,
        "gross_weight": 90.0,
        "price": 1200.0,
        "remork_in_kg": 3.0,
        "sack_in_kg": 2.0,
        "farmer_own_sack": 0,
        "closing": "NO",
        "buyer": 1,
        "oven": 1,
        "region": 2,
        "total_amount": 102000.0,
        "picture": "2026/05/tobacco_detail_ab12cd34.webp",
        "user": "johndoe",
        "do_date": "2026-05-11T08:00:00+07:00"
      }
    ]
  },
  "repays": [
    {
      "repay_id": 5, "repay_date": "2026-05-11", "repay_num": "TR110526-01",
      "con_num": "110526-0002", "representative": "Kampong Cham", "farmer_name": "Sok Chan",
      "tobacco_type": "Virginia", "qty_repay": 15.0, "note": "Morning batch", "user": "johndoe",
      "contract_year": 2026, "con_id": 7, "f_id": 10, "oven": 1, "edit_user": null, "edit_do_date": null
    }
  ]
}
```
`purchase` is `null` when the submission was repay-only (no `details`).

**Errors:** `400` Validation failure (sack quota exceeded, repay quota exceeded, tobacco type mismatch, image processing failure)

---

### GET `/tobacco-purchases/`
Returns a paginated, searchable, sortable list of tobacco purchases, restricted to vendors with a current-year contract.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | 1 | |
| `limit` | int | 20 | Max `500` |
| `search` | string | — | Matches invoice number, vendor name, or purchaser name |
| `buyer` | int | — | Filter by purchaser ID |
| `region` | int | — | Filter by region ID |
| `sort_grand_total` | `asc` \| `desc` | — | |
| `sort_net_weight` | `asc` \| `desc` | — | Ignored if `sort_grand_total` is set |

**Response `200 OK`:**
```json
{ "items": [ /* PurchaseListItem objects — header fields only, no details */ ], "total": 200, "has_more": true }
```

---

### GET `/tobacco-purchases/report/template`
Streams an `.xlsx` settlement report for one buyer within a date range (defaults to up-to-today, capped at 10,000 purchases).

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `buyer_id` | int | Yes |
| `date_from` / `date_to` | date | No |

**Errors:** `400` Export exceeds 10,000 records — narrow the date range

---

### GET `/tobacco-purchases/{tp_id}`
Returns a single tobacco purchase including all detail lines.

**Auth required:** Yes — `login_system` scope

**Errors:** `404` Tobacco purchase not found

---

### PATCH `/tobacco-purchases/{tp_id}`
Updates a tobacco purchase header and optionally replaces all detail lines and/or adds contract repayments.

**Auth required:** Yes — `login_system` scope

**Body (JSON) — all fields optional:**
```json
{
  "vendor_id": 11,
  "tp_date": "2026-05-12",
  "rate": 110,
  "details": [ /* If provided, ALL existing details are replaced */ ],
  "returns": [ /* Additional repayments to create (does not replace existing ones) */ ]
}
```

**Response `200 OK`:** Updated full purchase object.

**Errors:** `404` Tobacco purchase not found · `400` Sack/repay quota validation failure

---

### DELETE `/tobacco-purchases/{tp_id}`
Deletes a tobacco purchase and all its detail lines (cascade).

**Auth required:** Yes — `login_system` scope

**Response:** `204 No Content`

**Errors:** `404` Tobacco purchase not found

---

### PATCH `/tobacco-purchases/{tp_id}/details/{tpd_id}`
Updates a single detail line in place (net weight/total are recomputed if weight or price fields change; sack quota is re-validated if `sack_in_kg`/`farmer_own_sack` change). Parent header totals are recomputed from all detail rows afterward.

**Auth required:** Yes — `login_system` scope

**Body (JSON) — all fields optional:** same fields as a detail create.

**Response `200 OK`:** Updated full purchase object.

**Errors:** `404` Tobacco purchase or detail not found · `400` Sack quota validation failure

---

### DELETE `/tobacco-purchases/{tp_id}/details/{tpd_id}`
Deletes a single detail line and recomputes parent header totals. Refuses to delete the last remaining line on a purchase.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:** Updated full purchase object.

**Errors:** `404` Tobacco purchase or detail not found · `400` Cannot delete the last item — delete the whole purchase instead

---

## Tobacco Repay (Contracts & Repayments)

Two related record types: `t_contract` (a signed advance/contract with a farmer for a quantity of tobacco) and `t_contract_repay` (a repayment against a contract's quota, either standalone or bundled into a tobacco purchase submission — see `POST /tobacco-purchases/` above).

### GET `/tobacco-repays/`
Returns a paginated list of contracts for a given year with total quantity contracted and total repaid so far.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | 1 | |
| `limit` | int | 20 | Max `200` |
| `year` | int | previous calendar year | Filters by `mf_con_year.year` matched to the contract's farmer/year |
| `search` | string | — | Matches contract number, contractor name, or represent name |

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 12, "contract_number": "110526-0002", "contract_contractor_name": "Sok Chan",
      "representative": "Kampong Cham", "contract_year": 2026, "mf_con_id": 15, "f_id": 4,
      "farmer_name": "Sok Chan", "tobacco_type": "Virginia", "Quantity": 500.0, "total_repaid": 150.0
    }
  ],
  "total": 40,
  "has_more": true
}
```

---

### GET `/tobacco-repays/history`
Returns a paginated list of individual repayment records (flat, one row per repay), filterable independently of the contract-level list above.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `page` / `limit` | int | Default `1` / `20`, max `200` |
| `year` | int | Defaults to previous calendar year if no filter given |
| `representative_id` | int | Filter by represent |
| `date_from` / `date_to` | date | Filter on `repay_date` |
| `search` | string | Matches contract number, repay number, farmer name, or represent name |

**Response `200 OK`:**
```json
{
  "items": [
    {
      "repay_id": 5, "repay_date": "2026-05-11", "repay_num": "TR110526-01", "con_num": "110526-0002",
      "representative": "Kampong Cham", "farmer_name": "Sok Chan", "tobacco_type": "Virginia",
      "qty_repay": 15.0, "note": "Morning batch", "user": "johndoe", "contract_year": 2026
    }
  ],
  "total": 5,
  "has_more": false
}
```

---

### GET `/tobacco-repays/history/export`
Streams an `.xlsx` repay-history report for the given filters. Capped at 10,000 rows.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `date_from` / `date_to` | date | Yes |
| `representative_id` | int | No |

**Errors:** `400` Export exceeds 10,000 records — narrow the date range

---

### GET `/tobacco-repays/years`
Returns up to the 7 most recent contract years (≤ current year) that have any `mf_con_year` data — for a year-filter dropdown.

**Auth required:** Yes — `login_system` scope

---

### POST `/tobacco-repays/`
Creates a standalone repayment against an existing contract.

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{
  "con_id": 7,
  "con_num": "110526-0002",
  "f_id": 4,
  "repay_num": "TR110526-02",
  "repay_date": "2026-05-12",
  "qty_repay": 20.0,
  "note": "Second batch",
  "oven": 1
}
```
`repay_num` is optional — omit it to have the server generate one (see `/next-repay-num`).

**Response `201 Created`:** `TContractRepayRead` object.

**Errors:** `404` Contract not found · `400` Repay quantity exceeds remaining balance

---

### GET `/tobacco-repays/next-repay-num`
Returns the next `repay_num` that would be generated (format `TR` + `DDMMYY` + `-` + 2-digit daily sequence, e.g. `TR200626-01`) — for pre-filling the create form.

**Auth required:** Yes — `login_system` scope

---

### GET `/tobacco-repays/next-contract-num`
Returns the next `con_num` that would be generated (format `DDMMYY-NNNN`, daily sequence) — for pre-filling the create-contract form.

**Auth required:** Yes — `login_system` scope

---

### GET `/tobacco-repays/tobacco-types`
Returns contract tobacco types (`con_tobacco`, joined to their `tobacco_groups` label) for a dropdown.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
[{ "t_id": 3, "tobacco": "Virginia", "group_id": 1, "group_name": "Leaf" }]
```

---

### GET `/tobacco-repays/contracts`
Returns all contracts belonging to a given vendor (matched by farmer name), with total repaid so far per contract.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Required |
|-------|------|----------|
| `vendor_id` | int | Yes — `member_farmer.mf_id` |

---

### GET `/tobacco-repays/contracts/{con_id}/detail`
Returns a single contract with its full list of repayments.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:** `TobaccoRepayContractDetail` — same header fields as a `GET /tobacco-repays/` item plus `repays: [{ repay_id, repay_date, repay_num, qty_repay, note, user }]`.

**Errors:** `404` Contract not found

---

### POST `/tobacco-repays/contracts`
Creates a new contract with a farmer. If `con_num` is omitted it's auto-generated; demographic snapshot fields not supplied default to empty/zero (the model has `NOT NULL` constraints with no DB defaults on most of them).

**Auth required:** Yes — `login_system` scope

**Body (JSON):**
```json
{
  "contractor": "Sok Chan",
  "f_id": 4,
  "tobac_type": 3,
  "qty": 500.0,
  "price": 8000.0,
  "con_date": "2026-05-11",
  "represent": "1",
  "note": "Advance for planting season"
}
```

**Response `201 Created`:** `TContractRead` object.

**Errors:** `404` Farmer or tobacco type not found · `409` Contract number already exists

---

### GET `/tobacco-repays/{repay_id}`
Returns a single repayment record with joined contract/farmer/tobacco-type info.

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:** `RepayHistoryDetail` (history item fields plus `con_id`, `f_id`, `oven`, `edit_user`, `edit_do_date`).

**Errors:** `404` Repay record not found

---

### PATCH `/tobacco-repays/{repay_id}`
Partially updates a repayment. If `qty_repay` changes, it's re-validated against the contract's remaining quota (excluding this repayment's own current amount).

**Auth required:** Yes — `login_system` scope

**Body (JSON) — all fields optional:**
```json
{ "qty_repay": 25.0, "note": "Corrected amount" }
```

**Response `200 OK`:** `TContractRepayRead` object.

**Errors:** `404` Repay record not found · `400` Repay quantity exceeds remaining balance

---

### DELETE `/tobacco-repays/{repay_id}`
Deletes a repayment record.

**Auth required:** Yes — `login_system` scope

**Response:** `204 No Content`

**Errors:** `404` Repay record not found

---

## Dashboard

Read-only aggregate/reporting endpoints for the landing dashboard.

### GET `/dashboard/summary`
Returns the combined summary cards: today's purchases (+ day-over-day change), sack registration stats (same shape as `/sack-registrations/stats`), outstanding repay balance for the current contract year, and this year's farmer-contract totals (+ year-over-year change).

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
{
  "today_purchases": { "count": 12, "net_weight_kg": 850.0, "grand_total": 1020000.0, "yesterday_net_weight_kg": 700.0, "change_pct": 21.4 },
  "sack_registration": { "registration_counts": { "total": 140, "today": 5 }, "sack_weight_kg": { "total": 3200.0, "today": 100.0, "yesterday": 80.0 }, "change_pct": 25.0 },
  "outstanding_repay": { "year": 2026, "today_repaid_kg": 40.0, "today_repay_pct": 2.1, "yesterday_repay_pct": 1.8, "repay_change_pct": 16.7, "total_contracted": 5000.0, "total_repaid": 1200.0, "outstanding": 3800.0 },
  "farmer_contracts": { "year": 2026, "count": 80, "total_land": 200.0, "total_tobac_num": 960000, "prev_year_count": 75, "yoy_change_pct": 6.7 }
}
```

---

### GET `/dashboard/purchase-trend`
Returns a time series of net purchase weight and repay weight for charting.

**Auth required:** Yes — `login_system` scope

**Query Parameters:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `preset` | `7d` \| `30d` \| `3m` \| `9m` \| `12m` \| `custom` | `7d` | Determines bucket granularity |
| `start_date` / `end_date` | date | — | Required only when `preset=custom` |

**Response `200 OK`:**
```json
{
  "points": [{ "date": "2026-05-01", "net_weight_kg": 850.0, "repay_weight_kg": 40.0 }],
  "granularity": "daily",
  "start_date": "2026-05-01",
  "end_date": "2026-05-11"
}
```

---

### GET `/dashboard/purchase-by-buyer`
Returns vendor count per buyer/purchaser for the given year (defaults to current year).

**Auth required:** Yes — `login_system` scope

**Query Parameters:** `year` (int, optional)

**Response `200 OK`:**
```json
{ "year": 2026, "items": [{ "buyer_id": 1, "buyer_name": "Buyer Co. Ltd", "vendor_count": 25 }] }
```

---

### GET `/dashboard/purchase-by-tobacco-type`
Returns total purchased weight per tobacco type for the given year (defaults to current year).

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
{ "year": 2026, "items": [{ "tobacco_id": 3, "tobacco_name": "Grade A", "weight_kg": 12000.0 }] }
```

---

### GET `/dashboard/repay-by-tobacco-type`
Returns total repaid weight per contract tobacco type for the given year (defaults to previous calendar year, matching the repay domain's default reporting year).

**Auth required:** Yes — `login_system` scope

**Response `200 OK`:**
```json
{ "year": 2025, "items": [{ "tobacco_id": 3, "tobacco_name": "Virginia", "weight_kg": 3000.0 }] }
```

---

## Permission Scopes Reference

Scopes come from the `dl_permission` table via the user's assigned `dl_role`; every token also always includes the base `user` scope.

| Scope | Description | Granted to roles |
|-------|-------------|-------------------|
| `user` | Base scope — included in all tokens | all |
| `login_system` | Access to all domain endpoints (farmers, contracts, sack, purchase, repay, dashboard) | `admin`, `boss`, `office_staff`, `field_staff` |
| `manage_users` | Create/list/delete users, assign roles/regions, reset any password | `admin`, `boss` |
| `view_audit_logs` | Access audit logs | `admin`, `boss` |
| `approve_leave` | Can approve or reject leave requests (reserved — no endpoint currently uses it) | `admin`, `boss` |

Roles: `admin`, `boss` (full access), `office_staff`, `field_staff` (both `login_system`-only by default). `admin`/`boss` users cannot be deleted via `DELETE /users/{user_id}`.

---

## Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created — returned by all POST create endpoints |
| `204` | Success — no content (DELETE) |
| `400` | Bad request (validation failure, wrong password, duplicate, quota exceeded) |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (insufficient scope) |
| `404` | Resource not found |
| `409` | Conflict (duplicate contract number) |
| `422` | Unprocessable entity (Pydantic validation error, or business-rule mismatch e.g. farmer/represent) |
| `500` | Internal server error |
