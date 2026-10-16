import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Link2, Unlink2 } from "lucide-react";
import type { Exercise } from "@/lib/lift/types";
import { cn } from "@/lib/utils";

type Ordered = { id: string; position: number; linked_to_next: boolean };

type Props = {
  exercises: Exercise[];
  onReorder: (ordered: Ordered[]) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

function serialize(list: Exercise[]): Ordered[] {
  return list.map((e, i) => ({
    id: e.id,
    position: i,
    // The last exercise can't link to anything below it.
    linked_to_next: i < list.length - 1 ? e.linked_to_next : false,
  }));
}

export function EditExerciseList({ exercises, onReorder, onRename, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = exercises.findIndex((e) => e.id === active.id);
    const to = exercises.findIndex((e) => e.id === over.id);
    // Moving an exercise pulls it out of any superset it was in.
    const copy = exercises.map((e) => ({ ...e }));
    if (from > 0) copy[from - 1]!.linked_to_next = false;
    copy[from]!.linked_to_next = false;
    const moved = arrayMove(copy, from, to);
    if (to > 0) moved[to - 1]!.linked_to_next = false;
    onReorder(serialize(moved));
  };

  const toggleLink = (index: number) => {
    const copy = exercises.map((e) => ({ ...e }));
    copy[index]!.linked_to_next = !copy[index]!.linked_to_next;
    onReorder(serialize(copy));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <p className="mb-3 text-[13px] text-muted-foreground">
          Drag to reorder. Tap the link between two exercises to make a superset.
        </p>
        <div>
          {exercises.map((exercise, index) => (
            <div key={exercise.id}>
              <SortableItem
                exercise={exercise}
                linkedAbove={index > 0 && exercises[index - 1]!.linked_to_next}
                linkedBelow={exercise.linked_to_next && index < exercises.length - 1}
                onRename={(name) => onRename(exercise.id, name)}
                onDelete={() => onDelete(exercise.id)}
              />
              {index < exercises.length - 1 ? (
                <LinkToggle
                  linked={exercise.linked_to_next}
                  onToggle={() => toggleLink(index)}
                />
              ) : null}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function LinkToggle({ linked, onToggle }: { linked: boolean; onToggle: () => void }) {
  return (
    <div className="relative flex h-8 items-center justify-center">
      {linked ? (
        <span aria-hidden className="absolute bottom-0 left-[18px] top-0 w-px bg-foreground" />
      ) : null}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={linked}
        aria-label={linked ? "Split superset" : "Pair as superset"}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] transition-colors duration-150",
          linked
            ? "border-foreground bg-foreground text-background"
            : "border-dashed border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {linked ? <Link2 className="size-3" /> : <Unlink2 className="size-3" />}
        {linked ? "Superset" : "Pair"}
      </button>
    </div>
  );
}

function SortableItem({
  exercise,
  linkedAbove,
  linkedBelow,
  onRename,
  onDelete,
}: {
  exercise: Exercise;
  linkedAbove: boolean;
  linkedBelow: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.id });
  const [name, setName] = useState(exercise.name);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-2 rounded-xl border bg-card px-2 py-2.5",
        linkedAbove || linkedBelow ? "border-foreground/40" : "border-border",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag ${exercise.name}`}
        className="touch-none cursor-grab px-1 text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== exercise.name && onRename(name.trim())}
        className="min-w-0 flex-1 bg-transparent text-[16px] outline-none"
      />
      <button type="button" onClick={onDelete} className="px-2 text-[13px] text-destructive">
        Delete
      </button>
    </div>
  );
}
