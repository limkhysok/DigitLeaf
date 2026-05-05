erDiagram
    %% USERS DOMAIN
    dl_user ||--o| dl_user_mfa : "1:1 MFA protection"
    
    %% RBAC DOMAIN
    dl_role ||--o{ dl_user : "Role assigned to many users"
    dl_role ||--o{ dl_role_permission : "Linked by role_id"
    dl_permission ||--o{ dl_role_permission : "Linked by permission_id"
    
    %% AUTH DOMAIN
    dl_user ||--o{ dl_user_token : "1:N sessions"

    %% AUDIT DOMAIN
    dl_user ||--o{ dl_audit_log : "Audit trail"

    dl_user {
        int id PK
        int role_id FK "Ref: dl_role.id"
        string user_name "Unique"
        string password "Plain Text"
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    dl_user_mfa {
        int id PK
        int user_id FK "Ref: dl_user.id"
        string otp_code
        datetime otp_expiry
        string totp_secret
        boolean totp_enabled
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
        int user_id FK "Ref: dl_user.id"
        string user_name
        string refresh_token
        datetime created_at
        datetime expires_at
    }

    dl_audit_log {
        int id PK
        int user_id FK "Ref: dl_user.id"
        string user_name
        string endpoint
        string method
        string headers
        string body
        string ip_address
        string user_agent
        datetime created_at
    }
