from sqlmodel import Session, select
from app.db.session import engine
from app.domains.rbac.models import Role


def seed_roles():
    # 1. Define Permissions
    permissions_data = [
        {"name": "view_data", "description": "Can view system data"},
        {"name": "create_data", "description": "Can create new records"},
        {"name": "edit_data", "description": "Can modify existing records"},
        {"name": "delete_data", "description": "Can delete records"},
    ]

    # 2. Define Roles and their permission mappings
    roles_to_create = [
        {
            "name": "staff",
            "description": "Regular system staff",
            "perms": ["view_data", "create_data", "edit_data"],
        },
        {
            "name": "manager",
            "description": "Management level access",
            "perms": ["view_data", "create_data", "edit_data", "delete_data"],
        },
        {
            "name": "boss",
            "description": "High level executive access",
            "perms": ["view_data", "create_data", "edit_data", "delete_data"],
        },
        {
            "name": "admin",
            "description": "Full system administrator",
            "perms": ["view_data", "create_data", "edit_data", "delete_data"],
        },
    ]

    with Session(engine) as session:
        from app.domains.rbac.models import Permission

        # Create Permissions first
        db_perms = {}
        for p_data in permissions_data:
            stmt = select(Permission).where(Permission.name == p_data["name"])
            existing_p = session.exec(stmt).first()
            if not existing_p:
                p = Permission(name=p_data["name"], description=p_data["description"])
                session.add(p)
                db_perms[p_data["name"]] = p
            else:
                db_perms[p_data["name"]] = existing_p

        session.commit()  # Save permissions so we can link them

        # Create Roles and link Permissions
        for role_data in roles_to_create:
            stmt = select(Role).where(Role.name == role_data["name"])
            existing_role = session.exec(stmt).first()

            if not existing_role:
                print(f"Creating role: {role_data['name']}")
                db_role = Role(
                    name=role_data["name"], description=role_data["description"]
                )
                # Link permissions
                for p_name in role_data["perms"]:
                    db_role.permissions.append(db_perms[p_name])
                session.add(db_role)
            else:
                print(f"Role already exists: {role_data['name']}")
                # Ensure permissions are up to date even if role exists
                existing_role.permissions = [
                    db_perms[p_name] for p_name in role_data["perms"]
                ]
                session.add(existing_role)

        session.commit()


if __name__ == "__main__":
    print("🌱 Seeding roles...")
    seed_roles()
    print("✅ Done!")
