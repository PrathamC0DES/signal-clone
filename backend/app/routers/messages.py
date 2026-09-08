from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Conversation, ConversationMember, User, Message, MessageReaction, Attachment
from ..schemas import MessageResponse, SendMessageRequest
from ..auth_util import get_current_user
from ..websocket_manager import manager
from .conversations import format_message

router = APIRouter(prefix="/api", tags=["messages"])


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: str,
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
        db.commit()

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )

    return [format_message(m, db) for m in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    data: SendMessageRequest,
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
        db.commit()

    # Determine status: if any other member is currently connected via WebSocket, status = 'delivered', else 'sent'
    other_members = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != current_user.id
        )
        .all()
    )
    other_uids = [m.user_id for m in other_members]
    any_online = any(manager.is_user_online(uid) for uid in other_uids)
    msg_status = "delivered" if any_online else "sent"

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=data.content,
        type=data.type,
        reply_to_id=data.reply_to_id,
        status=msg_status,
        created_at=datetime.now(timezone.utc)
    )
    db.add(msg)
    db.flush()

    # Add attachments if provided
    if data.attachments:
        for att in data.attachments:
            a = Attachment(
                message_id=msg.id,
                file_url=att.get("file_url", ""),
                file_name=att.get("file_name", "file"),
                file_size=att.get("file_size", 0),
                mime_type=att.get("mime_type", "application/octet-stream")
            )
            db.add(a)

    conv.updated_at = datetime.now(timezone.utc)
    member.last_read_message_id = msg.id
    db.commit()
    db.refresh(msg)

    formatted = format_message(msg, db)

    # Real-time WebSocket broadcast ONLY to other conversation members (recipients)
    other_member_uids = [
        m.user_id for m in db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != current_user.id
        ).all()
    ]
    await manager.broadcast_to_users(other_member_uids, "message_received", formatted.dict())
    return formatted


@router.post("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not member:
        return {"status": "ok"}

    last_msg = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .first()
    )

    if last_msg:
        member.last_read_message_id = last_msg.id

        # Update other users' messages to 'read'
        unread_msgs = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.sender_id != current_user.id,
                Message.status != "read"
            )
            .all()
        )
        sender_ids = set()
        for m in unread_msgs:
            m.status = "read"
            sender_ids.add(m.sender_id)

        db.commit()

        # Notify senders via WebSocket
        for sid in sender_ids:
            for m in unread_msgs:
                if m.sender_id == sid:
                    await manager.send_to_user(sid, "message_status", {"message_id": m.id, "status": "read"})

    return {"status": "read"}


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    conv_id = msg.conversation_id
    db.delete(msg)
    db.commit()

    member_uids = [m.user_id for m in db.query(ConversationMember).filter(ConversationMember.conversation_id == conv_id).all()]
    await manager.broadcast_to_users(member_uids, "message_deleted", {"message_id": message_id, "conversation_id": conv_id})

    return {"status": "deleted"}


@router.post("/messages/{message_id}/reactions")
async def toggle_reaction(
    message_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emoji = payload.get("emoji")
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji required")

    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    existing = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == current_user.id,
        MessageReaction.emoji == emoji
    ).first()

    if existing:
        db.delete(existing)
    else:
        new_reaction = MessageReaction(
            message_id=message_id,
            user_id=current_user.id,
            emoji=emoji
        )
        db.add(new_reaction)

    db.commit()

    # Recalculate formatted reactions
    reactions = db.query(MessageReaction).filter(MessageReaction.message_id == message_id).all()
    grouped = {}
    for r in reactions:
        if r.emoji not in grouped:
            grouped[r.emoji] = []
        grouped[r.emoji].append(r.user_id)

    formatted_reactions = [
        {"emoji": emo, "count": len(uids), "userIds": uids}
        for emo, uids in grouped.items()
    ]

    member_uids = [m.user_id for m in db.query(ConversationMember).filter(ConversationMember.conversation_id == msg.conversation_id).all()]
    await manager.broadcast_to_users(member_uids, "message_reaction", {
        "message_id": message_id,
        "reactions": formatted_reactions
    })

    return formatted_reactions

