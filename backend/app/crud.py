import calendar
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Priority, Recurrence, Subtask, Todo, _utcnow
from app.schemas import BulkAction, SubtaskCreate, SubtaskUpdate, TodoCreate, TodoUpdate


def _not_deleted(stmt):
    return stmt.where(Todo.deleted_at.is_(None))


def create_todo(db: Session, todo_in: TodoCreate) -> Todo:
    max_position = db.scalar(select(func.max(Todo.position))) or 0
    todo = Todo(**todo_in.model_dump(), position=max_position + 1)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


def get_todo(db: Session, todo_id: int, *, include_deleted: bool = False) -> Todo | None:
    todo = db.get(Todo, todo_id)
    if todo is None:
        return None
    if todo.deleted_at is not None and not include_deleted:
        return None
    return todo


def list_todos(
    db: Session,
    *,
    completed: bool | None = None,
    priority: Priority | None = None,
    tag: str | None = None,
    search: str | None = None,
    due_before: date | None = None,
    sort_by: str = "position",
    order: str = "asc",
) -> list[Todo]:
    stmt = _not_deleted(select(Todo))

    if completed is not None:
        stmt = stmt.where(Todo.completed == completed)
    if priority is not None:
        stmt = stmt.where(Todo.priority == priority)
    if due_before is not None:
        stmt = stmt.where(Todo.due_date <= due_before)
    if search:
        like = f"%{search.lower()}%"
        stmt = stmt.where(
            func.lower(Todo.title).like(like) | func.lower(Todo.description).like(like)
        )

    sort_column = {
        "position": Todo.position,
        "due_date": Todo.due_date,
        "priority": Todo.priority,
        "created_at": Todo.created_at,
        "title": Todo.title,
    }.get(sort_by, Todo.position)

    stmt = stmt.order_by(sort_column.desc() if order == "desc" else sort_column.asc())

    todos = list(db.scalars(stmt).all())

    if tag:
        todos = [t for t in todos if tag.lower() in [x.lower() for x in t.tags]]

    return todos


def update_todo(db: Session, todo: Todo, todo_in: TodoUpdate) -> Todo:
    data = todo_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


def soft_delete_todo(db: Session, todo: Todo) -> None:
    todo.deleted_at = _utcnow()
    db.commit()


def restore_todo(db: Session, todo: Todo) -> Todo:
    todo.deleted_at = None
    db.commit()
    db.refresh(todo)
    return todo


def get_stats(db: Session) -> dict:
    todos = list(db.scalars(_not_deleted(select(Todo))).all())
    today = date.today()
    total = len(todos)
    completed = sum(1 for t in todos if t.completed)
    pending = total - completed
    overdue = sum(1 for t in todos if not t.completed and t.due_date and t.due_date < today)
    by_priority = {p.value: 0 for p in Priority}
    for t in todos:
        by_priority[t.priority.value] += 1
    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "overdue": overdue,
        "by_priority": by_priority,
    }


# --- Reordering ---------------------------------------------------------


def reorder_todos(db: Session, ordered_ids: list[int]) -> list[Todo]:
    todos_by_id = {t.id: t for t in db.scalars(_not_deleted(select(Todo))).all()}
    for position, todo_id in enumerate(ordered_ids, start=1):
        todo = todos_by_id.get(todo_id)
        if todo is not None:
            todo.position = position
    db.commit()
    return list_todos(db)


# --- Bulk actions --------------------------------------------------------


def apply_bulk_action(db: Session, action: BulkAction) -> list[Todo]:
    todos = [
        t
        for t in db.scalars(_not_deleted(select(Todo).where(Todo.id.in_(action.ids)))).all()
    ]

    if action.action == "delete":
        for todo in todos:
            todo.deleted_at = _utcnow()
        db.commit()
        return []

    if action.action == "complete":
        for todo in todos:
            todo.completed = True
    elif action.action == "incomplete":
        for todo in todos:
            todo.completed = False
    elif action.action in ("add_tag", "remove_tag") and action.tag:
        for todo in todos:
            tags = list(todo.tags)
            lowered = [t.lower() for t in tags]
            if action.action == "add_tag":
                if action.tag.lower() not in lowered:
                    tags.append(action.tag)
            else:
                tags = [t for t in tags if t.lower() != action.tag.lower()]
            todo.tags = tags

    db.commit()
    for todo in todos:
        db.refresh(todo)
    return todos


# --- Recurrence ------------------------------------------------------------


def _advance_date(d: date, recurrence: Recurrence) -> date:
    if recurrence == Recurrence.daily:
        return d + timedelta(days=1)
    if recurrence == Recurrence.weekly:
        return d + timedelta(days=7)
    # monthly
    month = d.month + 1
    year = d.year + (month - 1) // 12
    month = (month - 1) % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def create_next_occurrence(db: Session, todo: Todo) -> Todo | None:
    if not todo.recurrence or not todo.due_date:
        return None
    max_position = db.scalar(select(func.max(Todo.position))) or 0
    next_todo = Todo(
        title=todo.title,
        description=todo.description,
        priority=todo.priority,
        due_date=_advance_date(todo.due_date, todo.recurrence),
        recurrence=todo.recurrence,
        tags=list(todo.tags),
        position=max_position + 1,
    )
    db.add(next_todo)
    db.commit()
    db.refresh(next_todo)
    return next_todo


# --- Subtasks --------------------------------------------------------------


def create_subtask(db: Session, todo: Todo, subtask_in: SubtaskCreate) -> Subtask:
    max_position = db.scalar(select(func.max(Subtask.position)).where(Subtask.todo_id == todo.id)) or 0
    subtask = Subtask(**subtask_in.model_dump(), todo_id=todo.id, position=max_position + 1)
    db.add(subtask)
    db.commit()
    db.refresh(subtask)
    return subtask


def get_subtask(db: Session, todo_id: int, subtask_id: int) -> Subtask | None:
    subtask = db.get(Subtask, subtask_id)
    if subtask is None or subtask.todo_id != todo_id:
        return None
    return subtask


def update_subtask(db: Session, subtask: Subtask, subtask_in: SubtaskUpdate) -> Subtask:
    data = subtask_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(subtask, field, value)
    db.commit()
    db.refresh(subtask)
    return subtask


def delete_subtask(db: Session, subtask: Subtask) -> None:
    db.delete(subtask)
    db.commit()
