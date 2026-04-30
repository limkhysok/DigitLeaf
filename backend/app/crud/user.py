from typing import Optional
from sqlmodel import Session, select
from app.models.user import User

def get_user_by_username(session: Session, user_name: str) -> Optional[User]:
    statement = select(User).where(User.user_name == user_name)
    return session.exec(statement).first()

def get_user_by_id(session: Session, user_id: int) -> Optional[User]:
    statement = select(User).where(User.id == user_id)
    return session.exec(statement).first()
