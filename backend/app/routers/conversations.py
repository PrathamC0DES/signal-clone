from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Conversation, ConversationMember, User, Message, MessageReaction, Attachment
from ..schemas import (
    ConversationResponse,
    MemberResponse,
    CreateDirectChatRequest,
    CreateGroupChatRequest,
    UpdateConversationRequest,
    AddMemberRequest,
    MessageResponse,
    ReactionResponse,
    AttachmentResponse
)
from ..auth_util import get_current_user
from ..websocket_manager import manager

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


def to_epoch_ms(dt: Optional[datetime]) -> Optional[int]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)


def format_message(msg: Message, db: Session) -> MessageResponse:
    reactions = db.query(MessageReaction).filter(MessageReaction.message_id == msg.id).all()
    grouped_reactions = {}
    for r in reactions:
        if r.emoji not in grouped_reactions:
            grouped_reactions[r.emoji] = []
        grouped_reactions[r.emoji].append(r.user_id)

    formatted_reactions = [
        ReactionResponse(emoji=emoji, count=len(uids), userIds=uids)
        for emoji, uids in grouped_reactions.items()
    ]

    attachments = db.query(Attachment).filter(Attachment.message_id == msg.id).all()
    formatted_attachments = [
        AttachmentResponse(
            id=a.id,
            message_id=a.message_id,
            file_url=a.file_url,
            file_name=a.file_name,
            file_size=a.file_size,
            mime_type=a.mime_type
        )
        for a in attachments
    ]

    reply_preview = None
    if msg.reply_to_id:
        reply_target = db.query(Message).filter(Message.id == msg.reply_to_id).first()
        if reply_target:
            reply_sender = db.query(User).filter(User.id == reply_target.sender_id).first()
            reply_preview = {
                "id": reply_target.id,
                "senderName": reply_sender.display_name if reply_sender else "User",
                "content": reply_target.content
            }

    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        content=msg.content,
        type=msg.type,
        reply_to_id=msg.reply_to_id,
        reply_to=reply_preview,
        status=msg.status,
        timestamp=to_epoch_ms(msg.created_at) or 0,
        expires_at=to_epoch_ms(msg.expires_at),
        reactions=formatted_reactions,
        attachments=formatted_attachments
    )


def format_conversation(conv: Conversation, current_user_id: str, db: Session) -> ConversationResponse:
    members = db.query(ConversationMember).filter(ConversationMember.conversation_id == conv.id).all()
    user_ids = [m.user_id for m in members]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    user_map = {u.id: u for u in users}

    participants = []
    for m in members:
        u = user_map.get(m.user_id)
        if u:
            participants.append(
                MemberResponse(
                    id=u.id,
                    phone_number=u.phone_number,
                    display_name=u.display_name,
                    avatar_url=u.avatar_url,
                    role=m.role,
                    is_online=manager.is_user_online(u.id) or u.is_online
                )
            )

    curr_member = next((m for m in members if m.user_id == current_user_id), None)
    is_pinned = curr_member.is_pinned if curr_member else False
    is_muted = curr_member.is_muted if curr_member else False
    is_archived = curr_member.is_archived if curr_member else False

    # Name and Avatar logic
    conv_name = conv.name
    conv_avatar = conv.avatar_url
    if conv.type == "direct":
        other_user = next((u for u in users if u.id != current_user_id), None)
        if other_user:
            conv_name = other_user.display_name
            conv_avatar = other_user.avatar_url
        elif not conv_name:
            conv_name = "Note to Self"

    last_msg = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(desc(Message.created_at))
        .first()
    )

    # Calculate unread count
    unread_count = 0
    if curr_member and curr_member.last_read_message_id:
        last_read = db.query(Message).filter(Message.id == curr_member.last_read_message_id).first()
        if last_read:
            unread_count = (
                db.query(Message)
                .filter(
                    Message.conversation_id == conv.id,
                    Message.sender_id != current_user_id,
                    Message.created_at > last_read.created_at
                )
                .count()
            )
    elif curr_member and not curr_member.last_read_message_id:
        unread_count = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id, Message.sender_id != current_user_id)
            .count()
        )

    return ConversationResponse(
        id=conv.id,
        type=conv.type,
        name=conv_name or "Conversation",
        avatar_url=conv_avatar,
        participants=participants,
        last_message=format_message(last_msg, db) if last_msg else None,
        unread_count=unread_count,
        is_pinned=is_pinned,
        is_muted=is_muted,
        is_archived=is_archived,
        disappearing_timer=conv.disappearing_timer or "off",
        updated_at=to_epoch_ms(conv.updated_at) or 0
    )


