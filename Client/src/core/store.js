import { create } from "zustand";

export const useStore = create((set) => ({
  pages: [],
  users: {},
  currentPage: 0,
  strokes: {},

  setPages: (pages) => set({ pages }),

  addPage: (page) =>
    set((state) => ({ pages: [...state.pages, page] })),

  setUsers: (users) => set({ users }),

  addStroke: (pageId, stroke) =>
    set((state) => ({
      strokes: {
        ...state.strokes,
        [pageId]: [...(state.strokes[pageId] || []), stroke],
      },
    })),
}));