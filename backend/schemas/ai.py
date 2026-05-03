from pydantic import BaseModel, Field
from typing import Literal

class KanbanAction(BaseModel):
    action_type: Literal["add_card", "update_card", "move_card", "delete_card"] = Field(
        description="The type of action to perform on the Kanban board."
    )
    card_id: int | None = Field(
        default=None, description="The ID of the card (required for update, move, delete)."
    )
    column_id: int | None = Field(
        default=None, description="The ID of the destination column (required for add, move)."
    )
    title: str | None = Field(
        default=None, description="The title of the card (required for add, optional for update)."
    )
    description: str | None = Field(
        default=None, description="The description/details of the card (optional for add and update)."
    )
    position: int | None = Field(
        default=None, description="The position in the column (optional for add and move)."
    )

class AIStructuredOutput(BaseModel):
    response_text: str = Field(description="The natural language response to the user.")
    actions: list[KanbanAction] = Field(
        description="A list of database actions to execute to fulfill the user's request."
    )

class ChatMessagePayload(BaseModel):
    board_id: int
    message: str