@router.get("", response_model=List[ConversationResponse])
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(ConversationMember).filter(ConversationMember.user_id == current_user.id).all()
    conv_ids = [m.conversation_id for m in memberships]
    conversations = (
        db.query(Conversation)
        .filter(Conversation.id.in_(conv_ids))
        .order_by(desc(Conversation.updated_at))
        .all()
    )

    result = [format_conversation(c, current_user.id, db) for c in conversations]
    result.sort(key=lambda x: (not x.is_pinned, -x.updated_at))
    return result


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation_detail(conversation_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return format_conversation(conv, current_user.id, db)


@router.post("/direct", response_model=ConversationResponse)
def create_or_get_direct_chat(data: CreateDirectChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_user = db.query(User).filter(User.id == data.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check if direct chat already exists
    user_memberships = db.query(ConversationMember.conversation_id).filter(ConversationMember.user_id == current_user.id).subquery()
    existing = (
        db.query(Conversation)
        .join(ConversationMember)
        .filter(
            Conversation.type == "direct",
            Conversation.id.in_(user_memberships),
            ConversationMember.user_id == target_user.id
        )
        .first()
    )

    if existing:
        return format_conversation(existing, current_user.id, db)

    # Create new direct chat
    new_conv = Conversation(type="direct", disappearing_timer="off")
    db.add(new_conv)
    db.flush()

    m1 = ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="member")
    db.add(m1)
    if target_user.id != current_user.id:
        m2 = ConversationMember(conversation_id=new_conv.id, user_id=target_user.id, role="member")
        db.add(m2)

    db.commit()
    db.refresh(new_conv)
    return format_conversation(new_conv, current_user.id, db)


@router.post("/group", response_model=ConversationResponse)
def create_group_chat(data: CreateGroupChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_conv = Conversation(type="group", name=data.name, disappearing_timer="off")
    db.add(new_conv)
    db.flush()

    # Add creator as admin
    admin_member = ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="admin")
    db.add(admin_member)

    # Add requested members
    for uid in set(data.member_ids):
        if uid != current_user.id:
            u = db.query(User).filter(User.id == uid).first()
            if u:
                m = ConversationMember(conversation_id=new_conv.id, user_id=uid, role="member")
                db.add(m)

    db.commit()
    db.refresh(new_conv)
    return format_conversation(new_conv, current_user.id, db)


@router.post("/{conversation_id}/members")
def add_group_member(conversation_id: str, data: AddMemberRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv or conv.type != "group":
        raise HTTPException(status_code=400, detail="Not a group conversation")

    existing = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == data.user_id
    ).first()
    if not existing:
        m = ConversationMember(conversation_id=conversation_id, user_id=data.user_id, role="member")
        db.add(m)
        db.commit()

    return {"status": "member_added"}


@router.delete("/{conversation_id}/members/{user_id}")
def remove_group_member(conversation_id: str, user_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv or conv.type != "group":
        raise HTTPException(status_code=400, detail="Not a group conversation")

    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id
    ).first()
    if member:
        db.delete(member)
        db.commit()

    return {"status": "member_removed"}


@router.patch("/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    data: UpdateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()

    if not member:
        member = ConversationMember(conversation_id=conversation_id, user_id=current_user.id, role="member")
        db.add(member)
        db.flush()

    if data.is_pinned is not None:
        member.is_pinned = data.is_pinned
    if data.is_muted is not None:
        member.is_muted = data.is_muted
    if data.is_archived is not None:
        member.is_archived = data.is_archived
    if data.disappearing_timer is not None:
        conv.disappearing_timer = data.disappearing_timer
    if data.name is not None and conv.type == "group":
        conv.name = data.name

    db.commit()
    db.refresh(conv)
    return format_conversation(conv, current_user.id, db)


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if member:
        db.delete(member)
        db.commit()
    return {"status": "deleted"}

