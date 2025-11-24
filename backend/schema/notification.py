from pydantic import BaseModel
from typing import Literal

class NotificationRequest(BaseModel):
    trip_id: int
    message_type: Literal["arriving_10_min", "departing_3_min", "running_late", "custom"]
    custom_message: str | None = None

class NotificationResponse(BaseModel):
    message: str
    trip_id: int
    recipients_count: int
    failed_count: int
