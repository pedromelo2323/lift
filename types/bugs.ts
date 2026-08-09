export type BugKind = "bug" | "idea";

export type BugReport = {
  id: string;
  body: string;
  kind: BugKind;
  resolved: boolean;
  created_at: string;
};
