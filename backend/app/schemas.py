from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import Priority, Recurrence


class SubtaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title must not be blank")
        return v


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    completed: bool | None = None
    position: int | None = None


class SubtaskOut(SubtaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    todo_id: int
    completed: bool
    position: int


class TodoBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    priority: Priority = Priority.medium
    due_date: date | None = None
    recurrence: Recurrence | None = None
    tags: list[str] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title must not be blank")
        return v

    @field_validator("tags")
    @classmethod
    def normalize_tags(cls, v: list[str]) -> list[str]:
        cleaned = [tag.strip() for tag in v if tag and tag.strip()]
        # de-duplicate while preserving order
        seen: set[str] = set()
        result = []
        for tag in cleaned:
            if tag.lower() not in seen:
                seen.add(tag.lower())
                result.append(tag)
        return result


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    completed: bool | None = None
    priority: Priority | None = None
    due_date: date | None = None
    recurrence: Recurrence | None = None
    tags: list[str] | None = None
    position: int | None = None


class TodoOut(TodoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    completed: bool
    position: int
    created_at: datetime
    updated_at: datetime
    subtasks: list[SubtaskOut] = Field(default_factory=list)


class StatsOut(BaseModel):
    total: int
    completed: int
    pending: int
    overdue: int
    by_priority: dict[str, int]


class ReorderRequest(BaseModel):
    ordered_ids: list[int] = Field(min_length=1)


class BulkAction(BaseModel):
    ids: list[int] = Field(min_length=1)
    action: Literal["complete", "incomplete", "delete", "add_tag", "remove_tag"]
    tag: str | None = None

    @field_validator("tag")
    @classmethod
    def tag_not_blank(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        return v or None
