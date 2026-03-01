// ============================================================
// App.jsx — หน้าหลักของ EClass-style Whiteboard
// ============================================================
//
// ไฟล์นี้เป็น Component หลักที่รวม "ทุกอย่าง" เข้าด้วยกัน:
//  - Canvas         → พื้นที่วาดรูป
//  - Toolbar         → แถบเครื่องมือด้านล่าง
//  - PagePanel       → แผงจัดการหน้ากระดาน (เพิ่ม/ลบ/สลับ)
//  - ModePanel       → Overlay สำหรับ Mode พิเศษ (Math/Science/Language)
//  - QR Code Panel   → QR Code ให้นักเรียนสแกนเข้าร่วม
//  - NameDialog      → [Phase 7] ป๊อปอัปตั้งชื่อผู้ใช้
//  - UserPanel       → [Phase 7] แผงรายชื่อผู้ใช้ออนไลน์
//
// State ที่จัดการ:
//  - pages[]         → รายการหน้ากระดาน (แต่ละหน้ามี strokes)
//  - tool            → เครื่องมือปัจจุบัน (pen/eraser/line/rect/circle/arrow/text/stamp/laser)
//  - color, penSize  → สีและขนาดปากกา
//  - mode            → โหมดการสอน (standard/math/science/language)
//  - undoStackRef    → สแตกสำหรับ Redo (เก็บ strokes ที่ถูก undo)
//  - username        → [Phase 7] ชื่อผู้ใช้
//  - userColor       → [Phase 7] สีประจำตัว
//  - remoteUsers     → [Phase 7] ข้อมูลผู้ใช้อื่น
//  - remoteCursors   → [Phase 7] ตำแหน่ง cursor ผู้ใช้อื่น
//  - followUserId    → [Phase 7] id ของผู้ใช้ที่กำลัง follow
//
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import PagePanel from "./components/PagePanel";
import ModePanel from "./components/ModePanel";
import NameDialog from "./components/NameDialog";
import UserPanel from "./components/UserPanel";

// ============================================================
// [1] เชื่อมต่อ Socket.IO
// ============================================================
// ใช้ IP เดียวกับที่ user เปิดเว็บ (รองรับ LAN)
// ถ้าเปิดจาก localhost → ใช้ localhost:3000
// ถ้าเปิดจาก IP อื่น   → ใช้ IP นั้น:3000
const SOCKET_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : `http://${window.location.hostname}:3000`;

const socket = io(SOCKET_URL);

// ============================================================
// [2] Helper — สร้างหน้ากระดานเปล่าใหม่
// ============================================================
// ทุกหน้ามี:
//  - id         → รหัสไม่ซ้ำ (ใช้ timestamp + random)
//  - background → สีพื้นหลัง ("white" | "black" | "grid" | "lined")
//  - strokes[]  → รายการเส้นที่วาด (pen, shape, text, stamp)
function createPage(bg = "white") {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    background: bg,
    strokes: [],
  };
}

