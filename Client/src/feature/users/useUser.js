// ============================================================
// useUser.js — Hook ระบบผู้ใช้ (login, role, host check)
// ============================================================
import { useState, useEffect } from "react";
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
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [serverIp, setServerIp] = useState("localhost");

  // ── Socket: check host + init state (ทำงานทันทีตอนเปิดแอป) ──
  useEffect(() => {
    userService.emitCheckHost();

    const handleHostExists = ({ exists }) => setHostExists(exists);
    const handleInitState = ({ pages: serverPages, hostTool: ht, hostPenStyle: hps, serverIp: sip }) => {
      if (serverPages && serverPages.length > 0) setPages(serverPages);
      if (ht) setHostTool(ht);
      if (hps) setHostPenStyle(hps);
      if (sip) setServerIp(sip);
    };
    const handleUserCount = (count) => setUserCount(count);

    userService.onHostExists(handleHostExists);
    userService.onInitState(handleInitState);
    userService.onUserCount(handleUserCount);

    return () => {
      userService.offHostExists(handleHostExists);
      userService.offInitState(handleInitState);
      userService.offUserCount(handleUserCount);
    };
  }, [setPages, setHostTool, setHostPenStyle]);

  // ── Handler: NameDialog submit ──
  const handleNameSubmit = (name, role) => {
    setUsername(name);
    setUserRole(role);
    setShowNameDialog(false);
    userService.emitSetUser(name, role);
  };

  return {
    username, userRole, setUserRole, userColor, userCount,
    hostExists, showNameDialog, serverIp,
    handleNameSubmit,
  };
}
