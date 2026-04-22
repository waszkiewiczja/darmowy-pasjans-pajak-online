import React, { useRef } from "react";
import type { Card as CardType } from "./types";
import { getColor, getSuitSymbol } from "./gameLogic";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (
    e: React.MouseEvent | React.TouchEvent,
    el: HTMLElement,
  ) => void;
  style?: React.CSSProperties;
  className?: string;
}

export function CardView({
  card,
  onClick,
  onDoubleClick,
  onDragStart,
  style,
  className = "",
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (!card.faceUp) {
    return (
      <div
        className={`card card-back ${className}`}
        style={style}
        onClick={onClick}
      >
        <div className="card-back-pattern">🕷</div>
      </div>
    );
  }

  const color = getColor(card.suit);
  const symbol = getSuitSymbol(card.suit);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (onDragStart && ref.current) {
      onDragStart(e, ref.current);
    }
  };

  return (
    <div
      ref={ref}
      className={`card card-front card-${color} ${className}`}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      <div className="card-corner card-corner-top">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{symbol}</span>
      </div>
      <div className="card-center">{symbol}</div>
      <div className="card-corner card-corner-bottom">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{symbol}</span>
      </div>
    </div>
  );
}

interface EmptyPileProps {
  label?: string;
  onClick?: () => void;
  dropType?: string;
  dropIndex?: number;
  className?: string;
}

export function EmptyPile({
  label,
  onClick,
  dropType,
  dropIndex,
  className = "",
}: EmptyPileProps) {
  return (
    <div
      className={`card card-empty ${className}`}
      onClick={onClick}
      data-drop-type={dropType}
      data-drop-index={dropIndex}
    >
      {label && <span className="empty-label">{label}</span>}
    </div>
  );
}
