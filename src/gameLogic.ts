import type { Card, Suit, Rank, Color, GameState, SuitCount } from "./types";

const ALL_SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function getSuitsForMode(suitCount: SuitCount): Suit[] {
  switch (suitCount) {
    case 1:
      return ["spades"];
    case 2:
      return ["spades", "hearts"];
    case 4:
      return ALL_SUITS;
  }
}

export function getColor(suit: Suit): Color {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function getRankValue(rank: Rank): number {
  return RANKS.indexOf(rank) + 1;
}

export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return symbols[suit];
}

function createDeck(suitCount: SuitCount): Card[] {
  const suits = getSuitsForMode(suitCount);
  const decksPerSuit = 8 / suits.length; // total 8 suit-sets across 104 cards
  const deck: Card[] = [];
  let uid = 0;

  for (let d = 0; d < decksPerSuit; d++) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        deck.push({
          suit,
          rank,
          faceUp: false,
          id: `${rank}-${suit}-${uid++}`,
        });
      }
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(suitCount: SuitCount = 1): GameState {
  const deck = shuffle(createDeck(suitCount));
  const tableau: Card[][] = [];
  let idx = 0;

  // 10 columns: first 4 get 6 cards, last 6 get 5 cards
  for (let col = 0; col < 10; col++) {
    const cardCount = col < 4 ? 6 : 5;
    const pile: Card[] = [];
    for (let row = 0; row < cardCount; row++) {
      const card = { ...deck[idx] };
      card.faceUp = row === cardCount - 1;
      pile.push(card);
      idx++;
    }
    tableau.push(pile);
  }

  // Remaining 50 cards go to stock (5 deals of 10)
  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));

  return {
    stock,
    tableau,
    completed: 0,
    moves: 0,
    won: false,
    suitCount,
  };
}

/**
 * Check if a card can be placed on a tableau pile.
 * In Spider, any card can go on a card one rank higher (regardless of suit).
 * An empty pile accepts any card.
 */
export function canPlaceOnTableau(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return true;
  const topCard = pile[pile.length - 1];
  if (!topCard.faceUp) return false;
  return getRankValue(topCard.rank) - getRankValue(card.rank) === 1;
}

/**
 * Check if a sequence of face-up cards starting at cardIdx is a valid
 * same-suit descending run (required for moving multiple cards).
 */
export function isValidRun(pile: Card[], cardIdx: number): boolean {
  for (let i = cardIdx; i < pile.length - 1; i++) {
    const current = pile[i];
    const next = pile[i + 1];
    if (!current.faceUp || !next.faceUp) return false;
    if (current.suit !== next.suit) return false;
    if (getRankValue(current.rank) - getRankValue(next.rank) !== 1)
      return false;
  }
  return pile[cardIdx].faceUp;
}

/**
 * Deal 10 cards from stock, one to each tableau column.
 * All columns must have at least one card before dealing.
 */
export function dealFromStock(state: GameState): GameState | null {
  if (state.stock.length === 0) return null;
  // All columns must have at least one card
  if (state.tableau.some((pile) => pile.length === 0)) return null;

  const newState = cloneState(state);
  for (let col = 0; col < 10; col++) {
    const card = newState.stock.pop()!;
    card.faceUp = true;
    newState.tableau[col].push(card);
  }
  newState.moves++;

  return checkAndRemoveCompletedSequences(newState);
}

/**
 * Move cards from one tableau pile to another.
 * The moved sequence must be a valid same-suit run.
 */
export function moveTableauToTableau(
  state: GameState,
  fromIdx: number,
  cardIdx: number,
  toIdx: number,
): GameState | null {
  if (fromIdx === toIdx) return null;
  const fromPile = state.tableau[fromIdx];
  if (fromPile.length === 0 || cardIdx < 0 || cardIdx >= fromPile.length)
    return null;

  const card = fromPile[cardIdx];
  if (!card.faceUp) return null;

  // Must be a valid same-suit run from cardIdx to end
  if (!isValidRun(fromPile, cardIdx)) return null;

  if (!canPlaceOnTableau(card, state.tableau[toIdx])) return null;

  const newState = cloneState(state);
  const cardsToMove = newState.tableau[fromIdx].splice(cardIdx);
  newState.tableau[toIdx].push(...cardsToMove);
  flipTopCard(newState.tableau[fromIdx]);
  newState.moves++;

  return checkAndRemoveCompletedSequences(newState);
}

/**
 * Check all tableau piles for a complete K-to-A same-suit sequence
 * and remove them.
 */
function checkAndRemoveCompletedSequences(state: GameState): GameState {
  let changed = true;
  while (changed) {
    changed = false;
    for (let col = 0; col < 10; col++) {
      const pile = state.tableau[col];
      if (pile.length < 13) continue;

      // Check if the last 13 cards form a K-to-A same-suit sequence
      const startIdx = pile.length - 13;
      const bottomCard = pile[startIdx];
      if (!bottomCard.faceUp || bottomCard.rank !== "K") continue;

      let valid = true;
      const suit = bottomCard.suit;
      for (let i = 0; i < 13; i++) {
        const c = pile[startIdx + i];
        if (!c.faceUp || c.suit !== suit || getRankValue(c.rank) !== 13 - i) {
          valid = false;
          break;
        }
      }

      if (valid) {
        pile.splice(startIdx, 13);
        flipTopCard(pile);
        state.completed++;
        changed = true;
      }
    }
  }

  state.won = state.completed >= 8;
  return state;
}

function flipTopCard(pile: Card[]) {
  if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
    pile[pile.length - 1].faceUp = true;
  }
}

function cloneState(state: GameState): GameState {
  return {
    stock: state.stock.map((c) => ({ ...c })),
    tableau: state.tableau.map((t) => t.map((c) => ({ ...c }))),
    completed: state.completed,
    moves: state.moves,
    won: state.won,
    suitCount: state.suitCount,
  };
}
