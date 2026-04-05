// ============================================================
// App.jsx — หน้าหลักของ EClass-style ProEdu1
// ============================================================
//
// ไฟล์นี้เป็น Component หลักที่รวม "ทุกอย่าง" เข้าด้วยกัน:
//  - Canvas           → พื้นที่วาดรูป
//  - Toolbar          → แถบเครื่องมือด้านล่าง (EClass-style)
//  - PagePanel        → แผงจัดการหน้ากระดาน
//  - ModePanel        → Overlay สำหรับ Mode พิเศษ
//  - SideToolbar      → แถบเครื่องมือด้านซ้าย (EClass-style)
//  - FloatingPalette  → วงกลมเครื่องมือลอย (EClass-style)
//  - QR Code Panel    → QR Code แชร์
//  - NameDialog       → ป๊อปอัปตั้งชื่อผู้ใช้
//  - UserPanel        → แผงรายชื่อผู้ใช้ออนไลน์
//
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import Canvas from "./components/Canvas";
import HeaderBar from "./components/HeaderBar";
import ToolPalette from "./components/ToolPalette";
import ColorSidebar from "./components/ColorSidebar";
import PagePanel from "./components/PagePanel";
import ModePanel from "./components/ModePanel";
import NameDialog from "./components/NameDialog";
import UserPanel from "./components/UserPanel";

import PermissionButton from "./components/PermissionButton";
import PermissionPanel from "./components/PermissionPanel";
import VideoPlayerModal from "./components/VideoPlayerModal";
import WebcamWidget from "./components/WebcamWidget";

// ============================================================
// [1] เชื่อมต่อ Socket.IO
// ============================================================
const SOCKET_URL = import.meta.env.MODE === "development"
  ? `http://${window.location.hostname}:3000`
  : undefined;

const socket = io(SOCKET_URL);

// ============================================================
// [2] Helper — สร้างหน้ากระดานเปล่าใหม่
// ============================================================
function createPage(bg = "white") {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    background: bg,
    strokes: [],
  };
}

// ============================================================
// [2.1] Auto Save key สำหรับ localStorage
// ============================================================
const AUTO_SAVE_KEY = "proedu1-autosave";

