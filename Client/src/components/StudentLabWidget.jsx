// ============================================================
// StudentLabWidget.jsx - Virtual Student Laboratory
// ============================================================
// Embeds PhET Interactive Simulations for student self-learning
// Categories: Physics, Chemistry, Biology, Math
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ============================================================
// PhET Simulation Catalog
// ============================================================
const SIMULATIONS = [
  // ── Physics ──
  {
    id: "circuit-construction-kit-dc",
    name: "Circuit Construction Kit: DC",
    nameLocal: "ชุดต่อวงจรไฟฟ้ากระแสตรง",
    category: "physics",
    icon: "⚡",
    url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html",
    description: "Build circuits with batteries, resistors, light bulbs, and switches.",
  },
  {
    id: "circuit-construction-kit-dc-virtual-lab",
    name: "Circuit Construction Kit: DC - Virtual Lab",
    nameLocal: "ชุดต่อวงจร DC (Virtual Lab)",
    category: "physics",
    icon: "🔌",
    url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc-virtual-lab/latest/circuit-construction-kit-dc-virtual-lab_all.html",
    description: "Experiment with DC circuits in a full virtual lab.",
  },
  {
    id: "forces-and-motion-basics",
    name: "Forces and Motion: Basics",
    nameLocal: "แรงและการเคลื่อนที่ เบื้องต้น",
    category: "physics",
    icon: "🏋️",
    url: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html",
    description: "Explore forces, motion, friction, and acceleration.",
  },
  {
    id: "energy-skate-park-basics",
    name: "Energy Skate Park: Basics",
    nameLocal: "สเก็ตพาร์คพลังงาน",
    category: "physics",
    icon: "🛹",
    url: "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_all.html",
    description: "Learn about conservation of energy with a skater.",
  },
  {
    id: "gravity-and-orbits",
    name: "Gravity and Orbits",
    nameLocal: "แรงโน้มถ่วงและวงโคจร",
    category: "physics",
    icon: "🌍",
    url: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_all.html",
    description: "Move the sun, earth, moon to see how gravity affects their orbits.",
  },
  {
    id: "waves-intro",
    name: "Waves Intro",
    nameLocal: "คลื่นเบื้องต้น",
    category: "physics",
    icon: "🌊",
    url: "https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_all.html",
    description: "Explore the properties of waves.",
  },
  {
    id: "projectile-motion",
    name: "Projectile Motion",
    nameLocal: "การเคลื่อนที่แบบโพรเจกไทล์",
    category: "physics",
    icon: "🎯",
    url: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html",
    description: "Blast a car out of a cannon and learn about projectile motion.",
  },
  {
    id: "ohms-law",
    name: "Ohm's Law",
    nameLocal: "กฎของโอห์ม",
    category: "physics",
    icon: "🔋",
    url: "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html",
    description: "See how voltage, resistance, and current relate.",
  },
  {
    id: "pendulum-lab",
    name: "Pendulum Lab",
    nameLocal: "ห้องทดลองลูกตุ้ม",
    category: "physics",
    icon: "🕰️",
    url: "https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_all.html",
    description: "Play with pendulums to see how period is affected.",
  },
  {
    id: "geometric-optics",
    name: "Geometric Optics",
    nameLocal: "ทัศนศาสตร์เรขาคณิต",
    category: "physics",
    icon: "🔍",
    url: "https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_all.html",
    description: "Explore lenses and mirrors, how they form images.",
  },

  // ── Chemistry ──
  {
    id: "build-an-atom",
    name: "Build an Atom",
    nameLocal: "สร้างอะตอม",
    category: "chemistry",
    icon: "⚛️",
    url: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html",
    description: "Build an atom from protons, neutrons, and electrons.",
  },
  {
    id: "balancing-chemical-equations",
    name: "Balancing Chemical Equations",
    nameLocal: "ดุลสมการเคมี",
    category: "chemistry",
    icon: "⚖️",
    url: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_all.html",
    description: "Balance chemical equations by adjusting coefficients.",
  },
  {
    id: "ph-scale",
    name: "pH Scale",
    nameLocal: "มาตราส่วน pH",
    category: "chemistry",
    icon: "🧪",
    url: "https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_all.html",
    description: "Test the pH of common substances.",
  },
  {
    id: "states-of-matter",
    name: "States of Matter",
    nameLocal: "สถานะของสสาร",
    category: "chemistry",
    icon: "🧊",
    url: "https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_all.html",
    description: "Watch atoms and molecules simulate as you heat or cool.",
  },
  {
    id: "concentration",
    name: "Concentration",
    nameLocal: "ความเข้มข้น",
    category: "chemistry",
    icon: "💧",
    url: "https://phet.colorado.edu/sims/html/concentration/latest/concentration_all.html",
    description: "Explore how concentration changes with solute and solution amount.",
  },
  {
    id: "molecule-shapes",
    name: "Molecule Shapes",
    nameLocal: "รูปร่างโมเลกุล",
    category: "chemistry",
    icon: "🔬",
    url: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_all.html",
    description: "Explore 3D molecule geometry with VSEPR theory.",
  },

  // ── Biology / Earth Science ──
  {
    id: "natural-selection",
    name: "Natural Selection",
    nameLocal: "การคัดเลือกโดยธรรมชาติ",
    category: "biology",
    icon: "🐰",
    url: "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_all.html",
    description: "Explore how natural selection works with bunnies.",
  },
  {
    id: "gene-expression-essentials",
    name: "Gene Expression Essentials",
    nameLocal: "พื้นฐานการแสดงออกของยีน",
    category: "biology",
    icon: "🧬",
    url: "https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_all.html",
    description: "Express a gene and learn about transcription/translation.",
  },
  {
    id: "greenhouse-effect",
    name: "Greenhouse Effect",
    nameLocal: "ปรากฏการณ์เรือนกระจก",
    category: "biology",
    icon: "🌡️",
    url: "https://phet.colorado.edu/sims/html/greenhouse-effect/latest/greenhouse-effect_all.html",
    description: "See how greenhouse gases affect the climate.",
  },

  // ── Math ──
  {
    id: "graphing-lines",
    name: "Graphing Lines",
    nameLocal: "กราฟเส้นตรง",
    category: "math",
    icon: "📈",
    url: "https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines_all.html",
    description: "Explore slope and intercept of lines.",
  },
  {
    id: "area-builder",
    name: "Area Builder",
    nameLocal: "สร้างพื้นที่",
    category: "math",
    icon: "📐",
    url: "https://phet.colorado.edu/sims/html/area-builder/latest/area-builder_all.html",
    description: "Build shapes and explore the concept of area.",
  },
  {
    id: "fractions-intro",
    name: "Fractions: Intro",
    nameLocal: "เศษส่วน เบื้องต้น",
    category: "math",
    icon: "🍕",
    url: "https://phet.colorado.edu/sims/html/fractions-intro/latest/fractions-intro_all.html",
    description: "Build fractions from shapes and explore what fractions mean.",
  },
  {
    id: "number-line-operations",
    name: "Number Line: Operations",
    nameLocal: "เส้นจำนวน: การดำเนินการ",
    category: "math",
    icon: "➕",
    url: "https://phet.colorado.edu/sims/html/number-line-operations/latest/number-line-operations_all.html",
    description: "Explore operations on a number line.",
  },
  // ── MORE PHYSICS ──
  {
    id: "faradays-law",
    name: "Faraday's Law",
    nameLocal: "กฎของฟาราเดย์",
    category: "physics",
    icon: "🧲",
    url: "https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law_all.html",
    description: "Explore electromagnetic induction with a magnet and coil.",
  },
  {
    id: "wave-on-a-string",
    name: "Wave on a String",
    nameLocal: "คลื่นบนเส้นเชือก",
    category: "physics",
    icon: "〰️",
    url: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html",
    description: "Explore the properties of waves on a string.",
  },
  {
    id: "under-pressure",
    name: "Under Pressure",
    nameLocal: "แรงดันของไหล",
    category: "physics",
    icon: "🌊",
    url: "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_all.html",
    description: "Explore pressure under water and air.",
  },
  {
    id: "color-vision",
    name: "Color Vision",
    nameLocal: "การมองเห็นสี",
    category: "physics",
    icon: "🌈",
    url: "https://phet.colorado.edu/sims/html/color-vision/latest/color-vision_all.html",
    description: "Mix red, green, and blue light to make any color.",
  },
  {
    id: "hookes-law",
    name: "Hooke's Law",
    nameLocal: "กฎของฮุก",
    category: "physics",
    icon: "📏",
    url: "https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law_all.html",
    description: "Stretch and compress springs to explore Hooke's Law.",
  },
  {
    id: "masses-and-springs",
    name: "Masses and Springs",
    nameLocal: "มวลและสปริง",
    category: "physics",
    icon: "⚖️",
    url: "https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_all.html",
    description: "Play with masses on springs to learn about physics.",
  },
  {
    id: "energy-skate-park",
    name: "Energy Skate Park",
    nameLocal: "สเก็ตพาร์คพลังงาน (เต็มรูปแบบ)",
    category: "physics",
    icon: "🏂",
    url: "https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_all.html",
    description: "Advanced energy conservation with customizable tracks.",
  },
  {
    id: "circuit-construction-kit-ac-virtual-lab",
    name: "Circuit Construction Kit: AC",
    nameLocal: "ชุดต่อวงจรไฟฟ้ากระแสสลับ",
    category: "physics",
    icon: "💡",
    url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-ac-virtual-lab/latest/circuit-construction-kit-ac-virtual-lab_all.html",
    description: "Experiment with AC and DC circuits.",
  },

  // ── MORE CHEMISTRY ──
  {
    id: "reactants-products-and-leftovers",
    name: "Reactants, Products and Leftovers",
    nameLocal: "สารตั้งต้นและผลิตภัณฑ์",
    category: "chemistry",
    icon: "🍔",
    url: "https://phet.colorado.edu/sims/html/reactants-products-and-leftovers/latest/reactants-products-and-leftovers_all.html",
    description: "Create sandwiches or chemical reactions to see leftovers.",
  },
  {
    id: "molarity",
    name: "Molarity",
    nameLocal: "โมลาริตี (ความเข้มข้น)",
    category: "chemistry",
    icon: "🫗",
    url: "https://phet.colorado.edu/sims/html/molarity/latest/molarity_all.html",
    description: "What determines the concentration of a solution?",
  },
  {
    id: "isotopes-and-atomic-mass",
    name: "Isotopes and Atomic Mass",
    nameLocal: "ไอโซโทปและมวลอะตอม",
    category: "chemistry",
    icon: "⚛️",
    url: "https://phet.colorado.edu/sims/html/isotopes-and-atomic-mass/latest/isotopes-and-atomic-mass_all.html",
    description: "Discover how isotopes are made and their abundance.",
  },
  {
    id: "build-a-molecule",
    name: "Build a Molecule",
    nameLocal: "สร้างโมเลกุล",
    category: "chemistry",
    icon: "🔗",
    url: "https://phet.colorado.edu/sims/html/build-a-molecule/latest/build-a-molecule_all.html",
    description: "Construct molecules from atoms.",
  },

  // ── MORE MATH ──
  {
    id: "calculus-grapher",
    name: "Calculus Grapher",
    nameLocal: "กราฟแคลคูลัส",
    category: "math",
    icon: "📉",
    url: "https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher_all.html",
    description: "Draw a graph and see its derivative and integral.",
  },
  {
    id: "expression-exchange",
    name: "Expression Exchange",
    nameLocal: "สมการพีชคณิต",
    category: "math",
    icon: "✖️",
    url: "https://phet.colorado.edu/sims/html/expression-exchange/latest/expression-exchange_all.html",
    description: "Play with coins to learn about variables and expressions.",
  },
  {
    id: "function-builder",
    name: "Function Builder",
    nameLocal: "สร้างฟังก์ชัน",
    category: "math",
    icon: "🔄",
    url: "https://phet.colorado.edu/sims/html/function-builder/latest/function-builder_all.html",
    description: "Build functions with inputs and outputs.",
  },
  // ── MORE ESSENTIAL LABS ──
  {
    id: "bending-light",
    name: "Bending Light",
    nameLocal: "การหักเหของแสง (กฎสเนลล์)",
    category: "physics",
    icon: "🌈",
    url: "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html",
    description: "Explore the physics of bending light.",
  },
  {
    id: "charges-and-fields",
    name: "Charges and Fields",
    nameLocal: "ประจุและสนามไฟฟ้า",
    category: "physics",
    icon: "⚡",
    url: "https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_all.html",
    description: "Explore electric fields and electrostatic forces.",
  },
  {
    id: "coulombs-law",
    name: "Coulomb's Law",
    nameLocal: "กฎของคูลอมบ์",
    category: "physics",
    icon: "🧲",
    url: "https://phet.colorado.edu/sims/html/coulombs-law/latest/coulombs-law_all.html",
    description: "Explore the electrostatic force between two charges.",
  },
  {
    id: "gas-properties",
    name: "Gas Properties",
    nameLocal: "สมบัติของแก๊ส",
    category: "physics",
    icon: "🎈",
    url: "https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_all.html",
    description: "Pump gas molecules to a box and see what happens as you change the volume.",
  },
  {
    id: "density",
    name: "Density",
    nameLocal: "ความหนาแน่น",
    category: "physics",
    icon: "🧊",
    url: "https://phet.colorado.edu/sims/html/density/latest/density_all.html",
    description: "Create a custom object to explore the effects of mass and volume on density.",
  },
  {
    id: "acid-base-solutions",
    name: "Acid-Base Solutions",
    nameLocal: "สารละลายกรด-เบส",
    category: "chemistry",
    icon: "🧪",
    url: "https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_all.html",
    description: "How do strong and weak acids differ? Use lab tools to find out!",
  },
  {
    id: "trig-tour",
    name: "Trigonometry Tour",
    nameLocal: "วงกลมหนึ่งหน่วยตรีโกณมิติ",
    category: "math",
    icon: "📐",
    url: "https://phet.colorado.edu/sims/html/trig-tour/latest/trig-tour_all.html",
    description: "Take a tour of trigonometry using degrees or radians!",
  },
  {
    id: "proportion-playground",
    name: "Proportion Playground",
    nameLocal: "สัดส่วนและอัตราส่วน",
    category: "math",
    icon: "⚖️",
    url: "https://phet.colorado.edu/sims/html/proportion-playground/latest/proportion-playground_all.html",
    description: "Explore the relationship between ratios, fractions, and proportions.",
  },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "📚" },
  { id: "physics", label: "Physics", icon: "⚡" },
  { id: "chemistry", label: "Chemistry", icon: "🧪" },
  { id: "biology", label: "Biology", icon: "🧬" },
  { id: "math", label: "Math", icon: "📐" },
];

