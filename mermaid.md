erDiagram
    %% USERS DOMAIN
    user ||--o| dl_user_mfa : "1:1 MFA protection"
    user }|--|{ dl_role : "N:N via dl_user_role"
    
    %% RBAC DOMAIN
    dl_role }|--|{ dl_permission : "N:N via dl_role_permission"
    
    %% AUTH DOMAIN
    user ||--o{ dl_user_token : "1:N sessions"

    user {
        int id PK
        string user_name "Unique"
        string password "Hashed"
        boolean is_active
        datetime created_at
    }

    dl_user_mfa {
        int id PK
        int user_id FK "References user.id"
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

    dl_user_token {
        int id PK
        string user_name "Ref index"
        string refresh_token
        datetime expires_at
    }

    dl_audit_log {
        int id PK
        string user_name "Action owner"
        string endpoint
        string method
        datetime created_at
    }

    %% LINK TABLES
    dl_user_role {
        int user_id FK
        int role_id FK
    }

    dl_role_permission {
        int role_id FK
        int permission_id FK
    }
