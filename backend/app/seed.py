from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from .models import User, Conversation, ConversationMember, Message, MessageReaction, Contact, Attachment
from .database import engine, Base, SessionLocal


def seed_database(db: Session):
    print("Seeding database...")
    Base.metadata.create_all(bind=engine)

    # 1. Create Users
    users_data = [
        {
            "id": "user_me",
            "phone_number": "+1 555-0199",
            "username": "pratham",
            "display_name": "Pratham",
            "avatar_url": None,
            "about": "Building the Signal Web Client! 🚀",
            "is_online": True,
        },
        {
            "id": "user_satvik",
            "phone_number": "+1 555-0155",
            "username": "satvik_s",
            "display_name": "Satvik Sharma",
            "avatar_url": "/avatars/satvik.svg",
            "about": "Available",
            "is_online": True,
        },
        {
            "id": "user_sarah",
            "phone_number": "+1 555-0142",
            "username": "sarah_c",
            "display_name": "Sarah Connor",
            "avatar_url": None,
            "about": "Privacy is not an option, it's a right.",
            "is_online": True,
        },
        {
            "id": "user_alex",
            "phone_number": "+1 555-0187",
            "username": "alex_m",
            "display_name": "Alex Miller",
            "avatar_url": None,
            "about": "FastAPI + WebSockets + SQLite enjoyer",
            "is_online": False,
        },
        {
            "id": "user_elena",
            "phone_number": "+1 555-0112",
            "username": "elena_r",
            "display_name": "Elena Rostova",
            "avatar_url": None,
            "about": "Available",
            "is_online": True,
        },
        {
            "id": "user_david",
            "phone_number": "+1 555-0176",
            "username": "david_k",
            "display_name": "David Kim",
            "avatar_url": None,
            "about": "Coffee & Code ☕",
            "is_online": False,
        },
    ]

    created_users = {}
    for u in users_data:
        existing = db.query(User).filter(User.id == u["id"]).first()
        if not existing:
            new_user = User(**u)
            db.add(new_user)
            created_users[u["id"]] = new_user
        else:
            created_users[u["id"]] = existing
    db.commit()

    # 2. Add Contacts
    for uid_a in created_users:
        for uid_b in created_users:
            if uid_a != uid_b:
                exists = db.query(Contact).filter(Contact.user_id == uid_a, Contact.contact_id == uid_b).first()
                if not exists:
                    db.add(Contact(user_id=uid_a, contact_id=uid_b))
    db.commit()

    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)

    # 3. Conversation 0: Satvik Sharma (matches screenshot exactly)
    conv_satvik = db.query(Conversation).filter(Conversation.id == "conv_satvik").first()
    if not conv_satvik:
        conv_satvik = Conversation(
            id="conv_satvik",
            type="direct",
            disappearing_timer="off",
            updated_at=now - timedelta(minutes=2)
        )
        db.add(conv_satvik)
        db.flush()

        db.add(ConversationMember(conversation_id=conv_satvik.id, user_id="user_me", role="member", is_pinned=True))
        db.add(ConversationMember(conversation_id=conv_satvik.id, user_id="user_satvik", role="member"))

        # Yesterday messages
        m_y1 = Message(
            id="msg_sat_y1",
            conversation_id=conv_satvik.id,
            sender_id="user_me",
            content="hi",
            status="read",
            created_at=yesterday.replace(hour=23, minute=6, second=0)
        )
        m_y2 = Message(
            id="msg_sat_y2",
            conversation_id=conv_satvik.id,
            sender_id="user_satvik",
            content="hello",
            status="read",
            created_at=yesterday.replace(hour=23, minute=14, second=0)
        )

        # Today messages
        m_t1 = Message(
            id="msg_sat_t1",
            conversation_id=conv_satvik.id,
            sender_id="user_satvik",
            content="bye",
            status="read",
            created_at=now - timedelta(minutes=50)
        )
        m_t2 = Message(
            id="msg_sat_t2",
            conversation_id=conv_satvik.id,
            sender_id="user_satvik",
            content="hello",
            status="read",
            created_at=now - timedelta(minutes=45)
        )
        m_t3 = Message(
            id="msg_sat_t3",
            conversation_id=conv_satvik.id,
            sender_id="user_satvik",
            content="jj",
            status="read",
            created_at=now - timedelta(minutes=35)
        )
        m_t4 = Message(
            id="msg_sat_t4",
            conversation_id=conv_satvik.id,
            sender_id="user_satvik",
            content="adsf",
            status="read",
            created_at=now - timedelta(minutes=25)
        )
        m_t5 = Message(
            id="msg_sat_t5",
            conversation_id=conv_satvik.id,
            sender_id="user_satvik",
            content="d",
            status="read",
            created_at=now - timedelta(minutes=20)
        )
        m_t6 = Message(
            id="msg_sat_t6",
            conversation_id=conv_satvik.id,
            sender_id="user_satvik",
            content="asdf",
            status="read",
            created_at=now - timedelta(minutes=16)
        )
        m_t7 = Message(
            id="msg_sat_t7",
            conversation_id=conv_satvik.id,
            sender_id="user_satvik",
            content="hh",
            status="read",
            created_at=now - timedelta(minutes=13)
        )
        m_t8 = Message(
            id="msg_sat_t8",
            conversation_id=conv_satvik.id,
            sender_id="user_me",
            content="hi",
            status="read",
            created_at=now - timedelta(minutes=2)
        )
        db.add_all([m_y1, m_y2, m_t1, m_t2, m_t3, m_t4, m_t5, m_t6, m_t7, m_t8])
        db.flush()

    db.commit()
    print("Database seeded successfully with users, contacts, and Satvik conversation!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

