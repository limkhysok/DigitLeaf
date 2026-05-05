erDiagram
    %% USERS DOMAIN
    dl_user ||--o| dl_user_mfa : "1:1 MFA protection"
    dl_user }|--|{ dl_role : "N:N via dl_user_role"
    
    %% RBAC DOMAIN
    dl_role }|--|{ dl_permission : "N:N via dl_role_permission"
    
    %% AUTH DOMAIN
    dl_user ||--o{ dl_user_token : "1:N sessions"

    dl_user {
        int id PK
        string user_name "Unique"
        string password "Plain Text"
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    dl_user_mfa {
        int id PK
        int user_id FK "References dl_user.id"
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

    dl_user_role {
        int user_id PK, FK
        int role_id PK, FK
    }

    dl_role_permission {
        int role_id PK, FK
        int permission_id PK, FK
    }

    dl_user_token {
        int id PK
        string user_name "Ref to dl_user.user_name"
        string refresh_token
        datetime created_at
        datetime expires_at
    }

    dl_audit_log {
        int id PK
        string user_name
        string endpoint
        string method
        string headers
        string body
        string ip_address
        string user_agent
        datetime created_at
    }
