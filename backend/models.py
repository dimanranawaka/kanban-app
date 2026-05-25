from pydantic import BaseModel, Field
from typing import List, Optional


class BoardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=2000)
    color: Optional[str] = Field(default="#209DD7", max_length=20)


class BoardSummary(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    color: Optional[str]
    created_at: str
    updated_at: str


class BoardTitleUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=2000)
    color: Optional[str] = Field(default=None, max_length=20)


class ColumnCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ColumnRename(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class CardCreate(BaseModel):
    column_id: int
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=10000)
    position: Optional[int] = Field(default=None, ge=0)
    due_date: Optional[str] = Field(default=None, max_length=20)
    priority: Optional[str] = Field(default="medium", max_length=20)
    labels: Optional[List[str]] = Field(default=None)


class CardUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=10000)
    due_date: Optional[str] = Field(default=None, max_length=20)
    priority: Optional[str] = Field(default=None, max_length=20)
    labels: Optional[List[str]] = Field(default=None)


class CardMove(BaseModel):
    column_id: int
    position: int = Field(ge=0)


class CardPayload(BaseModel):
    id: str
    title: str
    description: Optional[str]
    column_id: int
    position: int
    due_date: Optional[str]
    priority: Optional[str]
    labels: List[str]


class ColumnPayload(BaseModel):
    id: int
    name: str
    position: int
    card_ids: List[str]


class BoardDetail(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    color: Optional[str]
    created_at: str
    updated_at: str
    columns: List[ColumnPayload]
    cards: dict[str, CardPayload]


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=200)
    current_password: Optional[str] = Field(default=None)
    new_password: Optional[str] = Field(default=None, min_length=6)


class UserProfile(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    email: Optional[str]
    created_at: str