// ============================================================
// [3] App Component หลัก
// ============================================================
function App() {

  // ──────────────────────────────────────────────────────────
  // State: หน้ากระดาน
  // ──────────────────────────────────────────────────────────
  const [pages, setPages] = useState([createPage()]);         // รายการหน้าทั้งหมด
  const [currentPageIndex, setCurrentPageIndex] = useState(0); // index หน้าที่กำลังแสดง

  // ──────────────────────────────────────────────────────────
  // State: เครื่องมือวาด
  // ──────────────────────────────────────────────────────────
  const [tool, setTool] = useState("pen");       // เครื่องมือปัจจุบัน
  const [color, setColor] = useState("#000000");  // สีที่เลือก
  const [penSize, setPenSize] = useState(2);       // ขนาดปากกา (2=S, 4=M, 8=L)

  // ──────────────────────────────────────────────────────────
  // State: โหมดการสอน + Stamp
  // ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState("standard");   // โหมด: standard/math/science/language
  const [activeStamp, setActiveStamp] = useState(null); // stamp (emoji) ที่เลือกไว้

  // ──────────────────────────────────────────────────────────
  // State: Text Input (ช่องพิมพ์ข้อความลอยบน canvas)
  // ──────────────────────────────────────────────────────────
  const [textInput, setTextInput] = useState(null); // { x, y, value } หรือ null

  // ──────────────────────────────────────────────────────────
  // State: UI ทั่วไป
  // ──────────────────────────────────────────────────────────
  const [showPagePanel, setShowPagePanel] = useState(false); // แสดงแผงจัดการหน้า?
  const [serverUrl, setServerUrl] = useState("");             // URL สำหรับ QR Code
  const [userCount, setUserCount] = useState(0);               // จำนวนผู้ใช้ออนไลน์
  const [showQR, setShowQR] = useState(false);                 // แสดง QR Code?

  // ──────────────────────────────────────────────────────────
  // State: [Phase 7] Collaboration
  // ──────────────────────────────────────────────────────────
  const [showNameDialog, setShowNameDialog] = useState(true);  // แสดงป๊อปอัปตั้งชื่อ?
  const [username, setUsername] = useState("");                  // ชื่อตัวเอง
  const [userColor, setUserColor] = useState("#3b82f6");        // สีตัวเอง
  const [remoteUsers, setRemoteUsers] = useState({});           // ข้อมูลผู้ใช้อื่น { id: { name, color, pageIndex } }
  const [remoteCursors, setRemoteCursors] = useState({});       // ตำแหน่ง cursor { id: { x, y, name, color, pageIndex } }
  const [laserPointers, setLaserPointers] = useState([]);       // laser ที่กำลังแสดง [{ id, x, y, ... }]
  const [showUserPanel, setShowUserPanel] = useState(false);    // แสดงแผงผู้ใช้?
  const [followUserId, setFollowUserId] = useState(null);       // id ของผู้ใช้ที่ follow
  const followUserIdRef = useRef(null);                          // ref สำหรับ follow (ใช้ใน callback)

  // ──────────────────────────────────────────────────────────
  // Refs
  // ──────────────────────────────────────────────────────────
  const undoStackRef = useRef({}); // { pageId: [stroke ที่ถูก undo...] } — ใช้สำหรับ Redo
  const canvasRef = useRef(null);   // อ้างอิง <canvas> element (จาก Canvas component)
  const textInputRef = useRef(null); // อ้างอิง <input> ข้อความ
  const fileInputRef = useRef(null);  // อ้างอิง <input type=file> สำหรับ Load project

  // หน้าปัจจุบัน (shortcut)
  const currentPage = pages[currentPageIndex];

  // ============================================================
  // [4] Socket.IO Listeners
  // ============================================================
  // ฟัง event จาก Server เพื่อ sync ข้อมูลแบบ real-time
  // ทำงานครั้งเดียวตอน mount (dependency = [])
  useEffect(() => {
    // ── เดิม (Phase 1-6) ──────────────────────────────────

    // รับ URL ของ server (สำหรับสร้าง QR Code)
    socket.on("server-url", (url) => setServerUrl(url));

    // รับจำนวนผู้ใช้ออนไลน์
    socket.on("user-count", (count) => setUserCount(count));

    // รับสถานะเริ่มต้น (หน้าทั้งหมด + strokes) สำหรับ client ที่เข้ามาใหม่
    socket.on("init-state", ({ pages: serverPages }) => {
      if (serverPages && serverPages.length > 0) {
        setPages(serverPages);
        setCurrentPageIndex(0);
      }
    });

    // คนอื่นวาดเส้นเสร็จ → เพิ่ม stroke เข้าหน้าที่ตรงกัน
    socket.on("stroke-complete", ({ pageId, stroke }) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
        )
      );
    });

    // คนอื่นกด Undo → ลบ stroke ที่ตรงกัน
    socket.on("undo", ({ pageId, strokeId }) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? { ...p, strokes: p.strokes.filter((s) => s.id !== strokeId) }
            : p
        )
      );
    });

    // คนอื่นกด Redo → เพิ่ม stroke กลับมา
    socket.on("redo", ({ pageId, stroke }) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
        )
      );
    });

    // คนอื่นกด Clear → ลบ strokes ของหน้านั้นทั้งหมด
    socket.on("clear-page", ({ pageId }) => {
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, strokes: [] } : p))
      );
    });

    // คนอื่นเพิ่มหน้าใหม่
    socket.on("add-page", ({ page }) => {
      setPages((prev) => [...prev, page]);
    });

    // คนอื่นลบหน้า
    socket.on("delete-page", ({ pageId }) => {
      setPages((prev) => {
        const filtered = prev.filter((p) => p.id !== pageId);
        return filtered.length > 0 ? filtered : prev;
      });
      setCurrentPageIndex((idx) => Math.min(idx, pages.length - 2));
    });

    // คนอื่นเปลี่ยนพื้นหลัง
    socket.on("change-background", ({ pageId, background }) => {
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, background } : p))
      );
    });

    // ── Phase 7: Collaboration Events ─────────────────────

    // รับรายชื่อผู้ใช้ทั้งหมดที่ออนไลน์อยู่ (ตอนเข้ามาใหม่)
    socket.on("user-list", (userMap) => {
      setRemoteUsers(userMap || {});
    });

    // ยืนยันว่า server กำหนดสีให้เราแล้ว
    socket.on("user-confirmed", ({ color: myColor }) => {
      setUserColor(myColor);
    });

    // ผู้ใช้ใหม่เข้ามา
    socket.on("user-joined", ({ id, name, color: uColor, pageIndex }) => {
      setRemoteUsers((prev) => ({
        ...prev,
        [id]: { name, color: uColor, pageIndex },
      }));
    });

    // ผู้ใช้ออกไป
    socket.on("user-left", ({ id }) => {
      setRemoteUsers((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // ลบ cursor ของผู้ใช้ที่ออกไป
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // ยกเลิก follow ถ้าคนที่ follow ออกไป
      if (followUserIdRef.current === id) {
        setFollowUserId(null);
        followUserIdRef.current = null;
      }
    });

    // ผู้ใช้อื่นเปลี่ยนหน้า → อัปเดตใน remoteUsers + Follow Mode
    socket.on("user-page-change", ({ id, pageIndex }) => {
      setRemoteUsers((prev) => ({
        ...prev,
        [id]: { ...prev[id], pageIndex },
      }));
      // Follow Mode: ถ้าเรา follow คนนี้อยู่ → สลับหน้าตาม
      if (followUserIdRef.current === id) {
        setCurrentPageIndex(pageIndex);
      }
    });

    // ผู้ใช้อื่นขยับ cursor
    socket.on("cursor-move", ({ id, x, y, pageIndex }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [id]: {
          x, y, pageIndex,
          name: prev[id]?.name || "?",
          color: prev[id]?.color || "#888",
        },
      }));
    });

    // ผู้ใช้อื่นใช้ laser pointer
    socket.on("laser", ({ id, x, y, pageIndex, name, color: lColor }) => {
      const laser = { id, x, y, pageIndex, name, color: lColor };
      setLaserPointers((prev) => {
        // เก็บ laser ล่าสุดของแต่ละ user (แทนที่ตัวเก่า)
        const filtered = prev.filter((lp) => lp.id !== id);
        return [...filtered, laser];
      });
      // ลบ laser อัตโนมัติหลัง 1.5 วินาที (fade out)
      setTimeout(() => {
        setLaserPointers((prev) => prev.filter((lp) => lp !== laser));
      }, 1500);
    });

    // ── Cleanup ───────────────────────────────────────────
    return () => {
      socket.off("server-url");
      socket.off("user-count");
      socket.off("init-state");
      socket.off("stroke-complete");
      socket.off("undo");
      socket.off("redo");
      socket.off("clear-page");
      socket.off("add-page");
      socket.off("delete-page");
      socket.off("change-background");
      // Phase 7
      socket.off("user-list");
      socket.off("user-confirmed");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("user-page-change");
      socket.off("cursor-move");
      socket.off("laser");
    };
  }, []);

  // ── อัปเดตชื่อ/สีใน remoteCursors เมื่อ remoteUsers เปลี่ยน ──
  useEffect(() => {
    setRemoteCursors((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (remoteUsers[id]) {
          next[id] = {
            ...next[id],
            name: remoteUsers[id].name,
            color: remoteUsers[id].color,
          };
        }
      }
      return next;
    });
  }, [remoteUsers]);

  // ============================================================
  // [5] Callbacks: การวาด
  // ============================================================

  /**
   * เมื่อวาด stroke เสร็จ (ปล่อยนิ้ว/เมาส์)
   * 1. เพิ่ม stroke ลงใน state ของหน้าปัจจุบัน
   * 2. ล้าง redo stack (เพราะวาดอันใหม่แล้ว redo เดิมใช้ไม่ได้)
   * 3. ส่งให้ server broadcast ไปให้คนอื่น
   */
  const handleStrokeComplete = useCallback(
    (stroke) => {
      const pageId = currentPage.id;
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
        )
      );
      undoStackRef.current[pageId] = []; // ล้าง redo stack
      socket.emit("stroke-complete", { pageId, stroke });
    },
    [currentPage?.id]
  );

  /**
   * ขณะวาด (ทุก pointermove) → ส่งข้อมูลเส้น real-time ให้คนอื่น
   * (สำหรับ pen/eraser เท่านั้น — shape ไม่ส่ง preview)
   */
  const handleDraw = useCallback(
    (data) => {
      socket.emit("draw", { ...data, pageId: currentPage.id });
    },
    [currentPage?.id]
  );

  // ============================================================
  // [6] Text Tool — ช่องพิมพ์ข้อความลอย
  // ============================================================

  /** เมื่อคลิกบน canvas ด้วย text tool → แสดงช่องพิมพ์ที่ตำแหน่งนั้น */
  const handleTextRequest = useCallback((x, y) => {
    setTextInput({ x, y, value: "" });
    setTimeout(() => textInputRef.current?.focus(), 50);
  }, []);

  /** กด Enter → สร้าง text stroke แล้วเพิ่มลง canvas */
  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
    // คำนวณขนาดฟอนต์จากขนาดปากกา (S→22, M→34, L→58)
    const fontSize = penSize * 6 + 10;
    const textStroke = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      type: "text",
      text: textInput.value,
      x: textInput.x,
      y: textInput.y,
      color,
      fontSize,
    };
    handleStrokeComplete(textStroke);
    setTextInput(null);
  }, [textInput, color, penSize, handleStrokeComplete]);

  /** จัดการ keyboard ในช่องพิมพ์: Enter = ยืนยัน, Esc = ยกเลิก */
  const handleTextKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTextSubmit();
      } else if (e.key === "Escape") {
        setTextInput(null);
      }
    },
    [handleTextSubmit]
  );

  // ============================================================
  // [7] Stamp Tool — วาง Emoji ลงบน canvas (Science Mode)
  // ============================================================

  /** เลือก stamp (กดซ้ำ = ยกเลิกเลือก) */
  const handleStampSelect = useCallback((emoji) => {
    setActiveStamp((prev) => (prev === emoji ? null : emoji));
    setTool("stamp");
  }, []);

  /** คลิกบน canvas ขณะถือ stamp → วาง emoji ที่ตำแหน่งนั้น */
  const handleCanvasClick = useCallback(
    (e) => {
      if (tool === "stamp" && activeStamp) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const stampStroke = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          type: "stamp",
          stamp: activeStamp,
          x,
          y,
          fontSize: 40,
        };
        handleStrokeComplete(stampStroke);
      }
    },
    [tool, activeStamp, handleStrokeComplete]
  );

  // ============================================================
  // [8] Mode Change — เปลี่ยนโหมดการสอน
  // ============================================================
  const handleModeChange = useCallback(
    (newMode) => {
      setMode(newMode);
      // ตั้งค่าอัตโนมัติเมื่อเปลี่ยนโหมด
      if (newMode === "language") {
        handleBackgroundChange("lined"); // เปิดกระดาษเส้น
        setTool("text");                  // สลับไปเครื่องมือพิมพ์
      }
      if (newMode === "math") {
        handleBackgroundChange("grid");  // เปิดกระดาษตาราง
      }
    },
    []
  );

  // ============================================================
  // [9] Undo / Redo / Clear
  // ============================================================

  /** Undo: ถอย 1 stroke → ย้ายไปเก็บใน redo stack */
  const handleUndo = useCallback(() => {
    const pageId = currentPage.id;
    setPages((prev) => {
      const page = prev.find((p) => p.id === pageId);
      if (!page || page.strokes.length === 0) return prev;

      const lastStroke = page.strokes[page.strokes.length - 1];

      // เก็บ stroke ที่ถูก undo ไว้ใน redo stack
      if (!undoStackRef.current[pageId]) undoStackRef.current[pageId] = [];
      undoStackRef.current[pageId].push(lastStroke);

      socket.emit("undo", { pageId, strokeId: lastStroke.id });

      return prev.map((p) =>
        p.id === pageId ? { ...p, strokes: p.strokes.slice(0, -1) } : p
      );
    });
  }, [currentPage?.id]);

  /** Redo: ดึง stroke จาก redo stack กลับมา */
  const handleRedo = useCallback(() => {
    const pageId = currentPage.id;
    const stack = undoStackRef.current[pageId];
    if (!stack || stack.length === 0) return;

    const stroke = stack.pop();
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
      )
    );
    socket.emit("redo", { pageId, stroke });
  }, [currentPage?.id]);

  /** Clear: ลบ strokes ทั้งหมดของหน้าปัจจุบัน */
  const handleClear = useCallback(() => {
    const pageId = currentPage.id;
    undoStackRef.current[pageId] = []; // ล้าง redo stack ด้วย
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, strokes: [] } : p))
    );
    socket.emit("clear-page", { pageId });
  }, [currentPage?.id]);

  // ============================================================
  // [10] เปลี่ยนพื้นหลัง
  // ============================================================
  const handleBackgroundChange = useCallback(
    (bg) => {
      const pageId = currentPage.id;
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, background: bg } : p))
      );
      socket.emit("change-background", { pageId, background: bg });
    },
    [currentPage?.id]
  );

  // ============================================================
  // [11] จัดการหน้ากระดาน
  // ============================================================

  /** เพิ่มหน้าใหม่ (ใช้พื้นหลังเดียวกับหน้าปัจจุบัน) */
  const handleAddPage = useCallback(() => {
    const newPage = createPage(currentPage?.background || "white");
    setPages((prev) => [...prev, newPage]);
    setCurrentPageIndex((prev) => prev + 1);
    socket.emit("add-page", { page: newPage });
  }, [currentPage?.background]);

  /** ลบหน้า (ห้ามลบหน้าสุดท้าย) */
  const handleDeletePage = useCallback(
    (pageId) => {
      setPages((prev) => {
        if (prev.length <= 1) return prev; // ต้องเหลืออย่างน้อย 1 หน้า
        const idx = prev.findIndex((p) => p.id === pageId);
        const filtered = prev.filter((p) => p.id !== pageId);
        // ปรับ index ให้ถูกต้องหลังลบ
        if (currentPageIndex >= filtered.length) {
          setCurrentPageIndex(filtered.length - 1);
        } else if (idx <= currentPageIndex && currentPageIndex > 0) {
          setCurrentPageIndex((i) => i - 1);
        }
        return filtered;
      });
      socket.emit("delete-page", { pageId });
    },
    [currentPageIndex]
  );

  /** ไปหน้าก่อนหน้า */
  const handlePrevPage = useCallback(() => {
    setCurrentPageIndex((i) => Math.max(0, i - 1));
  }, []);

  /** ไปหน้าถัดไป */
  const handleNextPage = useCallback(() => {
    setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1));
  }, [pages.length]);

  /** เลือกหน้าจาก PagePanel (คลิก thumbnail) */
  const handleSelectPage = useCallback((index) => {
    setCurrentPageIndex(index);
    setShowPagePanel(false); // ปิดแผงหลังเลือก
  }, []);

  // ── [Phase 7] แจ้ง server ทุกครั้งที่เปลี่ยนหน้า ──────────
  useEffect(() => {
    socket.emit("page-change", { pageIndex: currentPageIndex });
  }, [currentPageIndex]);

  // ============================================================
  // [12] Export — บันทึกหน้าปัจจุบันเป็น PNG
  // ============================================================
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // สร้าง canvas ชั่วคราว เพื่อวาดพื้นหลัง + เส้นรวมกัน
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // วาดพื้นหลังตามประเภท
    const bg = currentPage?.background || "white";
    if (bg === "black") {
      tempCtx.fillStyle = "#1a1a2e";
    } else if (bg === "lined") {
      tempCtx.fillStyle = "#fefcf3";
    } else {
      tempCtx.fillStyle = "#ffffff";
    }
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // วาดเส้นตาราง/เส้นบรรทัด ลงบนพื้นหลัง
    const dpr = window.devicePixelRatio || 1;
    if (bg === "grid") {
      tempCtx.strokeStyle = "rgba(0,0,0,0.1)";
      tempCtx.lineWidth = 1;
      const step = 30 * dpr;
      for (let x = 0; x <= tempCanvas.width; x += step) {
        tempCtx.beginPath(); tempCtx.moveTo(x, 0);
        tempCtx.lineTo(x, tempCanvas.height); tempCtx.stroke();
      }
      for (let y = 0; y <= tempCanvas.height; y += step) {
        tempCtx.beginPath(); tempCtx.moveTo(0, y);
        tempCtx.lineTo(tempCanvas.width, y); tempCtx.stroke();
      }
    } else if (bg === "lined") {
      tempCtx.strokeStyle = "rgba(59,130,246,0.12)";
      tempCtx.lineWidth = 1;
      const step = 32 * dpr;
      for (let y = step; y <= tempCanvas.height; y += step) {
        tempCtx.beginPath(); tempCtx.moveTo(0, y);
        tempCtx.lineTo(tempCanvas.width, y); tempCtx.stroke();
      }
    }

    // วาง canvas (เส้นที่วาด) ทับบนพื้นหลัง
    tempCtx.drawImage(canvas, 0, 0);

    // ดาวน์โหลดเป็นไฟล์ PNG
    const link = document.createElement("a");
    link.download = `whiteboard-page-${currentPageIndex + 1}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [currentPage?.background, currentPageIndex]);

  // ============================================================
  // [12.1] Phase 6 — Save Project (บันทึกโปรเจกต์เป็น JSON)
  // ============================================================
  // serialize ข้อมูลทุกหน้า (pages + strokes) เป็น JSON แล้วดาวน์โหลด
  const handleSaveProject = useCallback(() => {
    const projectData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      currentPageIndex,
      pages: pages.map((p) => ({
        id: p.id,
        background: p.background,
        strokes: p.strokes,
      })),
    };
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
    link.download = `whiteboard-${timestamp}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [pages, currentPageIndex]);

  // ============================================================
  // [12.2] Phase 6 — Load Project (โหลดโปรเจกต์จาก JSON)
  // ============================================================
  // อ่านไฟล์ JSON → restore ข้อมูลทุกหน้า + sync ไปยัง server
  const handleLoadProject = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);

        // ตรวจสอบว่าเป็นไฟล์ที่ถูกต้อง
        if (!data.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
          alert("ไฟล์ไม่ถูกต้อง: ไม่พบข้อมูลหน้ากระดาน");
          return;
        }

        // อัปเดต state
        setPages(data.pages);
        setCurrentPageIndex(data.currentPageIndex || 0);

        // ล้าง undo stack ทั้งหมด
        undoStackRef.current = {};

        // Sync ไปยัง server (ส่ง init ใหม่)
        socket.emit("load-project", { pages: data.pages });

      } catch (err) {
        alert("ไม่สามารถอ่านไฟล์ได้: " + err.message);
      }
    };
    reader.readAsText(file);

    // Reset input เพื่อให้เลือกไฟล์เดิมได้อีก
    e.target.value = "";
  }, []);

  // ============================================================
  // [12.3] Phase 6 — Export All Pages (ส่งออกทุกหน้าเป็น PNG)
  // ============================================================
  // วนลูปทุกหน้า → วาดพื้นหลัง + strokes ลง temp canvas → ดาวน์โหลดทีละไฟล์
  const handleExportAll = useCallback(() => {
    if (!canvasRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    // Helper: วาดพื้นหลังบน temp context
    const drawBg = (ctx, bg) => {
      if (bg === "black") ctx.fillStyle = "#1a1a2e";
      else if (bg === "lined") ctx.fillStyle = "#fefcf3";
      else ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      if (bg === "grid") {
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        const step = 30 * dpr;
        for (let x = 0; x <= w; x += step) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y <= h; y += step) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
      } else if (bg === "lined") {
        ctx.strokeStyle = "rgba(59,130,246,0.12)";
        ctx.lineWidth = 1;
        const step = 32 * dpr;
        for (let y = step; y <= h; y += step) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
      }
    };

    // Helper: วาด stroke บน temp context (เหมือน Canvas.drawStroke)
    const drawStrokeOnCtx = (ctx, stroke) => {
      ctx.save();
      ctx.scale(dpr, dpr);

      if (stroke.type === "shape") {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const { shapeType, startX, startY, endX, endY } = stroke;
        if (shapeType === "line") {
          ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        } else if (shapeType === "rect") {
          ctx.strokeRect(Math.min(startX, endX), Math.min(startY, endY), Math.abs(endX - startX), Math.abs(endY - startY));
        } else if (shapeType === "circle") {
          ctx.beginPath();
          ctx.ellipse((startX + endX) / 2, (startY + endY) / 2, Math.abs(endX - startX) / 2, Math.abs(endY - startY) / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shapeType === "arrow") {
          const angle = Math.atan2(endY - startY, endX - startX);
          const headLen = Math.max(15, stroke.size * 4);
          ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      } else if (stroke.type === "text") {
        ctx.fillStyle = stroke.color;
        ctx.font = `${stroke.fontSize || 20}px Inter, sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(stroke.text, stroke.x, stroke.y);
      } else if (stroke.type === "stamp") {
        ctx.font = `${stroke.fontSize || 40}px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(stroke.stamp, stroke.x, stroke.y);
      } else if (stroke.points && stroke.points.length >= 2) {
        if (stroke.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.strokeStyle = "rgba(0,0,0,1)";
          ctx.lineWidth = stroke.size * 5;
        } else {
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size;
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    // วนลูปทุกหน้า → render + download ทีละหน้า
    pages.forEach((page, idx) => {
      setTimeout(() => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const ctx = tempCanvas.getContext("2d");

        drawBg(ctx, page.background || "white");
        page.strokes.forEach((s) => drawStrokeOnCtx(ctx, s));

        const link = document.createElement("a");
        link.download = `whiteboard-page-${idx + 1}.png`;
        link.href = tempCanvas.toDataURL("image/png");
        link.click();
      }, idx * 300); // หน่วงเวลา 300ms ระหว่างแต่ละหน้า เพื่อไม่ให้ browser block
    });
  }, [pages]);

  // ============================================================
  // [13] Keyboard Shortcuts — คีย์ลัด
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ไม่ดักจับเมื่อกำลังพิมพ์ข้อความในช่อง text input
      if (textInput) return;
      // ไม่ดักจับเมื่อ name dialog ยังเปิดอยู่
      if (showNameDialog) return;

      if (e.ctrlKey && e.key === "z") { e.preventDefault(); handleUndo(); }
      else if (e.ctrlKey && e.key === "y") { e.preventDefault(); handleRedo(); }
      else if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleSaveProject(); } // Ctrl+S = Save
      else if (e.ctrlKey && e.key === "o") { e.preventDefault(); handleLoadProject(); } // Ctrl+O = Open
      else if (e.key === "b" || e.key === "B") { setTool("pen"); }      // B = Brush (ปากกา)
      else if (e.key === "e" || e.key === "E") { setTool("eraser"); }   // E = Eraser (ยางลบ)
      else if (e.key === "t" || e.key === "T") { setTool("text"); }     // T = Text (ข้อความ)
      else if (e.key === "l" || e.key === "L") { setTool("line"); }     // L = Line (เส้นตรง)
      else if (e.key === "r" || e.key === "R") { setTool("rect"); }     // R = Rectangle (สี่เหลี่ยม)
      else if (e.key === "c" || e.key === "C") { setTool("circle"); }   // C = Circle (วงกลม)
      else if (e.key === "p" || e.key === "P") { setTool("laser"); }    // P = Pointer (เลเซอร์)
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, textInput, showNameDialog]);

  // ============================================================
  // [14] Phase 7 — ตั้งชื่อผู้ใช้
  // ============================================================
  /** เมื่อกด "เข้าร่วม" → ส่งชื่อไป server + ซ่อน dialog */
  const handleNameSubmit = useCallback((name) => {
    setUsername(name);
    setShowNameDialog(false);
    socket.emit("set-user", { name });
  }, []);

  // ============================================================
  // [15] Phase 7 — Cursor Move → ส่งตำแหน่งไป server
  // ============================================================
  /** callback จาก Canvas: ส่งตำแหน่ง cursor ให้คนอื่นเห็น */
  const handleCursorMove = useCallback(
    (x, y) => {
      // ส่ง cursor (throttle ที่ server ทำอยู่แล้ว — ส่งตรงๆ)
      socket.emit("cursor-move", { x, y, pageIndex: currentPageIndex });

      // ถ้าเป็น laser tool → ส่ง laser event ด้วย
      if (tool === "laser") {
        socket.emit("laser", { x, y, pageIndex: currentPageIndex });
      }
    },
    [currentPageIndex, tool]
  );

  // ============================================================
  // [16] Phase 7 — Follow Mode
  // ============================================================
  /** กด follow/unfollow ผู้ใช้อื่น */
  const handleFollow = useCallback((userId) => {
    setFollowUserId((prev) => {
      const next = prev === userId ? null : userId;
      followUserIdRef.current = next;

      // ถ้าเริ่ม follow → สลับไปหน้าที่เขาดูอยู่ทันที
      if (next && remoteUsers[next]) {
        setCurrentPageIndex(remoteUsers[next].pageIndex || 0);
      }
      return next;
    });
  }, [remoteUsers]);

  // ============================================================
  // [17] Render — โครงสร้าง UI ทั้งหมด
  // ============================================================
  return (
    <div className="app" onClick={tool === "stamp" ? handleCanvasClick : undefined}>

      {/* ─── [Phase 7] Name Dialog (แสดงครั้งแรกก่อนเริ่มใช้งาน) ─── */}
      {showNameDialog && (
        <NameDialog onSubmit={handleNameSubmit} />
      )}

      {/* ─── Hidden file input สำหรับ Load Project (Phase 6) ─── */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      {/* ─── พื้นที่วาดรูป ─── */}
      <Canvas
        ref={canvasRef}
        page={currentPage}
        tool={tool}
        color={color}
        penSize={penSize}
        mode={mode}
        onStrokeComplete={handleStrokeComplete}
        onDraw={handleDraw}
        onTextRequest={handleTextRequest}
        socket={socket}
        // Phase 7 props
        onCursorMove={handleCursorMove}
        remoteCursors={remoteCursors}
        laserPointers={laserPointers}
        currentPageIndex={currentPageIndex}
      />

      {/* ─── ช่องพิมพ์ข้อความ (แสดงเมื่อคลิก text tool บน canvas) ─── */}
      {textInput && (
        <div
          className="text-input-overlay"
          style={{ left: textInput.x + "px", top: textInput.y + "px" }}
        >
          <input
            ref={textInputRef}
            type="text"
            className="text-input-field"
            value={textInput.value}
            onChange={(e) =>
              setTextInput((prev) => ({ ...prev, value: e.target.value }))
            }
            onKeyDown={handleTextKeyDown}
            onBlur={handleTextSubmit}
            placeholder="พิมพ์ข้อความ..."
            style={{ color, fontSize: (penSize * 6 + 10) + "px" }}
          />
          <span className="text-input-hint">Enter ✓ &nbsp; Esc ✕</span>
        </div>
      )}

      {/* ─── Overlay ของ Mode พิเศษ (ไม้บรรทัด, stamps, etc.) ─── */}
      <ModePanel
        mode={mode}
        activeStamp={activeStamp}
        onStampSelect={handleStampSelect}
      />

      {/* ─── แถบเครื่องมือด้านล่าง ─── */}
      <Toolbar
        tool={tool}
        color={color}
        penSize={penSize}
        background={currentPage?.background || "white"}
        mode={mode}
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        onToolChange={(t) => { setTool(t); if (t !== "stamp") setActiveStamp(null); }}
        onColorChange={setColor}
        onPenSizeChange={setPenSize}
        onBackgroundChange={handleBackgroundChange}
        onModeChange={handleModeChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onExportAll={handleExportAll}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onTogglePages={() => setShowPagePanel((v) => !v)}
        onToggleUserPanel={() => setShowUserPanel((v) => !v)}
      />

      {/* ─── แผงจัดการหน้ากระดาน (สไลด์จากซ้าย) ─── */}
      <PagePanel
        pages={pages}
        currentPageIndex={currentPageIndex}
        show={showPagePanel}
        onToggle={() => setShowPagePanel(false)}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
      />

      {/* ─── [Phase 7] แผงผู้ใช้ออนไลน์ (สไลด์จากขวา) ─── */}
      <UserPanel
        show={showUserPanel}
        onToggle={() => setShowUserPanel(false)}
        remoteUsers={remoteUsers}
        myName={username}
        myColor={userColor}
        myPageIndex={currentPageIndex}
        followUserId={followUserId}
        onFollow={handleFollow}
      />

      {/* ─── จำนวนผู้ใช้ออนไลน์ (มุมซ้ายบน) ─── */}
      <div className="user-count" title="ผู้ใช้ที่เชื่อมต่อ">
        <span className="user-dot" />
        {userCount} ออนไลน์
      </div>

      {/* ─── [Phase 7] Follow Mode Indicator (แถบด้านบน) ─── */}
      {followUserId && remoteUsers[followUserId] && (
        <div className="follow-indicator">
          <span>👁️ กำลังตามดู: {remoteUsers[followUserId].name}</span>
          <button
            className="follow-stop-btn"
            onClick={() => { setFollowUserId(null); followUserIdRef.current = null; }}
          >
            ✕ หยุด
          </button>
        </div>
      )}

      {/* ─── ปุ่มเปิด QR Code (มุมขวาบน) ─── */}
      <button
        className="qr-toggle"
        onClick={() => setShowQR((v) => !v)}
        title="แชร์ QR Code"
      >
        📱
      </button>

      {/* ─── QR Code Panel ─── */}
      {showQR && serverUrl && (
        <div className="qr-container">
          <div className="qr-header">
            <span>สแกนเพื่อเข้าร่วม</span>
            <button className="qr-close" onClick={() => setShowQR(false)}>✕</button>
          </div>
          <QRCodeSVG value={serverUrl} size={140} />
          <p className="qr-url">{serverUrl}</p>
        </div>
      )}
    </div>
  );
}

export default App;