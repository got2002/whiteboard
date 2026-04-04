import { useStore } from "../../core/store";
import { addPage } from "./pageService";

export default function PageManager() {
  const pages = useStore((s) => s.pages);

  return (
    <div>
      <button
        onClick={() =>
          addPage({
            id: `page-${Date.now()}`,
            background: "white",
            strokes: [],
          })
        }
      >
        Add Page
      </button>

      <div>Pages: {pages.length}</div>
    </div>
  );
}