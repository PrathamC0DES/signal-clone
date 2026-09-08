from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Contact, User
from ..schemas import UserResponse, AddContactRequest
from ..auth_util import get_current_user
from .auth import user_to_response

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("", response_model=List[UserResponse])
def get_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = db.query(Contact).filter(Contact.user_id == current_user.id).all()
    contact_uids = [c.contact_id for c in contacts]
    users = db.query(User).filter(User.id.in_(contact_uids)).all()
    return [user_to_response(u) for u in users]


@router.post("", response_model=UserResponse)
def add_contact(data: AddContactRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_user = None
    if data.contact_id:
        target_user = db.query(User).filter(User.id == data.contact_id).first()
    elif data.phone_number:
        target_user = db.query(User).filter(User.phone_number == data.phone_number).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")

    existing = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_id == target_user.id
    ).first()

    if not existing:
        contact = Contact(
            user_id=current_user.id,
            contact_id=target_user.id,
            nickname=data.nickname
        )
        db.add(contact)
        db.commit()

    return user_to_response(target_user)


@router.get("/search", response_model=List[UserResponse])
def search_users(q: str = "", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not q.strip():
        users = db.query(User).filter(User.id != current_user.id).all()
        return [user_to_response(u) for u in users]

    query = f"%{q.strip()}%"
    users = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            (User.display_name.ilike(query)) | (User.phone_number.ilike(query)) | (User.username.ilike(query))
        )
        .all()
    )
    return [user_to_response(u) for u in users]

