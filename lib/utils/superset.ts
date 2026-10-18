import type { ExerciseLayout } from "@/lib/workouts/mutations";

type Linkable = { id: string; linked_to_next: boolean };

/** The layout to save; the last exercise never links past the end. */
function toLayout(list: Linkable[]): ExerciseLayout {
  return list.map((e, i) => ({ id: e.id, linked_to_next: i < list.length - 1 && e.linked_to_next }));
}

/** Moves an exercise; moving pulls it out of any superset, on both sides. */
export function moveExercise(list: Linkable[], from: number, to: number): ExerciseLayout {
  const copy = list.map((e) => ({ id: e.id, linked_to_next: e.linked_to_next }));
  if (from > 0) copy[from - 1]!.linked_to_next = false;
  copy[from]!.linked_to_next = false;
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved!);
  if (to > 0) copy[to - 1]!.linked_to_next = false;
  return toLayout(copy);
}

/** Pairs or splits an exercise with the one below it. */
export function toggleSuperset(list: Linkable[], index: number): ExerciseLayout {
  return toLayout(list.map((e, i) => ({ id: e.id, linked_to_next: i === index ? !e.linked_to_next : e.linked_to_next })));
}

/** The layout after removing an exercise: the one above stays linked only if the removed one linked onward. */
export function removeExercise(list: Linkable[], index: number): ExerciseLayout {
  const copy = list.map((e) => ({ id: e.id, linked_to_next: e.linked_to_next }));
  if (index > 0 && copy[index - 1]!.linked_to_next) copy[index - 1]!.linked_to_next = copy[index]!.linked_to_next;
  copy.splice(index, 1);
  return toLayout(copy);
}
