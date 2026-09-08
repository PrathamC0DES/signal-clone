import json
from typing import Dict, Set, List, Any
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # user_id -> set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    def is_user_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_to_user(self, user_id: str, event_type: str, data: Any):
        if user_id in self.active_connections:
            payload = json.dumps({"event": event_type, "data": data})
            dead_sockets = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.active_connections[user_id].discard(ws)

    async def broadcast_to_users(self, user_ids: List[str], event_type: str, data: Any):
        for uid in user_ids:
            await self.send_to_user(uid, event_type, data)


manager = ConnectionManager()