// ============================================================
// [3] App Component หลัก
// ============================================================
function App() {

  // ──────────────────────────────────────────────────────────
  // State: หน้ากระดาน
  // ──────────────────────────────────────────────────────────
  const [pages, setPages] = useState(() => {
    // ลองโหลดจาก localStorage ก่อน (Auto Save)
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.pages && data.pages.length > 0) return data.pages;
      }
    } catch { /* ignore */ }
    return [createPage()];
  });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // ──────────────────────────────────────────────────────────
  // State: เครื่องมือวาด
  // ──────────────────────────────────────────────────────────
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(3);
  const [penStyle, setPenStyle] = useState("pen");

  // ──────────────────────────────────────────────────────────
  // State: เครื่องมือของ Host (สำหรับใช้กับ Split Canvas mode ให้ผู้ชมเห็นเส้น)
  // ──────────────────────────────────────────────────────────
  const [hostTool, setHostTool] = useState("pen");
  const [hostPenStyle, setHostPenStyle] = useState("pen");

  // ──────────────────────────────────────────────────────────
  // State: โหมดการสอน + Stamp
  // ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState("standard");
  const [activeStamp, setActiveStamp] = useState(null);

  // ──────────────────────────────────────────────────────────
  // State: Text Input
  // ──────────────────────────────────────────────────────────
  const [textInput, setTextInput] = useState(null);

  // ──────────────────────────────────────────────────────────
  // State: UI ทั่วไป
  // ──────────────────────────────────────────────────────────
  const [showPagePanel, setShowPagePanel] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [showToolbars, setShowToolbars] = useState(true);
  const [isOnScreen, setIsOnScreen] = useState(false);

  // ──────────────────────────────────────────────────────────
  // State: EClass features
  // ──────────────────────────────────────────────────────────
  const [autoSave, setAutoSave] = useState(() => {
    try { return localStorage.getItem("proedu1-autosave-enabled") === "true"; } catch { return false; }
  });

  // ──────────────────────────────────────────────────────────
  // State: Collaboration
  // ──────────────────────────────────────────────────────────
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [username, setUsername] = useState("");
  const [userColor, setUserColor] = useState("#3b82f6");
  const [userRole, setUserRole] = useState("viewer"); // "host" | "contributor" | "viewer"
  const [remoteUsers, setRemoteUsers] = useState({});
  const [remoteCursors, setRemoteCursors] = useState({});
  const [laserPointers, setLaserPointers] = useState([]);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [followUserId, setFollowUserId] = useState(null);
  const followUserIdRef = useRef(null);

  // ──────────────────────────────────────────────────────────
  // State: Permission System
  // ──────────────────────────────────────────────────────────
  const [hostExists, setHostExists] = useState(false);
  const [hostStatusLoaded, setHostStatusLoaded] = useState(false); // รอรับสถานะจาก server ก่อนแสดง Dialog
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState("idle"); // "idle" | "pending" | "denied"
  const [showPermissionPanel, setShowPermissionPanel] = useState(false);

  // ──────────────────────────────────────────────────────────
  // State: Screen Recording & Webcam
  // ──────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [showWebcam, setShowWebcam] = useState(false);

  const startRecording = async () => {
    try {
      // 1. ขอสิทธิ์และเปิดดึงเสียงจากไมโครโฟน
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. ดึงภาพจาก Canvas โดยตรง (30 FPS) (ใช้ภาพที่รวมพื้นหลังแล้ว)
      const canvasElement = canvasRef.current;
      if (!canvasElement) throw new Error("Canvas not found");
      const canvasStream = canvasElement.captureStreamWithBg 
          ? canvasElement.captureStreamWithBg(30) 
          : canvasElement.captureStream(30);

      // 3. จับมัดรวม (Merge) วิดีโอเส้นวาด และ เสียงพูด เข้าด้วยกัน
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
          ? 'video/webm; codecs=vp9'
          : 'video/webm';
      const recorder = new MediaRecorder(combinedStream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setShowVideoModal(true);
        setIsRecording(false);
        
        // แน่ใจว่าสั่งหยุดให้หมด ทั้งไมค์และวิดีโอ
        combinedStream.getTracks().forEach(track => track.stop());
        audioStream.getTracks().forEach(track => track.stop());
        canvasStream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting canvas record:", err);
      alert("ไม่สามารถบันทึกได้ กรุณาตรวจสอบสิทธิ์การใช้ไมโครโฟน");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDownloadVideo = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement("a");
    a.href = recordedVideoUrl;
    a.download = "proedu1-recording.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ──────────────────────────────────────────────────────────
  // Refs
  // ──────────────────────────────────────────────────────────
  const undoStackRef = useRef({});
  const canvasRef = useRef(null);
  const textInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null); // สำหรับ Insert Image

  // หน้าปัจจุบัน
  const currentPage = pages[currentPageIndex];

  // ============================================================
  // [3.1] Auto Save Effect
  // ============================================================
  useEffect(() => {
    if (!autoSave) return;
    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
        version: 1,
        pages,
        currentPageIndex,
      }));
    } catch { /* storage full — ignore */ }
  }, [autoSave, pages, currentPageIndex]);

  // ============================================================
  // [3.2] On-Screen Mode — toggle HTML class for transparent BG
  // ============================================================
  useEffect(() => {
    if (isOnScreen) {
      document.documentElement.classList.add("on-screen-mode");
    } else {
      document.documentElement.classList.remove("on-screen-mode");
    }

    // เมื่อ on-screen mode: ให้ toolbar reclickable ด้วย mouseenter/mouseleave
    if (!isOnScreen || !window.electronAPI?.isElectron) return;

    const enableMouse = () => window.electronAPI.setIgnoreMouse(false);
    const disableMouse = () => window.electronAPI.setIgnoreMouse(true);

    // เลือก UI elements ที่ต้องการให้คลิกได้
    const selectors = [".header-bar", ".tool-palette", ".color-sidebar", ".canvas-bg", ".mode-panel", ".page-panel", ".user-panel", ".qr-container", ".permission-panel"];
    const elements = [];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener("mouseenter", enableMouse);
        el.addEventListener("mouseleave", disableMouse);
        elements.push(el);
      });
    });

    return () => {
      elements.forEach(el => {
        el.removeEventListener("mouseenter", enableMouse);
        el.removeEventListener("mouseleave", disableMouse);
      });
    };
  }, [isOnScreen]);

  // ============================================================
  // [4] Socket.IO Listeners
  // ============================================================
  useEffect(() => {
    socket.on("server-url", (url) => setServerUrl(url));
    socket.on("user-count", (count) => setUserCount(count));
    socket.on("init-state", ({ pages: serverPages, hostTool: hT, hostPenStyle: hPS }) => {
      if (hT) setHostTool(hT);
      if (hPS) setHostPenStyle(hPS);

      // เมื่อเชื่อมต่อครั้งแรก ให้ใช้ข้อมูลจาก Server เป็นหลัก (เดี๋ยวให้ Host ดึง auto-save ในภายหลัง)

      // นอกนั้นให้ใช้ข้อมูลจาก server ตามปกติ
      if (serverPages && serverPages.length > 0) {
        setPages(serverPages);
        setCurrentPageIndex(0);
      }
    });

    socket.on("stroke-complete", ({ pageId, stroke }) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
        )
      );
    });

    socket.on("undo", ({ pageId, strokeId }) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId
            ? { ...p, strokes: p.strokes.filter((s) => s.id !== strokeId) }
            : p
        )
      );
    });

    socket.on("redo", ({ pageId, stroke }) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
        )
      );
    });

    socket.on("clear-page", ({ pageId }) => {
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, strokes: [] } : p))
      );
    });

    socket.on("add-page", ({ page }) => {
      setPages((prev) => [...prev, page]);
    });

    socket.on("delete-page", ({ pageId }) => {
      setPages((prev) => {
        const filtered = prev.filter((p) => p.id !== pageId);
        return filtered.length > 0 ? filtered : prev;
      });
      setCurrentPageIndex((idx) => Math.min(idx, pages.length - 2));
    });

    socket.on("reorder-pages", ({ pages: newPages }) => {
      setPages(newPages);
    });

    socket.on("change-background", ({ pageId, background }) => {
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, background } : p))
      );
    });

    // Collaboration
    socket.on("user-list", (userMap) => setRemoteUsers(userMap || {}));
    socket.on("user-confirmed", ({ color: myColor, role: myRole }) => {
      setUserColor(myColor);
      if (myRole) {
        setUserRole(myRole);

        // ถ้าได้เป็น Host และหน้ากระดานปัจจุบันยังว่างเปล่า ให้คืนค่าจาก auto-save
        if (myRole === "host") {
          setPages((currentPages) => {
            if (currentPages?.length === 1 && currentPages[0].strokes?.length === 0) {
              try {
                const saved = localStorage.getItem(AUTO_SAVE_KEY);
                if (saved) {
                  const data = JSON.parse(saved);
                  if (data.pages && data.pages.length > 0) {
                    setTimeout(() => {
                      setCurrentPageIndex(data.currentPageIndex || 0);
                      socket.emit("load-project", { pages: data.pages });
                    }, 0);
                    return data.pages;
                  }
                }
              } catch { /* ignore */ }
            }
            return currentPages;
          });
        }
      }
    });

    socket.on("user-joined", ({ id, name, color: uColor, pageIndex }) => {
      setRemoteUsers((prev) => ({
        ...prev,
        [id]: { name, color: uColor, pageIndex },
      }));
    });

    socket.on("user-left", ({ id }) => {
      setRemoteUsers((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (followUserIdRef.current === id) {
        setFollowUserId(null);
        followUserIdRef.current = null;
      }
    });

    socket.on("user-page-change", ({ id, pageIndex }) => {
      setRemoteUsers((prev) => ({
        ...prev,
        [id]: { ...prev[id], pageIndex },
      }));
      if (followUserIdRef.current === id) {
        setCurrentPageIndex(pageIndex);
      }
    });

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

    socket.on("laser", ({ id, x, y, pageIndex, name, color: lColor }) => {
      const laser = { id, x, y, pageIndex, name, color: lColor };
      setLaserPointers((prev) => {
        const filtered = prev.filter((lp) => lp.id !== id);
        return [...filtered, laser];
      });
      setTimeout(() => {
        setLaserPointers((prev) => prev.filter((lp) => lp !== laser));
      }, 1500);
    });

    socket.on("host-tool-update", ({ tool: hT, penStyle: hPS }) => {
      setHostTool(hT);
      setHostPenStyle(hPS);
    });

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
      socket.off("reorder-pages");
      socket.off("change-background");
      socket.off("user-list");
      socket.off("user-confirmed");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("user-page-change");
      socket.off("cursor-move");
      socket.off("laser");
      socket.off("host-tool-update");
    };
  }, []);

  // ============================================================
  // [4.1] Permission Socket Listeners
  // ============================================================
  useEffect(() => {
    // รับสถานะ host มีหรือยัง
    socket.on("host-exists", (exists) => {
      setHostExists(exists);
      setHostStatusLoaded(true);
    });

    // [ครู] รับคำขอสิทธิ์จากนักเรียน
    socket.on("permission-request", ({ id, name, color }) => {
      setPendingRequests((prev) => {
        if (prev.find((r) => r.id === id)) return prev;
        return [...prev, { id, name, color }];
      });
      // เปิด panel อัตโนมัติเมื่อมีคำขอใหม่
      setShowPermissionPanel(true);
    });

    // [นักเรียน] role เปลี่ยนแล้ว (อนุมัติ/ถอนสิทธิ์)
    socket.on("role-changed", ({ role }) => {
      setUserRole(role);
      if (role === "contributor") {
        setRequestStatus("idle");
      } else if (role === "viewer") {
        setRequestStatus("idle");
      }
    });

    // [นักเรียน] คำขอถูกปฏิเสธ
    socket.on("request-denied", () => {
      setRequestStatus("denied");
    });

    // [ทุกคน] role update ของคนอื่น
    socket.on("user-role-updated", ({ id, role }) => {
      setRemoteUsers((prev) => ({
        ...prev,
        [id]: { ...prev[id], role },
      }));
      // ลบออกจาก pending ถ้าได้รับอนุมัติ
      if (role === "contributor") {
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      }
    });

    return () => {
      socket.off("host-exists");
      socket.off("permission-request");
      socket.off("role-changed");
      socket.off("request-denied");
      socket.off("user-role-updated");
    };
  }, []);

  // อัปเดตชื่อ/สีใน remoteCursors
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
  // [4.2] Broadcast Host Tool Update
  // ============================================================
  useEffect(() => {
    if (userRole === "host") {
      socket.emit("host-tool-update", { tool, penStyle });
      setHostTool(tool);
      setHostPenStyle(penStyle);
    }
  }, [tool, penStyle, userRole]);

  // ============================================================
  // [5] Callbacks: การวาด
  // ============================================================
  const handleStrokeComplete = useCallback(
    (stroke) => {
      const pageId = currentPage.id;
      setPages((prev) =>
        prev.map((p) =>
          p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
        )
      );
      undoStackRef.current[pageId] = [];
      socket.emit("stroke-complete", { pageId, stroke });
    },
    [currentPage?.id]
  );

  const handleDraw = useCallback(
    (data) => {
      socket.emit("draw", { ...data, pageId: currentPage.id });
    },
    [currentPage?.id]
  );

  // ============================================================
  // [5.0] Track Last Remote Draw for Focus Mode
  // ============================================================
  const lastDrawRef = useRef(null);
  useEffect(() => {
    const handleRemoteDraw = (data) => {
      if (data.pageId === currentPage?.id) {
        lastDrawRef.current = { x: data.x, y: data.y };
      }
    };
    socket.on("draw", handleRemoteDraw);
    return () => socket.off("draw", handleRemoteDraw);
  }, [currentPage?.id]);

  // ============================================================
  // [5.1] Select Tool — ย้าย stroke
  // ============================================================
  const handleStrokeUpdate = useCallback(
    (strokeId, dx, dy) => {
      setPages((prev) =>
        prev.map((p) => {
          if (p.id !== currentPage?.id) return p;
          return {
            ...p,
            strokes: p.strokes.map((s) => {
              if (s.id !== strokeId) return s;

              // ย้ายตามประเภท stroke
              if (s.points) {
                return {
                  ...s,
                  points: s.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
                };
              }
              if (s.type === "shape") {
                return {
                  ...s,
                  startX: s.startX + dx, startY: s.startY + dy,
                  endX: s.endX + dx, endY: s.endY + dy,
                };
              }
              if (s.type === "text" || s.type === "stamp" || s.type === "image") {
                return { ...s, x: s.x + dx, y: s.y + dy };
              }
              return s;
            }),
          };
        })
      );
    },
    [currentPage?.id]
  );

  // ============================================================
  // [5.2] Select Tool — ย่อ/ขยาย stroke (image, shape)
  // ============================================================
  const handleStrokeResize = useCallback(
    (strokeId, newBounds) => {
      setPages((prev) =>
        prev.map((p) => {
          if (p.id !== currentPage?.id) return p;
          return {
            ...p,
            strokes: p.strokes.map((s) => {
              if (s.id !== strokeId) return s;

              if (s.type === "image") {
                return {
                  ...s,
                  x: newBounds.x,
                  y: newBounds.y,
                  width: newBounds.width,
                  height: newBounds.height,
                };
              }
              if (s.type === "shape") {
                return {
                  ...s,
                  startX: newBounds.x,
                  startY: newBounds.y,
                  endX: newBounds.x + newBounds.width,
                  endY: newBounds.y + newBounds.height,
                };
              }
              return s;
            }),
          };
        })
      );
    },
    [currentPage?.id]
  );

  // ============================================================
  // [6] Text Tool
  // ============================================================
  const handleTextRequest = useCallback((x, y) => {
    setTextInput({ x, y, value: "" });
    setTimeout(() => textInputRef.current?.focus(), 50);
  }, []);

  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
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
  // [7] Stamp Tool
  // ============================================================
  const handleStampSelect = useCallback((emoji) => {
    setActiveStamp((prev) => (prev === emoji ? null : emoji));
    setTool("stamp");
  }, []);

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
  // [8] Mode Change
  // ============================================================
  const handleModeChange = useCallback(
    (newMode) => {
      setMode(newMode);
      if (newMode === "language") {
        handleBackgroundChange("lined");
        setTool("text");
      }
      if (newMode === "math") {
        handleBackgroundChange("grid");
      }
    },
    []
  );

  // ============================================================
  // [9] Undo / Redo / Clear
  // ============================================================
  const handleUndo = useCallback(() => {
    const pageId = currentPage.id;
    setPages((prev) => {
      const page = prev.find((p) => p.id === pageId);
      if (!page || page.strokes.length === 0) return prev;
      const lastStroke = page.strokes[page.strokes.length - 1];
      if (!undoStackRef.current[pageId]) undoStackRef.current[pageId] = [];
      undoStackRef.current[pageId].push(lastStroke);
      socket.emit("undo", { pageId, strokeId: lastStroke.id });
      return prev.map((p) =>
        p.id === pageId ? { ...p, strokes: p.strokes.slice(0, -1) } : p
      );
    });
  }, [currentPage?.id]);

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

  const handleClear = useCallback(() => {
    const pageId = currentPage.id;
    undoStackRef.current[pageId] = [];
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
  const handleAddPage = useCallback(() => {
    const newPage = createPage(currentPage?.background || "white");
    setPages((prev) => [...prev, newPage]);
    setCurrentPageIndex((prev) => prev + 1);
    socket.emit("add-page", { page: newPage });
  }, [currentPage?.background]);

  const handleDeletePage = useCallback(
    (pageId) => {
      setPages((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.findIndex((p) => p.id === pageId);
        const filtered = prev.filter((p) => p.id !== pageId);
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

  const handlePrevPage = useCallback(() => {
    setCurrentPageIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1));
  }, [pages.length]);

  const handleSelectPage = useCallback((index) => {
    setCurrentPageIndex(index);
    setShowPagePanel(false);
  }, []);

  const handleReorderPages = useCallback((fromIndex, toIndex) => {
    setPages((prev) => {
      const newPages = [...prev];
      const [movedItem] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedItem);

      socket.emit("reorder-pages", { pages: newPages });
      return newPages;
    });

    // Update currentPageIndex so user stays on the same physical page
    setCurrentPageIndex((prevIndex) => {
      let idx = prevIndex;
      if (fromIndex === prevIndex) idx = toIndex;
      else if (fromIndex < prevIndex && toIndex >= prevIndex) idx--;
      else if (fromIndex > prevIndex && toIndex <= prevIndex) idx++;
      return idx;
    });
  }, []);

  useEffect(() => {
    socket.emit("page-change", { pageIndex: currentPageIndex });
  }, [currentPageIndex]);

  // ============================================================
  // [11.1] EClass: New Board — สร้างกระดานใหม่ทั้งหมด
  // ============================================================
  const handleNewBoard = useCallback(() => {
    if (!confirm("สร้างกระดานใหม่? ข้อมูลปัจจุบันจะถูกลบ")) return;
    const newPage = createPage();
    setPages([newPage]);
    setCurrentPageIndex(0);
    undoStackRef.current = {};
    socket.emit("load-project", { pages: [newPage] });
    // ล้าง Auto Save
    try { localStorage.removeItem(AUTO_SAVE_KEY); } catch { /* ignore */ }
  }, []);

  // ============================================================
  // [11.2] EClass: Insert Image
  // ============================================================
  const handleInsertImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageSelected = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const origDataURL = evt.target.result;
      const img = new Image();
      img.onload = () => {
        // จำกัดขนาดสูงสุด 400px
        let w = img.width;
        let h = img.height;
        const maxSize = 400;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        // สร้าง canvas ชั่วคราวเพื่อย่อขนาดข้อมูลเบส 64
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        
        // ถ้าต้องการให้รองรับภาพ PNG โปร่งใส สามารถเปลี่ยนเป็น image/png แต่ไฟล์จะใหญ่กว่า
        // ตรงนี้ใช้ image/png เพื่อความชัวร์เรื่องพื้นหลังโปร่งใส (เพราะอาจมีคนอัปโหลดไอคอน PNG มา)
        tempCtx.drawImage(img, 0, 0, w, h);
        const compressedDataURL = tempCanvas.toDataURL("image/png");

        const imageStroke = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          type: "image",
          dataURL: compressedDataURL,
          x: 100,
          y: 100,
          width: w,
          height: h,
        };
        handleStrokeComplete(imageStroke);
      };
      img.src = origDataURL;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [handleStrokeComplete]);

  // ============================================================
  // [11.3] EClass: Toggle Auto Save
  // ============================================================
  const handleToggleAutoSave = useCallback(() => {
    setAutoSave((prev) => {
      const next = !prev;
      try { localStorage.setItem("proedu1-autosave-enabled", String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ============================================================
  // [12] Export
  // ============================================================
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    const bg = currentPage?.background || "white";
    if (bg === "black") tempCtx.fillStyle = "#1a1a2e";
    else if (bg === "lined") tempCtx.fillStyle = "#fefcf3";
    else tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

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

    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `proedu1-page-${currentPageIndex + 1}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [currentPage?.background, currentPageIndex]);

  // ============================================================
  // [12.1] Save Project
  // ============================================================
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
    link.download = `proedu1-${timestamp}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [pages, currentPageIndex]);

  // ============================================================
  // [12.2] Load Project
  // ============================================================
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
        if (!data.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
          alert("ไฟล์ไม่ถูกต้อง: ไม่พบข้อมูลหน้ากระดาน");
          return;
        }
        setPages(data.pages);
        setCurrentPageIndex(data.currentPageIndex || 0);
        undoStackRef.current = {};
        socket.emit("load-project", { pages: data.pages });
      } catch (err) {
        alert("ไม่สามารถอ่านไฟล์ได้: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // ============================================================
  // [12.3] Export All Pages
  // ============================================================
  const handleExportAll = useCallback(() => {
    if (!canvasRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

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
        } else if (stroke.tool === "highlighter") {
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = stroke.color;
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = stroke.size * 6;
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

    pages.forEach((page, idx) => {
      setTimeout(() => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const ctx = tempCanvas.getContext("2d");

        drawBg(ctx, page.background || "white");
        page.strokes.forEach((s) => drawStrokeOnCtx(ctx, s));

        const link = document.createElement("a");
        link.download = `proedu1-page-${idx + 1}.png`;
        link.href = tempCanvas.toDataURL("image/png");
        link.click();
      }, idx * 300);
    });
  }, [pages]);

  // ============================================================
  // [12.4] EClass: Screenshot (เหมือน Export หน้าปัจจุบัน)
  // ============================================================
  const handleScreenshot = useCallback(() => {
    handleExport();
  }, [handleExport]);

  // ============================================================
  // [13] Keyboard Shortcuts
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (textInput) return;
      if (showNameDialog) return;

      if (e.ctrlKey && e.key === "z") { e.preventDefault(); handleUndo(); }
      else if (e.ctrlKey && e.key === "y") { e.preventDefault(); handleRedo(); }
      else if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleSaveProject(); }
      else if (e.ctrlKey && e.key === "o") { e.preventDefault(); handleLoadProject(); }
      else if (e.key === "b" || e.key === "B") { setTool("pen"); }
      else if (e.key === "h" || e.key === "H") { setTool("highlighter"); }  // ใหม่: H = Highlighter
      else if (e.key === "e" || e.key === "E") { setTool("eraser"); }
      else if (e.key === "t" || e.key === "T") { setTool("text"); }
      else if (e.key === "l" || e.key === "L") { setTool("line"); }
      else if (e.key === "r" || e.key === "R") { setTool("rect"); }
      else if (e.key === "c" || e.key === "C") { setTool("circle"); }
      else if (e.key === "p" || e.key === "P") { setTool("laser"); }
      else if (e.key === "v" || e.key === "V") { setTool("select"); }  // ใหม่: V = Select
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, textInput, showNameDialog]);

  // ============================================================
  // [14] ตั้งชื่อผู้ใช้
  // ============================================================
  const handleNameSubmit = useCallback((name, role) => {
    setUsername(name);
    setUserRole(role || "viewer");
    setShowNameDialog(false);
    socket.emit("set-user", { name, role: role || "viewer" });
  }, []);

  // ============================================================
  // [14.1] Permission Handlers
  // ============================================================
  const handleRequestWrite = useCallback(() => {
    setRequestStatus("pending");
    socket.emit("request-write");
  }, []);

  const handleApproveRequest = useCallback((studentId) => {
    socket.emit("approve-request", { studentId });
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
  }, []);

  const handleDenyRequest = useCallback((studentId) => {
    socket.emit("deny-request", { studentId });
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
  }, []);

    const handleRevokePermission = useCallback((studentId) => {
    socket.emit("revoke-permission", { studentId });
  }, []);

  const handleGrantPermission = useCallback((studentId) => {
    socket.emit("grant-permission", { studentId });
    setPendingRequests((prev) => prev.filter((r) => r.id !== studentId));
  }, []);

  // ============================================================
  // [15] Cursor Move
  // ============================================================
  const handleCursorMove = useCallback(
    (x, y) => {
      socket.emit("cursor-move", { x, y, pageIndex: currentPageIndex });
      if (tool === "laser") {
        socket.emit("laser", { x, y, pageIndex: currentPageIndex });
      }
    },
    [currentPageIndex, tool]
  );

  // ============================================================
  // [16] Follow Mode
  // ============================================================
  const handleFollow = useCallback((userId) => {
    setFollowUserId((prev) => {
      const next = prev === userId ? null : userId;
      followUserIdRef.current = next;
      if (next && remoteUsers[next]) {
        setCurrentPageIndex(remoteUsers[next].pageIndex || 0);
      }
      return next;
    });
  }, [remoteUsers]);

  // ============================================================
  // [17] Render
  // ============================================================
  return (
    <div className={`app${isOnScreen ? " on-screen" : ""}`} onClick={tool === "stamp" ? handleCanvasClick : undefined}>

      {/* Name Dialog */}
      {showNameDialog && hostStatusLoaded && (
        <NameDialog onSubmit={handleNameSubmit} hostExists={hostExists} />
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageSelected}
      />

      {/* Canvas */}
      <Canvas
        ref={canvasRef}
        page={currentPage}
        tool={tool}
        color={color}
        penSize={penSize}
        penStyle={penStyle}
        mode={mode}
        hostTool={hostTool}
        hostPenStyle={hostPenStyle}
        onStrokeComplete={handleStrokeComplete}
        onDraw={handleDraw}
        onTextRequest={handleTextRequest}
        socket={socket}
        onCursorMove={handleCursorMove}
        remoteCursors={remoteCursors}
        laserPointers={laserPointers}
        currentPageIndex={currentPageIndex}
        onStrokeUpdate={handleStrokeUpdate}
        onStrokeResize={handleStrokeResize}
        userRole={userRole}
      />

      {/* Text Input Overlay */}
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

      {/* ═══════════════════════════════════════════════════ */}
      {/* NEW LAYOUT: HeaderBar + ToolPalette + ColorSidebar */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* Header Bar — always visible */}
      <HeaderBar
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onTogglePages={() => setShowPagePanel((v) => !v)}
        onNewBoard={handleNewBoard}
        onLoadProject={handleLoadProject}
        onSaveProject={handleSaveProject}
        onExport={handleExport}
        onExportAll={handleExportAll}
        autoSave={autoSave}
        onToggleAutoSave={handleToggleAutoSave}
        onInsertImage={handleInsertImage}
        mode={mode}
        onModeChange={handleModeChange}
        userCount={userCount}
        onToggleUserPanel={() => setShowUserPanel((v) => !v)}
        showQR={showQR}
        onToggleQR={() => setShowQR((v) => !v)}
        isRecording={isRecording}
        onStartRecord={startRecording}
        onStopRecord={stopRecording}
        showWebcam={showWebcam}
        onToggleWebcam={() => setShowWebcam((v) => !v)}
        userRole={userRole}
        pendingRequests={pendingRequests.length}
        onTogglePermissionPanel={() => setShowPermissionPanel((v) => !v)}
        onToggleOnScreen={(val) => setIsOnScreen(val)}
      />

      {/* Tool Palette — host/contributor only */}
      {userRole !== "viewer" && showToolbars && (
        <ToolPalette
          tool={tool}
          color={color}
          penSize={penSize}
          penStyle={penStyle}
          onToolChange={(t) => { setTool(t); if (t !== "stamp") setActiveStamp(null); }}
          onPenStyleChange={setPenStyle}
          onPenSizeChange={setPenSize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onInsertImage={handleInsertImage}
          userRole={userRole}
        />
      )}

      {/* Color Sidebar — host/contributor only */}
      {userRole !== "viewer" && showToolbars && (
        <ColorSidebar
          color={color}
          onColorChange={setColor}
          penSize={penSize}
          onPenSizeChange={setPenSize}
          background={currentPage?.background || "white"}
          onBackgroundChange={handleBackgroundChange}
          userRole={userRole}
        />
      )}

      {/* Mode Panel — host only */}
      {userRole === "host" && (
        <ModePanel
          mode={mode}
          activeStamp={activeStamp}
          onStampSelect={handleStampSelect}
        />
      )}

      {/* Page Panel */}
      <PagePanel
        pages={pages}
        currentPageIndex={currentPageIndex}
        show={showPagePanel}
        onToggle={() => setShowPagePanel(false)}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onReorderPages={handleReorderPages}
      />

      {/* User Panel */}
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

      {/* Follow Indicator */}
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

      {/* Focus Drawer Button — visible only for clients (not host) */}
      {userCount > 1 && userRole !== "host" && (
        <button
          className="focus-drawer-btn"
          onClick={() => {
            if (lastDrawRef.current && canvasRef.current?.focusOnPoint) {
              canvasRef.current.focusOnPoint(lastDrawRef.current.x, lastDrawRef.current.y);
            } else {
              const cursors = Object.values(remoteCursors).filter(c => c.pageIndex === currentPageIndex);
              if (cursors.length > 0 && canvasRef.current?.focusOnPoint) {
                canvasRef.current.focusOnPoint(cursors[0].x, cursors[0].y);
              }
            }
          }}
          title="ไปที่จุดที่มีคนกำลังเขียน"
        >
          🎯 โฟกัส
        </button>
      )}

      {/* Viewer Mode Indicator + Permission Button */}
      {userRole === "viewer" && (
        <>
          <div className="viewer-mode-indicator">
            <span>👁️ โหมดดูอย่างเดียว (View Only)</span>
          </div>
          <PermissionButton
            requestStatus={requestStatus}
            onRequestWrite={handleRequestWrite}
          />
        </>
      )}

      {/* Permission Panel for Host */}
      {userRole === "host" && (
        <PermissionPanel
          show={showPermissionPanel}
          onToggle={() => setShowPermissionPanel(false)}
          pendingRequests={pendingRequests}
          contributors={Object.entries(remoteUsers)
            .filter(([, u]) => u.role === "contributor")
            .map(([id, u]) => ({ id, ...u }))}
          viewers={Object.entries(remoteUsers)
            .filter(([, u]) => u.role === "viewer")
            .map(([id, u]) => ({ id, ...u }))}
          onApprove={handleApproveRequest}
          onDeny={handleDenyRequest}
          onRevoke={handleRevokePermission}
          onGrant={handleGrantPermission}
        />
      )}

      {/* QR Code Panel */}
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

      {/* Video Player Modal */}
      {showVideoModal && (
        <VideoPlayerModal
          videoUrl={recordedVideoUrl}
          onClose={() => setShowVideoModal(false)}
          onDownload={handleDownloadVideo}
        />
      )}

      {/* Webcam Widget */}
      {showWebcam && <WebcamWidget />}

      {/* ═══════════════════════════════════════════════════ */}
      {/* Toggle Toolbars Button */}
      {/* ═══════════════════════════════════════════════════ */}
      {userRole !== "viewer" && (
        <button
          className="toggle-toolbars-btn"
          onClick={() => setShowToolbars((v) => !v)}
          title={showToolbars ? "ซ่อนเครื่องมือ" : "แสดงเครื่องมือ"}
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "6px",
            backgroundColor: showToolbars ? "rgba(100, 116, 139, 0.4)" : "#3b82f6",
            color: "white",
            border: "none",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {showToolbars ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6M18 9l-6-6-6 6" />
              </svg>
              ซ่อนเครื่องมือ
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6M6 15l6-6 6 6" />
              </svg>
              แสดงเครื่องมือ
            </>
          )}
        </button>
      )}

    </div>
  );
}

export default App;