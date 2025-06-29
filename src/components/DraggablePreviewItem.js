// src/components/DraggablePreviewItem.js

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { X } from 'lucide-react';
import { Button } from './ui/button';

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
const DraggablePreviewItem = ({ id, index, url, onRemove, moveImage }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'IMAGE',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'IMAGE',
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative group aspect-square rounded-lg overflow-hidden border ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ cursor: 'move' }}
    >
      <img
        src={url}
        alt={`Preview ${index + 1}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DraggablePreviewItem;