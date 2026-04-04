// ============================================================
// usePages.js — Hook จัดการหน้ากระดาน
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { pageService } from "./pageService";

export function usePages({ isActive, userRole }) {
  const [pages, setPages] = useState([
    { id: "page-1", background: "white", strokes: [] },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPage = pages[currentPageIndex] || pages[0];

  // ── Socket listeners ──
  useEffect(() => {
    if (!isActive) return;

    const handleAddPage = ({ page }) => {
      setPages(prev => [...prev, page]);
    };
    const handleDeletePage = ({ pageId }) => {
      setPages(prev => {
        const newPages = prev.filter(p => p.id !== pageId);
        return newPages.length > 0 ? newPages : prev;
      });
      setCurrentPageIndex(prev => Math.min(prev, pages.length - 2));
    };
    const handleReorderPages = ({ pages: newPages }) => {
      setPages(newPages);
    };
    const handleChangeBackground = ({ pageId, background }) => {
      setPages(prev => prev.map(p =>
        p.id === pageId ? { ...p, background } : p
      ));
    };
    const handleHostChangePage = ({ pageIndex }) => {
      setCurrentPageIndex(pageIndex);
    };

    pageService.onAddPage(handleAddPage);
    pageService.onDeletePage(handleDeletePage);
    pageService.onReorderPages(handleReorderPages);
    pageService.onChangeBackground(handleChangeBackground);
    pageService.onHostChangePage(handleHostChangePage);

    return () => {
      pageService.offAddPage(handleAddPage);
      pageService.offDeletePage(handleDeletePage);
      pageService.offReorderPages(handleReorderPages);
      pageService.offChangeBackground(handleChangeBackground);
      pageService.offHostChangePage(handleHostChangePage);
    };
  }, [isActive, pages.length]);

  // ── Handlers ──
  const handleAddPage = () => {
    const newPage = { id: `page-${Date.now()}`, background: "white", strokes: [] };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
    pageService.emitAddPage(newPage);
  };

  const handleDeletePage = (pageId) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter(p => p.id !== pageId));
    setCurrentPageIndex(prev => Math.min(prev, pages.length - 2));
    pageService.emitDeletePage(pageId);
  };

  const handleSelectPage = useCallback((index) => {
    setCurrentPageIndex(index);
    pageService.emitChangePage(index);
    if (userRole === "host") {
      pageService.emitHostChangePage(index);
    }
  }, [userRole]);

  const handlePrevPage = () => {
    if (currentPageIndex > 0) handleSelectPage(currentPageIndex - 1);
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) handleSelectPage(currentPageIndex + 1);
  };

  const handleReorderPages = (fromIndex, toIndex) => {
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    setPages(newPages);
    pageService.emitReorderPages(newPages);
  };

  const handleBackgroundChange = (bg) => {
    const pageId = currentPage.id;
    setPages(prev => prev.map(p =>
      p.id === pageId ? { ...p, background: bg } : p
    ));
    pageService.emitChangeBackground(pageId, bg);
  };

  return {
    pages, setPages, currentPageIndex, setCurrentPageIndex, currentPage,
    handleAddPage, handleDeletePage, handleSelectPage,
    handlePrevPage, handleNextPage,
    handleReorderPages, handleBackgroundChange,
  };
}
