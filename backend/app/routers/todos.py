from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.models import Priority
from app.schemas import (
    BulkAction,
    ReorderRequest,
    StatsOut,
    SubtaskCreate,
    SubtaskOut,
    SubtaskUpdate,
    TodoCreate,
    TodoOut,
    TodoUpdate,
)

router = APIRouter(prefix="/api/todos", tags=["todos"])


def _get_todo_or_404(todo_id: int, db: Session, *, include_deleted: bool = False):
    todo = crud.get_todo(db, todo_id, include_deleted=include_deleted)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.post("", response_model=TodoOut, status_code=201)
def create_todo(todo_in: TodoCreate, db: Session = Depends(get_db)):
    return crud.create_todo(db, todo_in)


@router.get("", response_model=list[TodoOut])
def list_todos(
    completed: bool | None = None,
    priority: Priority | None = None,
    tag: str | None = None,
    search: str | None = None,
    due_before: date | None = None,
    sort_by: str = "position",
    order: str = "asc",
    db: Session = Depends(get_db),
):
    return crud.list_todos(
        db,
        completed=completed,
        priority=priority,
        tag=tag,
        search=search,
        due_before=due_before,
        sort_by=sort_by,
        order=order,
    )


@router.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)


@router.post("/reorder", response_model=list[TodoOut])
def reorder_todos(payload: ReorderRequest, db: Session = Depends(get_db)):
    return crud.reorder_todos(db, payload.ordered_ids)


@router.post("/bulk", response_model=list[TodoOut])
def bulk_action(payload: BulkAction, db: Session = Depends(get_db)):
    if payload.action in ("add_tag", "remove_tag") and not payload.tag:
        raise HTTPException(status_code=422, detail="tag is required for this action")
    return crud.apply_bulk_action(db, payload)


@router.get("/{todo_id}", response_model=TodoOut)
def get_todo(todo_id: int, db: Session = Depends(get_db)):
    return _get_todo_or_404(todo_id, db)


@router.put("/{todo_id}", response_model=TodoOut)
@router.patch("/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, todo_in: TodoUpdate, db: Session = Depends(get_db)):
    todo = _get_todo_or_404(todo_id, db)
    was_completed = todo.completed
    updated = crud.update_todo(db, todo, todo_in)

    if not was_completed and updated.completed and updated.recurrence:
        crud.create_next_occurrence(db, updated)

    return updated


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = _get_todo_or_404(todo_id, db)
    crud.soft_delete_todo(db, todo)
    return None


@router.post("/{todo_id}/restore", response_model=TodoOut)
def restore_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = crud.get_todo(db, todo_id, include_deleted=True)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    if todo.deleted_at is None:
        raise HTTPException(status_code=400, detail="Todo is not deleted")
    return crud.restore_todo(db, todo)


@router.post("/{todo_id}/subtasks", response_model=SubtaskOut, status_code=201)
def create_subtask(todo_id: int, subtask_in: SubtaskCreate, db: Session = Depends(get_db)):
    todo = _get_todo_or_404(todo_id, db)
    return crud.create_subtask(db, todo, subtask_in)


@router.patch("/{todo_id}/subtasks/{subtask_id}", response_model=SubtaskOut)
def update_subtask(
    todo_id: int, subtask_id: int, subtask_in: SubtaskUpdate, db: Session = Depends(get_db)
):
    _get_todo_or_404(todo_id, db)
    subtask = crud.get_subtask(db, todo_id, subtask_id)
    if subtask is None:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return crud.update_subtask(db, subtask, subtask_in)


@router.delete("/{todo_id}/subtasks/{subtask_id}", status_code=204)
def delete_subtask(todo_id: int, subtask_id: int, db: Session = Depends(get_db)):
    _get_todo_or_404(todo_id, db)
    subtask = crud.get_subtask(db, todo_id, subtask_id)
    if subtask is None:
        raise HTTPException(status_code=404, detail="Subtask not found")
    crud.delete_subtask(db, subtask)
    return None
