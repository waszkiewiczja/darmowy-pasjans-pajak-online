export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Color = "red" | "black";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type SuitCount = 1 | 2 | 4;

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

export interface GameState {
  stock: Card[]; // remaining cards to deal (5 deals of 10)
  tableau: Card[][]; // 10 piles
  completed: number; // number of completed suit sequences removed (goal: 8)
  moves: number;
  won: boolean;
  suitCount: SuitCount;
}

export interface DragItem {
  cards: Card[];
  sourceType: "tableau";
  sourceIndex: number;
  cardIndex: number;
}
