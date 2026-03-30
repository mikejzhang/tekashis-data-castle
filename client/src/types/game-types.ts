export type GamePhase = "drafting" | "planning" | "judging";

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
}

export interface JudgeVerdict {
  name: string;
  persona: string;
  comment: string;
  score: number;
}