// ============================================================
// StudentLabWidget Component
// ============================================================
export default function StudentLabWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(config?.category || "all");
  const [selectedSim, setSelectedSim] = useState(config?.selectedSim || null);
  const [searchQuery, setSearchQuery] = useState("");
  const iframeRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  // Draggable
  const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
    storageKey: "proedu1-studentlab-pos",
    defaultPosition: { x: Math.max(40, window.innerWidth / 2 - 450), y: Math.max(40, window.innerHeight / 2 - 350) },
  });

  // Sync from remote
  useEffect(() => {
    if (!config) return;
    isRemoteUpdateRef.current = true;
    if (config.category) setSelectedCategory(config.category);
    if (config.selectedSim !== undefined) setSelectedSim(config.selectedSim);
    setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
  }, [config]);

  // Sync to remote
  useEffect(() => {
    if (!canEdit || !onSyncConfig || isRemoteUpdateRef.current) return;
    onSyncConfig({ category: selectedCategory, selectedSim });
  }, [selectedCategory, selectedSim, canEdit, onSyncConfig]);

  const handleSelectSim = useCallback((sim) => {
    setSelectedSim(sim.id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedSim(null);
  }, []);

  const filteredSims = SIMULATIONS.filter(sim => {
    const matchCategory = selectedCategory === "all" || sim.category === selectedCategory;
    const matchSearch = !searchQuery ||
      sim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.nameLocal.includes(searchQuery) ||
      sim.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const activeSim = selectedSim ? SIMULATIONS.find(s => s.id === selectedSim) : null;

  return (
    <div
      className="student-lab-widget"
      ref={handleRef}
      style={{
        ...dragStyle,
        position: "fixed",
        zIndex: 9999,
        width: activeSim ? "920px" : "680px",
        height: activeSim ? "660px" : "560px",
        transition: isDragging ? "none" : "width 0.3s ease, height 0.3s ease",
      }}
    >
      {/* ── Title Bar ── */}
      <div className="student-lab-titlebar" onPointerDown={handlePointerDown}>
        <div className="student-lab-titlebar-left">
          {activeSim && (
            <button className="student-lab-back-btn" onClick={handleBack} title="Back to browser">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span className="student-lab-title-icon">🧪</span>
          <span className="student-lab-title-text">
            {activeSim ? activeSim.name : "Student Lab"}
          </span>
        </div>
        <div className="student-lab-titlebar-right">
          {activeSim && (
            <a
              className="student-lab-external-btn"
              href={activeSim.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in browser"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
          <button className="student-lab-close-btn" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {activeSim ? (
        <div className="student-lab-sim-container">
          <iframe
            ref={iframeRef}
            src={activeSim.url.includes('?') ? activeSim.url + '&locale=th' : activeSim.url + '?locale=th'}
            className="student-lab-iframe"
            title={activeSim.name}
            allowFullScreen
            style={{ opacity: 1 }}
          />
        </div>
      ) : (
        <div className="student-lab-browser">
          {/* Search Bar */}
          <div className="student-lab-search-wrap">
            <svg className="student-lab-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="student-lab-search"
              type="text"
              placeholder="Search simulations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div className="student-lab-categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`student-lab-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Simulation Cards */}
          <div className="student-lab-grid">
            {filteredSims.map(sim => (
              <button
                key={sim.id}
                className="student-lab-card"
                onClick={() => handleSelectSim(sim)}
              >
                <div className="student-lab-card-icon">{sim.icon}</div>
                <div className="student-lab-card-info">
                  <div className="student-lab-card-name">{sim.name}</div>
                  <div className="student-lab-card-name-local">{sim.nameLocal}</div>
                  <div className="student-lab-card-desc">{sim.description}</div>
                </div>
                <div className={`student-lab-card-badge ${sim.category}`}>
                  {sim.category}
                </div>
              </button>
            ))}
            {filteredSims.length === 0 && (
              <div className="student-lab-empty">
                <span>😔</span>
                <p>No simulations found</p>
              </div>
            )}
          </div>

          {/* Attribution */}
          <div className="student-lab-attribution">
            Powered by <a href="https://phet.colorado.edu" target="_blank" rel="noopener noreferrer">PhET Interactive Simulations</a>, University of Colorado Boulder (CC-BY-4.0)
          </div>
        </div>
      )}
    </div>
  );
}
