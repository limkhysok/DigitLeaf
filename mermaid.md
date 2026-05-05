erDiagram
    USER ||--o| USER_MFA : "1:1 has"
    USER }|--|{ ROLE : "N:N user_role"
    ROLE }|--|{ PERMISSION : "N:N role_permission"
    
    USER {
        int id PK
        string user_name
        string password
        string access_type
        string login_type
        boolean is_active
        datetime created_at
    }

    USER_MFA {
        int id PK
        int user_id FK
        string otp_code
        datetime otp_expiry
        string totp_secret
        boolean totp_enabled
    }

    ROLE {
        int id PK
        string name
        string description
    }

    PERMISSION {
        int id PK
        string name
        string description
    }

    USER_ROLE {
        int user_id FK
        int role_id FK
    }

    ROLE_PERMISSION {
        int role_id FK
        int permission_id FK
    }

    AUDIT_LOG {
        int id PK
        string user_name
        string endpoint
        string method
        datetime created_at
    }

    USER_TOKEN {
        int id PK
        string user_name
        string refresh_token
        datetime expires_at
    }
