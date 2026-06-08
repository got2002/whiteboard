import { useState, useEffect } from "react";
import { socket } from "../../core/socket";
import { userService } from "./userService";

export function useBanner() {
  const [bannerState, setBannerState] = useState({
    text: "ยินดีต้อนรับสู่ห้องเรียน 🎓",
    theme: { id: "classic", label: "คลาสสิก", bg: "#0a0a0a", text: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
    speed: { id: "normal", label: "ปกติ", duration: 15 },
    fontSize: { id: "md", label: "M", size: 32 },
    position: "bottom",
    isShowing: false
  });

  useEffect(() => {
    const handleInitState = (state) => {
      if (state.bannerState) setBannerState(state.bannerState);
    };

    const handleBannerUpdated = (state) => {
      setBannerState(state);
    };

    userService.onInitState(handleInitState);
    socket.on("banner-updated", handleBannerUpdated);

    return () => {
      userService.offInitState(handleInitState);
      socket.off("banner-updated", handleBannerUpdated);
    };
  }, []);

  const updateBanner = (newState) => {
    setBannerState(newState);
    socket.emit("update-banner", newState);
  };

  return { bannerState, updateBanner };
}
