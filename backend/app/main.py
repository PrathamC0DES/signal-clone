import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .database import engine, Base, get_db, SessionLocal
from .models import User, ConversationMember
from .websocket_manager import manager
from .routers import auth, conversations, messages, contacts, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    Base.metadata.create_all(bind=engine)
    # Check if we should seed
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            from .seed import seed_database
            seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Signal Web API",
    description="Backend API for Signal Web Fullstack Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(contacts.router)
app.include_router(upload.router)


@app.get("/")
def root():
    return {
        "app": "Signal Clone Backend API",
        "status": "online",
        "docs": "/docs",
        "realtime": "/ws/{user_id}"
    }


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)

    # Broadcast user is online & mark pending sent messages to this user as delivered
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = True
            db.commit()
            all_uids = list(manager.active_connections.keys())
            await manager.broadcast_to_users(all_uids, "presence", {"user_id": user_id, "is_online": True})

            # Find messages in conversations where user_id is a member, sender_id != user_id, and status == 'sent'
            user_conv_ids = [cm.conversation_id for cm in db.query(ConversationMember).filter(ConversationMember.user_id == user_id).all()]
            if user_conv_ids:
                from .models import Message
                undelivered = db.query(Message).filter(
                    Message.conversation_id.in_(user_conv_ids),
                    Message.sender_id != user_id,
                    Message.status == "sent"
                ).all()
                if undelivered:
                    senders_to_notify = []
                    for um in undelivered:
                        um.status = "delivered"
                        senders_to_notify.append((um.sender_id, um.id, um.conversation_id))
                    db.commit()

                    for sid, mid, cid in senders_to_notify:
                        await manager.send_to_user(sid, "message_status", {
                            "message_id": mid,
                            "conversation_id": cid,
                            "status": "delivered"
                        })
    finally:
        db.close()

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")
            payload = data.get("data", {})

            if event == "ping":
                await websocket.send_json({"event": "pong"})

            elif event in ("start_typing", "stop_typing"):
                conversation_id = payload.get("conversation_id")
                if conversation_id:
                    db = SessionLocal()
                    try:
                        members = (
                            db.query(ConversationMember)
                            .filter(
                                ConversationMember.conversation_id == conversation_id,
                                ConversationMember.user_id != user_id
                            )
                            .all()
                        )
                        target_uids = [m.user_id for m in members]
                        is_typing = event == "start_typing"
                        await manager.broadcast_to_users(
                            target_uids,
                            "typing_status",
                            {
                                "conversation_id": conversation_id,
                                "user_id": user_id,
                                "is_typing": is_typing
                            }
                        )
                    finally:
                        db.close()

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        if not manager.is_user_online(user_id):
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.is_online = False
                    db.commit()
                    all_uids = list(manager.active_connections.keys())
                    await manager.broadcast_to_users(all_uids, "presence", {"user_id": user_id, "is_online": False})
            finally:
                db.close()
    except Exception:
        manager.disconnect(user_id, websocket)

