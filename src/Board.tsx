import { useState, useCallback } from "react";
import type { GameState, DragItem, SuitCount } from "./types";
import SeoArticle from "./SeoArticle";
import {
  createGame,
  dealFromStock,
  moveTableauToTableau,
  isValidRun,
} from "./gameLogic";
import { CardView, EmptyPile } from "./CardView";
import { useDragAndDrop } from "./useDragAndDrop";

export default function Board() {
  const [game, setGame] = useState<GameState>(() => createGame(1));
  const [selectedCard, setSelectedCard] = useState<DragItem | null>(null);
  const [showArticle, setShowArticle] = useState(false);

  const handleNewGame = (suits?: SuitCount) => {
    setGame(createGame(suits ?? game.suitCount));
    setSelectedCard(null);
  };

  const handleDeal = () => {
    const result = dealFromStock(game);
    if (result) {
      setGame(result);
      setSelectedCard(null);
    }
  };

  const handleDrop = useCallback(
    (item: DragItem, targetType: string, targetIndex: number) => {
      setSelectedCard(null);
      if (item.sourceType === "tableau" && targetType === "tableau") {
        const result = moveTableauToTableau(
          game,
          item.sourceIndex,
          item.cardIndex,
          targetIndex,
        );
        if (result) setGame(result);
      }
    },
    [game],
  );

  const { startDrag } = useDragAndDrop(handleDrop);

  const handleCardClick = (item: DragItem) => {
    if (selectedCard) {
      handleDrop(selectedCard, item.sourceType, item.sourceIndex);
      setSelectedCard(null);
    } else {
      setSelectedCard(item);
    }
  };

  const handleEmptyTableauClick = (idx: number) => {
    if (selectedCard) {
      handleDrop(selectedCard, "tableau", idx);
      setSelectedCard(null);
    }
  };

  const isSelected = (cardId: string) =>
    selectedCard?.cards.some((c) => c.id === cardId) ?? false;

  const stockDealsLeft = Math.floor(game.stock.length / 10);
  const canDeal =
    game.stock.length > 0 && game.tableau.every((pile) => pile.length > 0);

  return (
    <div className="board">
      {/* Header */}
      <div className="board-header">
        <h1>
          <button
            className="gear-btn"
            onClick={() => setShowArticle(true)}
            aria-label="Informacje"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>{" "}
          Pasjans Pająk
        </h1>
        <div className="board-controls">
          <span className="move-counter">Ruchy: {game.moves}</span>
          <span className="move-counter">Ukończone: {game.completed}/8</span>
          <button className="btn btn-new" onClick={() => handleNewGame()}>
            Nowa gra
          </button>
        </div>
      </div>

      {/* Difficulty selector */}
      <div className="difficulty-row">
        <span className="difficulty-label">Poziom:</span>
        <button
          className={`btn btn-diff ${game.suitCount === 1 ? "btn-diff-active" : ""}`}
          onClick={() => handleNewGame(1)}
        >
          1 kolor
        </button>
        <button
          className={`btn btn-diff ${game.suitCount === 2 ? "btn-diff-active" : ""}`}
          onClick={() => handleNewGame(2)}
        >
          2 kolory
        </button>
        <button
          className={`btn btn-diff ${game.suitCount === 4 ? "btn-diff-active" : ""}`}
          onClick={() => handleNewGame(4)}
        >
          4 kolory
        </button>
        {/* Stock deal button */}
        <div className="stock-area">
          {game.stock.length > 0 ? (
            <button
              className={`btn btn-deal ${!canDeal ? "btn-disabled" : ""}`}
              onClick={handleDeal}
              disabled={!canDeal}
              title={
                canDeal
                  ? `Rozdaj karty (${stockDealsLeft} pozostało)`
                  : "Wszystkie kolumny muszą mieć karty"
              }
            >
              🕷 Rozdaj ({stockDealsLeft})
            </button>
          ) : (
            <span className="stock-empty-label">Brak kart</span>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="tableau">
        {game.tableau.map((pile, ti) => (
          <div
            key={ti}
            className="tableau-pile"
            data-drop-type="tableau"
            data-drop-index={ti}
          >
            {pile.length === 0 ? (
              <EmptyPile
                dropType="tableau"
                dropIndex={ti}
                onClick={() => handleEmptyTableauClick(ti)}
              />
            ) : (
              pile.map((card, ci) => (
                <CardView
                  key={card.id}
                  card={card}
                  style={{ top: `${ci * (card.faceUp ? 24 : 8)}px` }}
                  className={`tableau-card ${isSelected(card.id) ? "selected" : ""}`}
                  onClick={() => {
                    if (card.faceUp) {
                      if (isValidRun(pile, ci)) {
                        handleCardClick({
                          cards: pile.slice(ci),
                          sourceType: "tableau",
                          sourceIndex: ti,
                          cardIndex: ci,
                        });
                      }
                    }
                  }}
                  onDragStart={
                    card.faceUp && isValidRun(pile, ci)
                      ? (e, el) =>
                          startDrag(
                            e,
                            {
                              cards: pile.slice(ci),
                              sourceType: "tableau",
                              sourceIndex: ti,
                              cardIndex: ci,
                            },
                            el,
                          )
                      : undefined
                  }
                />
              ))
            )}
          </div>
        ))}
      </div>

      {/* SEO Article Modal */}
      {showArticle && (
        <div className="modal-overlay" onClick={() => setShowArticle(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowArticle(false)}
            >
              ×
            </button>
            <SeoArticle />
          </div>
        </div>
      )}

      {/* Win overlay */}
      {game.won && (
        <div className="win-overlay">
          <div className="win-dialog">
            <h2>🎉 Gratulacje!</h2>
            <p>Wygrałeś w {game.moves} ruchach!</p>
            <button className="btn btn-new" onClick={() => handleNewGame()}>
              Nowa gra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
