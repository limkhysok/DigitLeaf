from typing import Optional
from sqlmodel import Session, select
from datetime import datetime
from app.domains.auth.models import UserToken

def get_by_refresh_token(session: Session, refresh_token: str) -> Optional[UserToken]:
    statement = select(UserToken).where(UserToken.refresh_token == refresh_token)
    return session.exec(statement).first()

def create_user_token(session: Session, user_id: int, user_name: str, refresh_token: str, 
                      expires_at: datetime, ip_address: str = None, user_agent: str = None) -> UserToken:
    db_token = UserToken(
        user_id=user_id, 
        user_name=user_name, 
        refresh_token=refresh_token, 
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent
    )
    session.add(db_token)
    session.commit()
    session.refresh(db_token)
    return db_token

def delete_user_token(session: Session, user_name: str):
    statement = select(UserToken).where(UserToken.user_name == user_name)
    tokens = session.exec(statement).all()
    for t in tokens:
        session.delete(t)
    session.commit()
    
def delete_specific_token(session: Session, refresh_token: str):
    statement = select(UserToken).where(UserToken.refresh_token == refresh_token)
    token = session.exec(statement).first()
    if token:
        session.delete(token)
        session.commit()

def get_user_tokens(session: Session, user_name: str) -> list[UserToken]:
    statement = select(UserToken).where(UserToken.user_name == user_name)
    return session.exec(statement).all()
