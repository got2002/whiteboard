import { useState, useRef, useEffect, useMemo } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ============================================================
// Statistical Math Helpers
// ============================================================
function calculateStats(numbers) {
  if (!numbers || numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;
  
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];
  
  // Mode
  const counts = {};
  let maxCount = 0;
  for (const num of sorted) {
    counts[num] = (counts[num] || 0) + 1;
    if (counts[num] > maxCount) maxCount = counts[num];
  }
  const modes = Object.keys(counts).filter(k => counts[k] === maxCount).map(Number);
  
  // Variance (Sample)
  let variance = 0;
  if (n > 1) {
    variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  }
  const stdDev = Math.sqrt(variance);

  // For histogram
  const binCount = Math.max(5, Math.min(15, Math.ceil(Math.sqrt(n))));
  const binSize = range === 0 ? 1 : range / binCount;
  const bins = Array.from({ length: binCount }, () => 0);
  for (const num of sorted) {
    let binIdx = Math.floor((num - min) / binSize);
    if (binIdx >= binCount) binIdx = binCount - 1;
    bins[binIdx]++;
  }
  const maxBinVal = Math.max(...bins);

  return { n, min, max, range, mean, median, modes, maxCount, variance, stdDev, bins, binSize, maxBinVal };
}

// ============================================================
// Statistics Widget
// ============================================================
export default function StatisticsWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {
  const [inputText, setInputText] = useState(config?.data || "10, 20, 30, 40, 50, 60, 70, 80");
  const isRemoteUpdateRef = useRef(false);

  // Draggable
  const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
    storageKey: "proedu1-statistics-pos",
    defaultPosition: { x: Math.max(40, window.innerWidth / 2 - 250), y: Math.max(40, window.innerHeight / 2 - 300) },
  });

  // Sync from remote
  useEffect(() => {
    if (!config) return;
    isRemoteUpdateRef.current = true;
    if (config.data !== undefined && config.data !== inputText) {
      setInputText(config.data);
    }
    setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
  }, [config]);

  // Sync to remote
  useEffect(() => {
    if (!canEdit || !onSyncConfig || isRemoteUpdateRef.current) return;
    const timeout = setTimeout(() => {
      onSyncConfig({ data: inputText });
    }, 800);
    return () => clearTimeout(timeout);
  }, [inputText, canEdit, onSyncConfig]);

  // Compute stats
  const { numbers, stats, error } = useMemo(() => {
    try {
      if (!inputText.trim()) return { numbers: [], stats: null, error: null };
      
      const parts = inputText.split(/[,\s\n]+/).filter(Boolean);
      const nums = [];
      for (const p of parts) {
        const val = Number(p);
        if (isNaN(val)) throw new Error(`"${p}" is not a number`);
        nums.push(val);
      }
      
      const st = calculateStats(nums);
      return { numbers: nums, stats: st, error: null };
    } catch (err) {
      return { numbers: [], stats: null, error: err.message };
    }
  }, [inputText]);

  return (
    <div
      className="statistics-widget"
      style={{
        position: "absolute",
        left: dragStyle.left,
        top: dragStyle.top,
        zIndex: 1000,
        pointerEvents: "auto",
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      <div 
        className="statistics-titlebar"
        ref={handleRef}
        onPointerDown={handlePointerDown}
      >
        <div className="statistics-titlebar-left">
          <span className="statistics-title-icon">📊</span>
          <span className="statistics-title-text">Data & Statistics</span>
        </div>
        <div className="statistics-titlebar-right">
          <button className="statistics-btn close" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="statistics-content">
        <div className="statistics-input-section">
          <label>Data Input (comma or space separated):</label>
          <textarea 
            className="statistics-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. 10 15 20 25 30"
            disabled={!canEdit}
          />
          {error && <div className="statistics-error">{error}</div>}
        </div>

        {stats && (
          <div className="statistics-results">
            <div className="statistics-grid">
              <div className="stat-card">
                <div className="stat-label">Count (n)</div>
                <div className="stat-val">{stats.n}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Mean (x̄)</div>
                <div className="stat-val primary">{stats.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Median</div>
                <div className="stat-val">{stats.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Mode</div>
                <div className="stat-val" title={stats.modes.join(", ")}>
                  {stats.maxCount > 1 
                    ? (stats.modes.length > 2 ? `${stats.modes[0]}, ${stats.modes[1]}...` : stats.modes.join(", "))
                    : "None"}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Range</div>
                <div className="stat-val">{stats.range.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Min / Max</div>
                <div className="stat-val" style={{ fontSize: "14px" }}>{stats.min} / {stats.max}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Std Dev (s)</div>
                <div className="stat-val warning">{stats.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Variance (s²)</div>
                <div className="stat-val">{stats.variance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            {/* Simple Histogram */}
            {stats.bins && stats.bins.length > 0 && stats.maxBinVal > 0 && (
              <div className="statistics-chart-wrap">
                <div className="statistics-chart-title">Histogram Distribution</div>
                <div className="statistics-histogram">
                  {stats.bins.map((count, i) => {
                    const heightPct = (count / stats.maxBinVal) * 100;
                    const rangeStart = (stats.min + i * stats.binSize).toFixed(1);
                    return (
                      <div key={i} className="hist-bar-wrap" title={`${rangeStart} : ${count}`}>
                        <div className="hist-bar" style={{ height: `${heightPct}%` }}>
                          {count > 0 && <span className="hist-val">{count}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
