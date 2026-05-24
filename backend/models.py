from pydantic import BaseModel, Field


class BoardSummary(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: str
    updated_at: str


class BoardTitleUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=500)


class ColumnRename(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class CardCreate(BaseModel):
    column_id: int
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=10000)
    position: int | None = Field(default=None, ge=0)


class CardUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=10000)


class CardMove(BaseModel):
    column_id: int
    position: int = Field(ge=0)


class CardPayload(BaseModel):
    id: str
    title: str
    description: str | None
    column_id: int
    position: int


class ColumnPayload(BaseModel):
    id: int
    name: str
    position: int
    card_ids: list[str]


class BoardDetail(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: str
    updated_at: str
    columns: list[ColumnPayload]
    cards: dict[str, CardPayload]
