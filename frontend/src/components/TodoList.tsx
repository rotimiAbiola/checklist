import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Todo, TodoUpdateInput } from "../types/todo";
import { computeReorderedIds } from "../lib/reorder";
import { TodoItem } from "./TodoItem";
import { EmptyState } from "./EmptyState";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number, completed: boolean) => void;
  onUpdate: (id: number, input: TodoUpdateInput) => void;
  onDelete: (id: number) => void;
  onTagClick?: (tag: string) => void;
  editingId: number | null;
  onStartEdit: (id: number) => void;
  onCancelEdit: () => void;
  focusedIndex?: number | null;
  selectMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  dragEnabled?: boolean;
  onReorder?: (orderedIds: number[]) => void;
  onAddSubtask: (todoId: number, title: string) => void;
  onToggleSubtask: (todoId: number, subtaskId: number, completed: boolean) => void;
  onDeleteSubtask: (todoId: number, subtaskId: number) => void;
}

export function TodoList({
  todos,
  onToggle,
  onUpdate,
  onDelete,
  onTagClick,
  editingId,
  onStartEdit,
  onCancelEdit,
  focusedIndex = null,
  selectMode = false,
  selectedIds,
  onToggleSelect,
  dragEnabled = false,
  onReorder,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (todos.length === 0) {
    return <EmptyState message="No todos match your filters. Time to relax, or add a new one!" />;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !onReorder) return;
    onReorder(computeReorderedIds(todos, Number(active.id), Number(over.id)));
  }

  const list = (
    <ul className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {todos.map((todo, index) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onTagClick={onTagClick}
            isEditing={todo.id === editingId}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            isFocused={index === focusedIndex}
            selectMode={selectMode}
            isSelected={selectedIds?.has(todo.id)}
            onToggleSelect={onToggleSelect}
            dragEnabled={dragEnabled}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        ))}
      </AnimatePresence>
    </ul>
  );

  if (!dragEnabled) return list;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {list}
      </SortableContext>
    </DndContext>
  );
}
