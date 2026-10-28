import { create } from 'zustand';
import type { PdfPageItem } from '../types/pdf';

interface EditorState {
  pages: PdfPageItem[];
  history: PdfPageItem[][];
  historyIndex: number;
  selectedIds: string[];

  // Actions
  setPages: (pages: PdfPageItem[]) => void;
  reorderPages: (newPages: PdfPageItem[]) => void;
  toggleSelectPage: (id: string, isMulti?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  rotateSelected: (delta: 90 | 180 | 270) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  pages: [],
  history: [],
  historyIndex: -1,
  selectedIds: [],

  setPages: (pages) => {
    set({
      pages,
      history: [pages],
      historyIndex: 0,
      selectedIds: [],
    });
  },

  reorderPages: (newPages) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPages);
    set({
      pages: newPages,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  toggleSelectPage: (id, isMulti = false) => {
    const { selectedIds } = get();
    if (isMulti) {
      if (selectedIds.includes(id)) {
        set({ selectedIds: selectedIds.filter((item) => item !== id) });
      } else {
        set({ selectedIds: [...selectedIds, id] });
      }
    } else {
      set({ selectedIds: selectedIds.includes(id) && selectedIds.length === 1 ? [] : [id] });
    }
  },

  selectAll: () => {
    const { pages } = get();
    set({ selectedIds: pages.map((p) => p.id) });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  rotateSelected: (delta) => {
    const { pages, selectedIds, history, historyIndex } = get();
    if (selectedIds.length === 0) return;

    const newPages = pages.map((p) => {
      if (selectedIds.includes(p.id)) {
        return {
          ...p,
          rotation: ((p.rotation + delta) % 360 + 360) % 360,
        };
      }
      return p;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPages);
    set({
      pages: newPages,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  deleteSelected: () => {
    const { pages, selectedIds, history, historyIndex } = get();
    if (selectedIds.length === 0 || pages.length <= 1) return;

    const newPages = pages.filter((p) => !selectedIds.includes(p.id));
    if (newPages.length === 0) return; // Prevent deleting every page

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPages);
    set({
      pages: newPages,
      selectedIds: [],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  duplicateSelected: () => {
    const { pages, selectedIds, history, historyIndex } = get();
    if (selectedIds.length === 0) return;

    const newPages: PdfPageItem[] = [];
    for (const p of pages) {
      newPages.push(p);
      if (selectedIds.includes(p.id)) {
        newPages.push({
          ...p,
          id: `${p.id}_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          selected: false,
        });
      }
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPages);
    set({
      pages: newPages,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      set({
        pages: history[prevIndex],
        historyIndex: prevIndex,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      set({
        pages: history[nextIndex],
        historyIndex: nextIndex,
      });
    }
  },

  reset: () => {
    set({
      pages: [],
      history: [],
      historyIndex: -1,
      selectedIds: [],
    });
  },
}));
