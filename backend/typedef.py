# typedef.py

import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Literal, List
from pydantic import BaseModel, Field

# PriorityLiteral = Literal["force", "normal", "idle"] 暂时不使用

EventType = Literal[
    "expression."
]

class EventDatapack(BaseModel):
    """
    数据包 结构
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    type: EventType

    timestamp: int = Field(default_factory=lambda: int(time.time() * 1000))

    # version: int = 1

    payload: Dict[str, Any] = Field(default_factory=dict)

    # priority: Optional[PriorityLiteral] = None 暂时不使用

    # meta: Optional[Dict[str, Any]] = None 暂时不使用

    def pack(self) -> Dict[str, Any]:
        return self.model_dump(exclude_none=True)

# --- agent part ---

class EmotionMeta(BaseModel):
    """
    情绪感知 元数据
    """

    description: str = Field(default="无情绪", description="对于情绪的描述")

    intensity: float = Field(default=0.0, ge=0.0, le=1.0, description="情绪的强度")

    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="该分析的置信度")

    def __str__(self) -> str:
        return self.model_dump_json()

class IntentMeta(BaseModel):
    """
    意图感知 元数据
    """

    description: str = Field(default="无意图", description="对于意图的描述")

    intensity: float = Field(default=0.0, ge=0.0, le=1.0, description="意图的强度")

    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="意图的置信度")

    def __str__(self) -> str:
        return self.model_dump_json()

class ChatMeta(BaseModel):
    """
    元信息
    储存大模型通过文字感知出来的信息
    - 情绪
    - 意图
    """

    # 情绪感知
    emotion: EmotionMeta = EmotionMeta()

    # 意图感知
    intent: IntentMeta = IntentMeta()

    def __str__(self) -> str:
        return self.model_dump_json()

class ChatSingleMessage(BaseModel):
    """
    纯粹的聊天信息
    """

    role: Literal["human", "ai"]

    message: str

    def __str__(self) -> str:
        return self.model_dump_json()

class ChatMessage(BaseModel):
    """
    聊天信息
    """

    role: Literal["human", "ai"]

    message: str

    metadata: ChatMeta

    def __str__(self) -> str:
        return self.model_dump_json()

@dataclass
class GlobalAgentContext:
    """
    全局代理上下文
    """

    chat_history: List[ChatMessage] = []

    # 针对于整体的感知
    global_metadata: ChatMeta = ChatMeta()


__all__ = [
    "EventDatapack",
    "EmotionMeta",
    "IntentMeta",
    "ChatMeta",
    "ChatMessage",
    "GlobalAgentContext",
]
