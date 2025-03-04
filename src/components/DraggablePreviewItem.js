// src/components/DraggablePreviewItem.js

import React from "react";
import { useDrag, useDrop } from "react-dnd";

/** Тип для DnD (тот же, что и в EditComplex) */
const DRAG_TYPE = "EXISTING_IMAGE";

/**
 * Компонент «карточка фото», которую можно перетаскивать.
 * 
 * @param {object} props.item - объект { id, url }
 * @param {number} props.index - индекс в массиве
 * @param {function} props.moveItem(dragIndex: number, hoverIndex: number): void - перестановка
 * @param {function} props.onRemove(index: number): void - удаление
 */
export default function DraggablePreviewItem({ item, index, moveItem, onRemove }) {
  // Источник (useDrag)
  const [{ isDragging }, dragRef] = useDrag({
    type: DRAG_TYPE,
    item: { index }, // При «захвате» передаём индекс
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Приёмник (useDrop)
  const [, dropRef] = useDrop({
    accept: DRAG_TYPE,
    hover: (dragged) => {
      if (dragged.index !== index) {
        moveItem(dragged.index, index);
        // Обновляем dragged.index, чтобы не было «дёргания»
        dragged.index = index;
      }
    },
  });

  // Объединяем ссылки ref
  const refFn = (node) => {
    dragRef(node);
    dropRef(node);
  };

  return (
    <div
      ref={refFn}
      style={{
        position: "relative",
        border: "1px solid #ccc",
        borderRadius: 4,
        overflow: "hidden",
        cursor: "move",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <img
        src={item.url}
        alt="complex"
        style={{ width: "100%", display: "block" }}
      />
      <button
        onClick={() => onRemove(index)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "red",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "4px",
        }}
      >
        Удалить
      </button>
    </div>
  );
}