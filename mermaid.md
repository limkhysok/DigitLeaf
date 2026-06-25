erDiagram
    %% USERS & RBAC DOMAINS
    dl_role ||--o{ dl_role_permission : "Linked by role_id"
    dl_permission ||--o{ dl_role_permission : "Linked by permission_id"

    %% SACK REGISTRATION & FARMER DOMAINS
    represent ||--o{ member_farmer : "Grouped under representative"
    member_farmer ||--o{ mf_con_year : "Has yearly contract info"
    represent ||--o{ dl_sack_registration : "Registered represent group"
    member_farmer ||--o{ dl_sack_registration : "Registered farmer"

    %% TOBACCO PURCHASE DOMAINS
    tobacco_purchase ||--o{ tobacco_purchase_detail : "1:N invoice itemized lines"

    user {
        int id PK
        string user_name
        string password "Hashed Password"
        string access_type "'all' grants full access; drives login scopes"
        string login_type
        string user "Username of account creator"
        datetime do_date "Created at"
        string ip_address
        string edit_user "Username of last editor"
        datetime edit_do_date "Updated at"
        string edit_ip_address
    }

    dl_role {
        int id PK
        string name "Unique"
        string description
    }

    dl_permission {
        int id PK
        string name "Unique"
        string description
    }

    dl_role_permission {
        int role_id PK, FK "Ref: dl_role.id"
        int permission_id PK, FK "Ref: dl_permission.id"
    }

    dl_user_token {
        int id PK
        int user_id "Ref: user.id (no DB-enforced FK)"
        string user_name
        string refresh_token
        datetime created_at
        datetime expires_at
    }

    dl_audit_log {
        int id PK
        int user_id "Ref: user.id (no DB-enforced FK)"
        string user_name
        string endpoint
        string method
        string headers
        string body
        string ip_address
        string user_agent
        datetime created_at
    }

    represent {
        int represent_id PK
        string represent_name
        int p_id "Associated purchaser ID"
        int do_not_show "Binary flag (0=Active, 1=Hidden)"
    }

    member_farmer {
        int mf_id PK
        string name
        string mf_code "Unique Farmer Code / ID"
        int represent FK "Ref: represent.represent_id"
        string address
        string active "Flag (e.g. '1')"
    }

    mf_con_year {
        int mf_con_id PK
        int mf_id FK "Ref: member_farmer.mf_id"
        int year "Contract Year (e.g., 2026)"
        float land "Land area in hectares"
        int tobac_num "Number of saplings registered"
    }

    dl_sack_registration {
        int id PK
        int represent_id FK "Ref: represent.represent_id"
        int member_farmer_id FK "Ref: member_farmer.mf_id"
        int action_by_id "Ref: user.id (no DB-enforced FK)"
        string action_by
        int status "0=Pending, 1=Approved, 2=Rejected"
        float sack_in_kg "Weight registered"
        string notes
        datetime registered_at
        datetime created_at
        datetime updated_at
    }

    tobacco_purchase {
        int tp_id PK
        string invoice_num "Format: YYYYMMDD-00001 (Unique)"
        int buyer "Purchaser ID"
        string vendor "Farmer Name"
        string v_addr "Vendor Address"
        int region "Region ID"
        date tp_date
        string tp_note
        string user "Created by operator name"
        string closing "NO | YES"
        int oven "Oven ID"
        int rate "Exchange Rate (Riels to USD)"
        datetime do_date "Created timestamp"
        string ip_address
        string edit_user
        datetime edit_do_date
        string edit_ip_address
        float total_net_weight
        float grand_total
    }

    tobacco_purchase_detail {
        int tpd_id PK
        string invoice_num "Matches parent invoice"
        int tobacco_name "Tobacco Type ID"
        float qty "Bales Quantity"
        float price "Price per kg"
        date CreatedDate
        string closing "NO | YES"
        int buyer "Purchaser ID"
        int oven "Oven ID"
        int region "Region ID"
        int m_id FK "Ref: tobacco_purchase.tp_id"
        string user "Operator name"
        datetime do_date
        string ip_address
        string edit_user
        datetime edit_do_date
        string edit_ip_address
        float remork_in_kg "Truck weight deduction"
        float sack_in_kg "Empty sack weight deduction"
        float gross_weight "Total weight before deductions"
        float total_amount "Formula: (gross - remork - sack) * price"
        string picture "Path or URL to item photo (Optional)"
    }
