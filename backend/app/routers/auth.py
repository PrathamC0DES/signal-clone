import re
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Conversation, ConversationMember, Message, Contact
from ..schemas import UserRegister, UserLogin, VerifyOtp, UserUpdate, UserResponse, AuthResponse
from ..auth_util import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r'[\s\-\(\)]', '', phone.strip())
    return cleaned


def setup_new_user_conversations(user: User, db: Session):
    # 1. Add seeded users as contacts
    seeded_users = db.query(User).filter(User.id.in_(["user_satvik", "user_sarah", "user_alex", "user_elena", "user_david", "user_me"])).all()
    for s_user in seeded_users:
        if s_user.id != user.id:
            exists = db.query(Contact).filter(Contact.user_id == user.id, Contact.contact_id == s_user.id).first()
            if not exists:
                db.add(Contact(user_id=user.id, contact_id=s_user.id))
            exists2 = db.query(Contact).filter(Contact.user_id == s_user.id, Contact.contact_id == user.id).first()
            if not exists2:
                db.add(Contact(user_id=s_user.id, contact_id=user.id))
    db.flush()

    # 2. Add user to group chat "conv_group_devs"
    group_conv = db.query(Conversation).filter(Conversation.id == "conv_group_devs").first()
    if group_conv:
        in_group = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == "conv_group_devs",
            ConversationMember.user_id == user.id
        ).first()
        if not in_group:
            db.add(ConversationMember(conversation_id="conv_group_devs", user_id=user.id, role="member"))

    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)
    user_conv_ids = [m[0] for m in db.query(ConversationMember.conversation_id).filter(ConversationMember.user_id == user.id).all()]

    # 3. Create direct conversation with Satvik Sharma (from screenshot)
    satvik = db.query(User).filter(User.id == "user_satvik").first()
    if satvik and satvik.id != user.id:
        has_satvik_chat = (
            db.query(Conversation)
            .join(ConversationMember)
            .filter(
                Conversation.type == "direct",
                Conversation.id.in_(user_conv_ids),
                ConversationMember.user_id == satvik.id
            )
            .first()
        )
        if not has_satvik_chat:
            satvik_conv = Conversation(type="direct", disappearing_timer="off", updated_at=now - timedelta(minutes=2))
            db.add(satvik_conv)
            db.flush()
            db.add(ConversationMember(conversation_id=satvik_conv.id, user_id=user.id, role="member", is_pinned=True))
            db.add(ConversationMember(conversation_id=satvik_conv.id, user_id=satvik.id, role="member"))

            # Messages matching screenshot
            msgs_data = [
                (satvik.id, "hello", yesterday.replace(hour=23, minute=14, second=0)),
                (user.id, "hi", yesterday.replace(hour=23, minute=6, second=0)),
                (satvik.id, "bye", now - timedelta(minutes=50)),
                (satvik.id, "hello", now - timedelta(minutes=45)),
                (satvik.id, "jj", now - timedelta(minutes=35)),
                (satvik.id, "adsf", now - timedelta(minutes=25)),
                (satvik.id, "d", now - timedelta(minutes=20)),
                (satvik.id, "asdf", now - timedelta(minutes=16)),
                (satvik.id, "hh", now - timedelta(minutes=13)),
                (user.id, "hi", now - timedelta(minutes=2)),
            ]
            for s_id, text_c, ts in msgs_data:
                db.add(Message(
                    conversation_id=satvik_conv.id,
                    sender_id=s_id,
                    content=text_c,
                    status="read",
                    created_at=ts
                ))

    db.commit()


def user_to_response(user: User) -> UserResponse:
    last_seen_ms = int(user.last_seen.replace(tzinfo=timezone.utc).timestamp() * 1000) if (user.last_seen and user.last_seen.tzinfo is None) else (int(user.last_seen.timestamp() * 1000) if user.last_seen else None)
    return UserResponse(
        id=user.id,
        phone_number=user.phone_number,
        display_name=user.display_name,
        username=user.username,
        avatar_url=user.avatar_url,
        about=user.about,
        is_online=user.is_online,
        last_seen=last_seen_ms
    )


@router.post("/register", response_model=AuthResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    norm_phone = normalize_phone(data.phone_number)
    existing = db.query(User).filter(
        (User.phone_number == data.phone_number) | (User.phone_number == norm_phone)
    ).first()
    if existing:
        if data.display_name:
            existing.display_name = data.display_name
        if data.username:
            existing.username = data.username
        if data.avatar_url:
            existing.avatar_url = data.avatar_url
        db.commit()
        setup_new_user_conversations(existing, db)
        token = create_access_token(existing.id)
        return AuthResponse(token=token, user=user_to_response(existing))

    user = User(
        phone_number=norm_phone,
        display_name=data.display_name,
        username=data.username,
        avatar_url=data.avatar_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    setup_new_user_conversations(user, db)
    token = create_access_token(user.id)
    return AuthResponse(token=token, user=user_to_response(user))


@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    norm_phone = normalize_phone(data.phone_number)
    user = db.query(User).filter(
        (User.phone_number == data.phone_number) | (User.phone_number == norm_phone)
    ).first()

    if not user:
        # Auto-create if not exists for smooth onboarding
        user = User(
            phone_number=norm_phone,
            display_name=f"User {norm_phone[-4:] if len(norm_phone) >= 4 else 'Signal'}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        setup_new_user_conversations(user, db)

    return {
        "status": "otp_sent",
        "phone_number": data.phone_number,
        "mock_otp": "123456",
        "message": "Use OTP 123456 to verify"
    }


@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(data: VerifyOtp, db: Session = Depends(get_db)):
    # Standard mock OTP is 123456
    if data.otp != "123456":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Use mock code: 123456"
        )

    norm_phone = normalize_phone(data.phone_number)
    user = db.query(User).filter(
        (User.phone_number == data.phone_number) | (User.phone_number == norm_phone)
    ).first()

    if not user:
        user = User(
            phone_number=norm_phone,
            display_name=f"User {norm_phone[-4:] if len(norm_phone) >= 4 else 'Signal'}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    setup_new_user_conversations(user, db)
    token = create_access_token(user.id)
    return AuthResponse(token=token, user=user_to_response(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return user_to_response(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.display_name is not None:
        current_user.display_name = data.display_name
    if data.username is not None:
        current_user.username = data.username
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    if data.about is not None:
        current_user.about = data.about

    db.commit()
    db.refresh(current_user)
    return user_to_response(current_user)


@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [user_to_response(u) for u in users]


@router.post("/switch/{user_id}", response_model=AuthResponse)
def switch_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    token = create_access_token(user.id)
    return AuthResponse(token=token, user=user_to_response(user))
