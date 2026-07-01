erDiagram
    %% USERS & RBAC DOMAINS
    dl_role ||--o{ dl_role_permission : "Linked by role_id"
    dl_permission ||--o{ dl_role_permission : "Linked by permission_id"
    dl_role ||--o{ dl_user_role : "Linked by role_id"

    %% SACK REGISTRATION & FARMER DOMAINS
    represent ||--o{ member_farmer : "Grouped under representative"
    member_farmer ||--o{ mf_con_year : "Has yearly contract info"
    represent ||--o{ dl_sack_registration : "Registered represent group"
    member_farmer ||--o{ dl_sack_registration : "Registered farmer"

    %% REFERENCE / LOOKUP DOMAINS
    purchaser ||--o{ tobacco_purchase : "buyer (no DB-enforced FK)"
    region ||--o{ tobacco_purchase : "region (no DB-enforced FK)"
    ovens ||--o{ tobacco_purchase : "oven (no DB-enforced FK)"
    tobacco ||--o{ tobacco_purchase_detail : "tobacco_name (no DB-enforced FK)"

    %% TOBACCO PURCHASE DOMAINS
    tobacco_purchase ||--o{ tobacco_purchase_detail : "1:N invoice itemized lines (legacy MyISAM, no DB-enforced FK)"
    member_farmer ||--o{ tobacco_purchase : "Vendor farmer (vendor column, no DB-enforced FK)"

    %% TOBACCO REPAY / CONTRACT DOMAINS
    member_farmer ||--o{ t_contract : "f_id (no DB-enforced FK)"
    represent ||--o{ t_contract : "represent (no DB-enforced FK)"
    con_tobacco ||--o{ t_contract : "tobac_type (no DB-enforced FK)"
    tobacco_groups ||--o{ con_tobacco : "tobacco_type (no DB-enforced FK)"
    t_contract ||--o{ t_contract_repay : "con_id (no DB-enforced FK)"
    member_farmer ||--o{ t_contract_repay : "f_id (no DB-enforced FK)"
    ovens ||--o{ t_contract_repay : "oven (no DB-enforced FK)"

    user {
        int id PK
        string user_name "Unique"
        string password "Hashed Password"
        string access_type "'all' grants full access; drives login scopes"
        string login_type
        string user "Username of account creator"
        json regions "List of region.reg_id ints (no DB-enforced FK)"
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

    dl_user_role {
        int user_id PK "Ref: user.id (no DB-enforced FK, legacy MyISAM table)"
        int role_id PK, FK "Ref: dl_role.id"
    }

    dl_user_token {
        int id PK
        int user_id "Ref: user.id (no DB-enforced FK)"
        string user_name
        string refresh_token
        string ip_address
        string user_agent
        datetime created_at
        datetime expires_at
    }

    user_action {
        int id PK
        string page_name "Page/domain changed (maps to Python model AuditLog)"
        datetime date "Recorded at"
        string field_type "Column/field changed"
        string old_value
        string new_value
        string user "Username of actor"
        string action "e.g. UPDATE | DELETE"
        string log_on
        string ip_address
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
        string mf_code "Snapshot of farmer code at contract time"
        int t_id "Ref: tobacco.t_id (no DB-enforced FK)"
        int year "Contract Year (e.g., 2026)"
        float land "Land area in hectares"
        int tobac_num "Number of saplings registered"
        string user "Operator name"
        date do_date "Created at"
        string ip_address
    }

    dl_sack_registration {
        int id PK
        float sack_in_kg "Weight registered"
        string notes
        string action_by "Operator username"
        int represent_id "Ref: represent.represent_id (no DB-enforced FK)"
        int farmer_id "Ref: member_farmer.mf_id (no DB-enforced FK)"
        int action_by_id "Ref: user.id (no DB-enforced FK)"
        datetime created_at
        datetime updated_at
    }

    purchaser {
        int p_id PK
        string p_name
        string p_name_kh
        int region "Ref: region.reg_id (no DB-enforced FK)"
        int do_not_show "Binary flag (0=Active, 1=Hidden)"
    }

    region {
        int reg_id PK
        string reg_name
        string reg_name_kh
        int do_not_show "Binary flag (0=Active, 1=Hidden)"
        int w_id "Warehouse/zone grouping"
    }

    ovens {
        int id PK
        string name_en
        string name_kh
        int do_not_show "Binary flag (0=Active, 1=Hidden)"
    }

    tobacco {
        int t_id PK
        string t_name
        string t_name_kh
        int t_cate "Tobacco category ID"
        int discontinue "Binary flag (0=Active, 1=Discontinued)"
    }

    tobacco_purchase {
        int tp_id PK
        string invoice_num "Format: YYYYMMDD-00001 (Unique)"
        int buyer "Ref: purchaser.p_id (no DB-enforced FK)"
        string vendor_id "Ref: member_farmer.mf_id, stored as string (column: vendor, no DB-enforced FK)"
        string v_addr "Vendor Address"
        int region "Ref: region.reg_id (no DB-enforced FK)"
        date tp_date
        string tp_note
        string user "Created by operator name"
        string closing "NO | YES"
        int oven "Ref: ovens.id (no DB-enforced FK)"
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
        int tobacco_name "Ref: tobacco.t_id (no DB-enforced FK)"
        float qty "Bales Quantity"
        float price "Price per kg"
        date CreatedDate
        string closing "NO | YES"
        int buyer "Purchaser ID"
        int oven "Oven ID"
        int region "Region ID"
        int m_id FK "Ref: tobacco_purchase.tp_id (legacy MyISAM parent, no DB-enforced FK)"
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
        int farmer_own_sack "Binary flag: farmer supplied own sack"
    }

    tobacco_groups {
        int id PK
        string name "Unique"
        string user "Operator name"
        datetime do_date
        string ip_address
    }

    con_tobacco {
        int t_id PK
        string tobacco_type "Ref: tobacco_groups.id, stored as string (no DB-enforced FK)"
        string tobacco "Tobacco type display name"
        string note
        string user "Operator name"
        datetime do_date
        string ip_address
    }

    t_contract {
        int con_id PK
        string con_num "Format: DDMMYY-0000, daily sequence (Unique)"
        string contractor "Farmer name snapshot"
        string gender
        int age
        string home_num
        string road_num
        string village
        string commune
        string district
        string province
        string job
        string identify_num
        date identify_date
        string represent "Ref: represent.represent_id, stored as string (no DB-enforced FK)"
        date con_date "Column: date"
        string note
        string user "Operator name"
        string repay "NO | YES"
        int tobac_type "Ref: con_tobacco.t_id (no DB-enforced FK)"
        float qty
        float price
        float rate
        int f_id "Ref: member_farmer.mf_id (no DB-enforced FK)"
        datetime do_date
        string ip_address
        int year "Contract year"
    }

    t_contract_repay {
        int repay_id PK
        string repay_num "Format: TR+DDMMYY+daily sequence (e.g. TR200626-01)"
        string con_num "Snapshot of t_contract.con_num"
        date repay_date "Column: date"
        float qty_repay
        string note
        string user "Operator name"
        int f_id "Ref: member_farmer.mf_id (no DB-enforced FK)"
        int oven "Ref: ovens.id (no DB-enforced FK)"
        int con_id "Ref: t_contract.con_id (no DB-enforced FK); indexed with qty_repay"
        datetime do_date
        string ip_address
        string edit_user
        datetime edit_do_date
        string edit_ip_address
    }
