from typing import Optional, List, Any
from pydantic import BaseModel, Field
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    phone_number: str
    display_name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    about: Optional[str] = "Available"


class UserRegister(BaseModel):
    phone_number: str
    display_name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None


class UserLogin(BaseModel):
    phone_number: str


class VerifyOtp(BaseModel):
    phone_number: str
    otp: str = "123456"


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    about: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    phone_number: str
    display_name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    about: Optional[str] = "Available"
    is_online: bool = False
    last_seen: Optional[int] = None  # epoch ms

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


# Attachment Schemas
class AttachmentResponse(BaseModel):
    id: str
    message_id: str
    file_url: str
    file_name: str
    file_size: int
    mime_type: str

    class Config:
        from_attributes = True


# Reaction Schemas
class ReactionResponse(BaseModel):
    emoji: str
    count: int
    userIds: List[str]


# Message Schemas
class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    type: str = "text"
    reply_to_id: Optional[str] = None
    reply_to: Optional[Any] = None
    status: str = "sent"
    timestamp: int  # epoch ms
    expires_at: Optional[int] = None
    reactions: List[ReactionResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str = ""
    reply_to_id: Optional[str] = None
    type: str = "text"
    attachments: Optional[List[dict]] = None


# Conversation Schemas
class MemberResponse(BaseModel):
    id: str
    phone_number: str
    display_name: str
    avatar_url: Optional[str] = None
    role: str = "member"
    is_online: bool = False


class ConversationResponse(BaseModel):
    id: str
    type: str  # 'direct' | 'group'
    name: str
    avatar_url: Optional[str] = None
    participants: List[MemberResponse]
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    is_pinned: bool = False
    is_muted: bool = False
    is_archived: bool = False
    disappearing_timer: str = "off"
    updated_at: int  # epoch ms


class CreateDirectChatRequest(BaseModel):
    user_id: str


class CreateGroupChatRequest(BaseModel):
    name: str
    member_ids: List[str]


class UpdateConversationRequest(BaseModel):
    is_pinned: Optional[bool] = None
    is_muted: Optional[bool] = None
    is_archived: Optional[bool] = None
    disappearing_timer: Optional[str] = None
    name: Optional[str] = None


class AddMemberRequest(BaseModel):
    user_id: str


# Contact Schemas
class AddContactRequest(BaseModel):
    phone_number: Optional[str] = None
    contact_id: Optional[str] = None
    nickname: Optional[str] = None

