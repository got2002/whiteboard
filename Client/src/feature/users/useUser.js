// ============================================================
// useUser.js — Hook ระบบผู้ใช้ (login, role, host check)
// ============================================================
// แก้ไข: รอ server ยืนยัน role ก่อนปิด NameDialog
//        + timeout fallback 3 วินาที ถ้า server ไม่ตอบ
//        + ตรวจ socket connection ก่อน emit
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../../core/socket";
import { userService } from "./userService";

const RANDOM_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7",
  "#06b6d4", "#ec4899", "#eab308",
];
function randomColor() {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

export function useUser({ setPages, setHostTool, setHostPenStyle }) {
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("viewer");
  const [userColor, setUserColor] = useState(randomColor());
  const [userCount, setUserCount] = useState(1);
  const [hostExists, setHostExists] = useState(false);
  const [serverIp, setServerIp] = useState("localhost");
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [waitingForAck, setWaitingForAck] = useState(false);

  // refs
  const hasSubmittedRef = useRef(false);
  const timeoutRef = useRef(null);
  const pendingNameRef = useRef("");
  const pendingRoleRef = useRef("viewer");

  // ── Socket: check host + init state ──
  useEffect(() => {
    // รอให้ socket เชื่อมต่อก่อนแล้วค่อย check host
    const doCheckHost = () => {
      console.log("[useUser] socket connected, checking host...");
      userService.emitCheckHost();
    };

    if (socket.connected) {
      doCheckHost();
    } else {
      socket.on("connect", doCheckHost);
    }

    const handleHostExists = ({ exists }) => {
      console.log("[useUser] host-exists:", exists);
      setHostExists(exists);
    };
    const handleInitState = ({ pages: serverPages, hostTool: ht, hostPenStyle: hps, serverIp: sip }) => {
      if (serverPages && serverPages.length > 0) setPages(serverPages);
      if (ht) setHostTool(ht);
      if (hps) setHostPenStyle(hps);
      if (sip) setServerIp(sip);
    };
    const handleUserCount = (count) => setUserCount(count);

    // ★ เมื่อ server ตอบกลับ set-user-ack → ปิด dialog ★
    const handleSetUserAck = ({ role, name }) => {
      console.log("[useUser] set-user-ack received — role:", role, "name:", name);

      // ล้าง timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (name) setUsername(name);
      setUserRole(role);
      setWaitingForAck(false);
      hasSubmittedRef.current = true;
      setShowNameDialog(false);
    };

    userService.onHostExists(handleHostExists);
    userService.onInitState(handleInitState);
    userService.onUserCount(handleUserCount);
    userService.onSetUserAck(handleSetUserAck);

    return () => {
      socket.off("connect", doCheckHost);
      userService.offHostExists(handleHostExists);
      userService.offInitState(handleInitState);
      userService.offUserCount(handleUserCount);
      userService.offSetUserAck(handleSetUserAck);
    };
  }, [setPages, setHostTool, setHostPenStyle]);

  // ── Handler: NameDialog submit ──
  const handleNameSubmit = useCallback((name, role) => {
    // ป้องกัน double submit
    if (hasSubmittedRef.current || waitingForAck) return;

    console.log("[useUser] handleNameSubmit — name:", name, "role:", role, "socketConnected:", socket.connected);

    pendingNameRef.current = name;
    pendingRoleRef.current = role;
    setUsername(name);
    setWaitingForAck(true);

    // ส่งไป server
    userService.emitSetUser(name, role);

    // ★ Timeout fallback: ถ้า server ไม่ตอบภายใน 3 วินาที → เข้าเป็น viewer ★
    timeoutRef.current = setTimeout(() => {
      console.log("[useUser] TIMEOUT — server ไม่ตอบ, เข้าเป็น viewer");
      setUserRole("viewer");
      setWaitingForAck(false);
      hasSubmittedRef.current = true;
      setShowNameDialog(false);
    }, 3000);
  }, [waitingForAck]);

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    username, userRole, setUserRole, userColor, userCount,
    hostExists, showNameDialog, serverIp,
    waitingForAck,
    handleNameSubmit,
  };
}
