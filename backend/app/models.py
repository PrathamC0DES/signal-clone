import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    phone_number = Column(String(32), unique=True, index=True, nullable=False)
    username = Column(String(64), unique=True, index=True, nullable=True)
    display_name = Column(String(128), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    about = Column(String(256), default="Available")
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    memberships = relationship("ConversationMember", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="sender", cascade="all, delete-orphan")
    reactions = relationship("MessageReaction", back_populates="user", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    type = Column(String(16), nullable=False, default="direct")  # 'direct' or 'group'
    name = Column(String(128), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    disappearing_timer = Column(String(16), default="off")  # 'off', '30s', '5m', '1h', '1d', '1w', '4w'
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, index=True)

    members = relationship("ConversationMember", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(64), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(16), default="member")  # 'admin' | 'member'
    is_pinned = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    last_read_message_id = Column(String(64), nullable=True)
    joined_at = Column(DateTime, default=utc_now)

    __table_args__ = (UniqueConstraint("conversation_id", "user_id", name="_conv_user_uc"),)

    conversation = relationship("Conversation", back_populates="members")
    user = relationship("User", back_populates="memberships")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(64), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False, default="")
    type = Column(String(16), default="text")  # 'text' | 'image' | 'file' | 'audio'
    reply_to_id = Column(String(64), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(16), default="sent")  # 'sending' | 'sent' | 'delivered' | 'read'
    created_at = Column(DateTime, default=utc_now, index=True)
    expires_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")
    reply_to = relationship("Message", remote_side=[id])
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="message", cascade="all, delete-orphan")


class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    message_id = Column(String(64), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(16), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (UniqueConstraint("message_id", "user_id", "emoji", name="_msg_user_emoji_uc"),)

    message = relationship("Message", back_populates="reactions")
    user = relationship("User", back_populates="reactions")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    message_id = Column(String(64), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(String(512), nullable=False)
    file_name = Column(String(256), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(128), default="application/octet-stream")

    message = relationship("Message", back_populates="attachments")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    nickname = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (UniqueConstraint("user_id", "contact_id", name="_user_contact_uc"),)

