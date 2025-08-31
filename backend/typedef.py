# typedef.py

import time
import uuid
from typing import Any, Dict, Literal

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

__all__ = [
    "EventDatapack",
]
