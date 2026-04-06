import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

// ============================================================
// ค่าคงที่: 48 สีพื้นฐาน แบบฉบับ Windows Classic
// ============================================================
const BASIC_COLORS = [
  "#ff8080", "#ffff80", "#80ff80", "#00ff80", "#80ffff", "#0080ff", "#ff80c0", "#ff80ff",
  "#ff0000", "#ffff00", "#80ff00", "#00ff40", "#00ffff", "#0080c0", "#8080c0", "#ff00ff",
  "#804040", "#ff8040", "#00ff00", "#008080", "#004080", "#8080ff", "#800040", "#ff0080",
  "#800000", "#ff8000", "#008000", "#008040", "#0000ff", "#0000a0", "#800080", "#8000ff",
  "#400000", "#804000", "#004000", "#004040", "#000080", "#000040", "#400040", "#400080",
  "#000000", "#808000", "#808040", "#808080", "#408080", "#c0c0c0", "#400040", "#ffffff"
];

// Helper: แปลง HSL เป็น RGB
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Helper: แปลง RGB เป็น Hex
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

// Helper: แปลง Hex เป็น RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Helper: RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}


function ColorPickerModal({ currentColor, onClose, onSelectColor }) {
  // อ่าน Custom Colors จาก localStorage
  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem("proedu1-custom-colors");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return Array(16).fill("#ffffff");
  });

  const [selectedColor, setSelectedColor] = useState(currentColor || "#000000");
  const [rgb, setRgb] = useState(hexToRgb(selectedColor || "#000000"));
  
  // HSL state สำหรับ Spectrum
  const [hsv, setHsv] = useState(() => rgbToHsl(rgb.r, rgb.g, rgb.b));

  const spectrumRef = useRef(null);
  const sliderRef = useRef(null);
  const isDraggingSpectrum = useRef(false);
  const isDraggingSlider = useRef(false);

  const setAllFromHex = useCallback((hex) => {
    const newRgb = hexToRgb(hex);
    setRgb(newRgb);
    setHsv(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    setSelectedColor(hex);
  }, []);

  // Handle Basic/Custom Color Click
  const handleColorBoxClick = (c) => {
    setAllFromHex(c);
  };

  // Add to Custom Colors
  const handleAddToCustomColors = () => {
    setCustomColors(prev => {
      const newCustom = [...prev];
      // ลองหาช่องว่าง (#ffffff) หรือแทนที่ช่องเก่าสุด (ถ้าอยากทำ) ในที่นี้แทนที่ช่องแรกสุด
      let index = newCustom.findIndex(c => c === "#ffffff");
      if (index === -1) index = 15; // ถ้าเต็มแล้วเอาไปไว้ช่องสุดท้าย
      newCustom[index] = selectedColor;
      
      try {
        localStorage.setItem("proedu1-custom-colors", JSON.stringify(newCustom));
      } catch {}
      return newCustom;
    });
  };

  // ------------------------------------------------------------------
  // Spectrum Drag Logic (Hue & Saturation)
  // X = Hue (0-1), Y = Saturation (1-0)
  // ------------------------------------------------------------------
  const updateSpectrum = useCallback((e) => {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const h = x / rect.width;
    const s = 1 - (y / rect.height); // Saturation มากอยู่บน
    
    setHsv(prev => {
        let l = prev.l;
        // ถ้าความสว่าง (Lightness) เดิมเป็นสว่างสุด (ขาว) หรือมืดสุด (ดำ) 
        // การลากเปลี่ยนเฉดสีจะไม่เกิดผลลัพธ์ ดังนั้นเราปรับให้อยู่ตรงกลางเพื่อให้เห็นสี
        if (l < 0.05 || l > 0.95) {
          l = 0.5;
        }
        const newHsv = { h, s, l };
        const rgbCoords = hslToRgb(newHsv.h, newHsv.s, newHsv.l);
        setRgb({ r: rgbCoords[0], g: rgbCoords[1], b: rgbCoords[2] });
        setSelectedColor(rgbToHex(rgbCoords[0], rgbCoords[1], rgbCoords[2]));
        return newHsv;
    });
  }, []);

  // ------------------------------------------------------------------
  // Slider Drag Logic (Lightness)
  // Y = Lightness (1-0)
  // ------------------------------------------------------------------
  const updateSlider = useCallback((e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const l = 1 - (y / rect.height);
    
    setHsv(prev => {
        const newHsv = { h: prev.h, s: prev.s, l };
        const rgbCoords = hslToRgb(newHsv.h, newHsv.s, newHsv.l);
        setRgb({ r: rgbCoords[0], g: rgbCoords[1], b: rgbCoords[2] });
        setSelectedColor(rgbToHex(rgbCoords[0], rgbCoords[1], rgbCoords[2]));
        return newHsv;
    });
  }, []);

  // Global mouse events
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingSpectrum.current) updateSpectrum(e);
      if (isDraggingSlider.current) updateSlider(e);
    };
    const handleGlobalMouseUp = () => {
      isDraggingSpectrum.current = false;
      isDraggingSlider.current = false;
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [updateSpectrum, updateSlider]);

  return createPortal(
    <div className="cp-modal-overlay" onMouseDown={onClose}>
      <div className="cp-modal-content" onMouseDown={e => e.stopPropagation()}>
        <div className="cp-header">
          <span>Edit colors</span>
          <button className="cp-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="cp-body">
          {/* ส่วนบน: Spectrum & Inputs */}
          <div className="cp-top-section">
            <div className="cp-interactive">
              {/* Spectrum Map */}
              <div 
                className="cp-spectrum"
                ref={spectrumRef}
                onMouseDown={(e) => { isDraggingSpectrum.current = true; updateSpectrum(e); }}
              >
                <div className="cp-spectrum-bg" />
                <div 
                  className="cp-spectrum-pointer"
                  style={{ left: `${hsv.h * 100}%`, top: `${(1 - hsv.s) * 100}%` }}
                />
              </div>

              {/* Slider Map (Lightness) */}
              <div 
                className="cp-slider-track"
                ref={sliderRef}
                onMouseDown={(e) => { isDraggingSlider.current = true; updateSlider(e); }}
              >
                <div 
                  className="cp-slider-bg" 
                  style={{
                    background: `linear-gradient(to bottom, #ffffff, ${rgbToHex(hslToRgb(hsv.h, hsv.s, 0.5)[0], hslToRgb(hsv.h, hsv.s, 0.5)[1], hslToRgb(hsv.h, hsv.s, 0.5)[2])}, #000000)`
                  }}
                />
                <div 
                  className="cp-slider-pointer"
                  style={{ top: `${(1 - hsv.l) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="cp-inputs">
              <div className="cp-input-group hex-group">
                <input 
                  type="text" 
                  value={selectedColor.toUpperCase()} 
                  onChange={e => {
                    const val = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(val)) setAllFromHex(val);
                    else setSelectedColor(val);
                  }}
                  onBlur={e => {
                    if (!/^#[0-9A-F]{6}$/i.test(e.target.value)) setAllFromHex("#000000");
                  }}
                />
              </div>

              <div className="cp-rgb-dropdown">
                <span>RGB</span>
                <span className="arrow">⌄</span>
              </div>

              <div className="cp-rgb-inputs">
                <div className="cp-input-group">
                  <input type="number" min="0" max="255" value={rgb.r} onChange={e => setAllFromHex(rgbToHex(Number(e.target.value), rgb.g, rgb.b))} />
                  <label>Red</label>
                </div>
                <div className="cp-input-group">
                  <input type="number" min="0" max="255" value={rgb.g} onChange={e => setAllFromHex(rgbToHex(rgb.r, Number(e.target.value), rgb.b))} />
                  <label>Green</label>
                </div>
                <div className="cp-input-group">
                  <input type="number" min="0" max="255" value={rgb.b} onChange={e => setAllFromHex(rgbToHex(rgb.r, rgb.g, Number(e.target.value)))} />
                  <label>Blue</label>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนล่าง: Basic & Custom Colors */}
          <div className="cp-bottom-section">
            <div className="cp-palettes">
              <div className="cp-section">
                <div className="cp-label">Basic colors</div>
                <div className="cp-grid basic">
                  {BASIC_COLORS.map((c, i) => (
                    <div 
                      key={i} 
                      className={`cp-color-box ${selectedColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => handleColorBoxClick(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="cp-section">
                <div className="cp-label custom-label-row">
                  <span>Custom colors</span>
                  <button className="cp-add-custom-icon" onClick={handleAddToCustomColors}>+</button>
                </div>
                <div className="cp-grid custom">
                  {customColors.map((c, i) => (
                    <div 
                      key={`custom-${i}`} 
                      className={`cp-color-box custom-box ${selectedColor === c && c !== "#ffffff" ? 'active' : ''} ${c === "#ffffff" ? 'empty' : ''}`}
                      style={{ backgroundColor: c === "#ffffff" ? "transparent" : c }}
                      onClick={() => handleColorBoxClick(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cp-footer">
          <button className="cp-btn fill" onClick={() => onSelectColor(selectedColor)}>OK</button>
          <button className="cp-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ColorPickerModal;
