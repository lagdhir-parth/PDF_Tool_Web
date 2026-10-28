import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PdfThumbnail } from "./PdfThumbnail";
import type { PdfPageItem } from "../../types/pdf";

interface SortableThumbnailItemProps {
  page: PdfPageItem;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onRotate?: (e: React.MouseEvent) => void;
  enableDrag?: boolean;
}

const SortableThumbnailItem: React.FC<SortableThumbnailItemProps> = ({
  page,
  isSelected,
  onToggleSelect,
  onRotate,
  enableDrag = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id, disabled: !enableDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <PdfThumbnail
        page={page}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        onRotate={onRotate}
      />
    </div>
  );
};

interface PdfPageGridProps {
  pages: PdfPageItem[];
  selectedIds?: string[];
  onToggleSelect?: (id: string, isMulti?: boolean) => void;
  onRotatePage?: (id: string) => void;
  onReorderPages?: (newPages: PdfPageItem[]) => void;
  enableDrag?: boolean;
}

export const PdfPageGrid: React.FC<PdfPageGridProps> = ({
  pages,
  selectedIds = [],
  onToggleSelect,
  onRotatePage,
  onReorderPages,
  enableDrag = true,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderPages) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderPages(arrayMove(pages, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={pages.map((p) => p.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pages.map((page) => (
            <SortableThumbnailItem
              key={page.id}
              page={page}
              isSelected={selectedIds.includes(page.id)}
              onToggleSelect={(e) =>
                onToggleSelect?.(page.id, e.shiftKey || e.ctrlKey || e.metaKey)
              }
              onRotate={() => onRotatePage?.(page.id)}
              enableDrag={enableDrag}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
