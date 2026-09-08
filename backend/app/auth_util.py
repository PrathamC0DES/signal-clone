import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

SECRET_KEY = os.getenv("SECRET_KEY", "signal_secret_jwt_key_2026_super_secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None


def get_current_user_from_token(token_str: str, db: Session) -> Optional[User]:
    if not token_str:
        return None
    token = token_str.replace("Bearer ", "").strip()
    user_id = decode_token(token)
    if not user_id:
        # Check if token is directly user_id (for fast convenience / testing)
        user = db.query(User).filter(User.id == token).first()
        return user
    return db.query(User).filter(User.id == user_id).first()


def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: Session = Depends(get_db)
) -> User:
    user = None
    if authorization:
        user = get_current_user_from_token(authorization, db)
    elif x_user_id:
        user = db.query(User).filter(User.id == x_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    return user

