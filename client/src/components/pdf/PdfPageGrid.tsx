import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PdfThumbnail } from "./PdfThumbnail";
import { PdfPagePreviewModal } from "./PdfPagePreviewModal";
import type { PdfPageItem } from "../../types/pdf";

interface SortableThumbnailItemProps {
  page: PdfPageItem;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onRotate?: (e: React.MouseEvent) => void;
  onPreview?: (page: PdfPageItem) => void;
  enableDrag?: boolean;
  docProxy?: PDFDocumentProxy | null;
  docFingerprint?: string;
  showRotateButton?: boolean;
  showSelectCheckbox?: boolean;
}

const SortableThumbnailItem: React.FC<SortableThumbnailItemProps> = ({
  page,
  isSelected,
  onToggleSelect,
  onRotate,
  onPreview,
  enableDrag = true,
  docProxy,
  docFingerprint,
  showRotateButton = true,
  showSelectCheckbox = true,
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
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={enableDrag ? "touch-none" : ""}
    >
      <PdfThumbnail
        page={page}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        onRotate={onRotate}
        onPreview={onPreview}
        docProxy={docProxy}
        docFingerprint={docFingerprint}
        showRotateButton={showRotateButton}
        showSelectCheckbox={showSelectCheckbox}
      />
    </div>
  );
};

export interface PdfPageGridProps {
  pages: PdfPageItem[];
  selectedIds?: string[];
  onToggleSelect?: (id: string, isMulti?: boolean) => void;
  onRotatePage?: (id: string) => void;
  onReorderPages?: (newPages: PdfPageItem[]) => void;
  enableDrag?: boolean;
  docProxy?: PDFDocumentProxy | null;
  docFingerprint?: string;
  showRotateButton?: boolean;
  showSelectCheckbox?: boolean;
  className?: string;
}

export const PdfPageGrid: React.FC<PdfPageGridProps> = ({
  pages,
  selectedIds = [],
  onToggleSelect,
  onRotatePage,
  onReorderPages,
  enableDrag = true,
  docProxy,
  docFingerprint,
  showRotateButton = true,
  showSelectCheckbox = true,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const [columnCount, setColumnCount] = useState<number>(4);

  // Preview modal state
  const [previewPageNumber, setPreviewPageNumber] = useState<number | null>(null);
  const [previewRotation, setPreviewRotation] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Measure container dimensions & columns
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const width = el.clientWidth;
      setContainerHeight(el.clientHeight || 600);
      if (width < 500) {
        setColumnCount(2);
      } else if (width < 800) {
        setColumnCount(3);
      } else {
        setColumnCount(4);
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Row height estimate based on card aspect ratio ~1:1.41 + padding & margins
  const estimatedRowHeight = 280;
  const overscanRows = 2;

  const totalRows = Math.ceil(pages.length / columnCount);

  // Virtual window calculation
  const { topPadding, bottomPadding, visiblePages } = useMemo(() => {
    if (pages.length <= 16) {
      // Small page counts don't need windowing
      return {
        topPadding: 0,
        bottomPadding: 0,
        visiblePages: pages,
      };
    }

    const calculatedStartRow = Math.max(
      0,
      Math.floor(scrollTop / estimatedRowHeight) - overscanRows
    );
    const calculatedEndRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + containerHeight) / estimatedRowHeight) + overscanRows
    );

    const startIndex = calculatedStartRow * columnCount;
    const endIndex = Math.min(pages.length, calculatedEndRow * columnCount);

    const topPad = calculatedStartRow * estimatedRowHeight;
    const bottomPad = Math.max(0, (totalRows - calculatedEndRow) * estimatedRowHeight);

    return {
      topPadding: topPad,
      bottomPadding: bottomPad,
      visiblePages: pages.slice(startIndex, endIndex),
    };
  }, [pages, columnCount, scrollTop, containerHeight, totalRows, estimatedRowHeight]);

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

  const handleOpenPreview = (page: PdfPageItem) => {
    setPreviewPageNumber(page.pageNumber);
    setPreviewRotation(page.rotation);
  };

  const gridClass =
    columnCount === 2
      ? "grid-cols-2"
      : columnCount === 3
      ? "grid-cols-3"
      : "grid-cols-4";

  return (
    <>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`w-full max-h-[640px] overflow-y-auto overscroll-contain pr-1 sm:pr-2 select-none ${className}`}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pages.map((p) => p.id)}
            strategy={rectSortingStrategy}
            disabled={!enableDrag}
          >
            {/* Top Virtual Spacer */}
            {topPadding > 0 && (
              <div style={{ height: `${topPadding}px` }} aria-hidden="true" />
            )}

            {/* Rendered Visible Items */}
            <div className={`grid ${gridClass} gap-3 sm:gap-4`}>
              {visiblePages.map((page) => (
                <SortableThumbnailItem
                  key={page.id}
                  page={page}
                  isSelected={selectedIds.includes(page.id)}
                  onToggleSelect={(e) =>
                    onToggleSelect?.(page.id, e.shiftKey || e.ctrlKey || e.metaKey)
                  }
                  onRotate={
                    onRotatePage ? () => onRotatePage(page.id) : undefined
                  }
                  onPreview={handleOpenPreview}
                  enableDrag={enableDrag}
                  docProxy={docProxy}
                  docFingerprint={docFingerprint}
                  showRotateButton={showRotateButton}
                  showSelectCheckbox={showSelectCheckbox}
                />
              ))}
            </div>

            {/* Bottom Virtual Spacer */}
            {bottomPadding > 0 && (
              <div style={{ height: `${bottomPadding}px` }} aria-hidden="true" />
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* Shared Page Preview Modal */}
      {previewPageNumber !== null && (
        <PdfPagePreviewModal
          key={`${previewPageNumber}_${previewRotation}`}
          isOpen={true}
          onClose={() => setPreviewPageNumber(null)}
          docProxy={docProxy || null}
          initialPageNumber={previewPageNumber}
          totalPages={pages.length}
          initialRotation={previewRotation}
        />
      )}
    </>
  );
};
