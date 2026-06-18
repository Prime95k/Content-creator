import { useState, useEffect, useRef, useCallback } from "react";

// ─── PDF.js via CDN ───────────────────────────────────────────────────────────
const loadPdfJs = () =>
  new Promise((res) => {
    if (window.pdfjsLib) return res(window.pdfjsLib);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      res(window.pdfjsLib);
    };
    document.head.appendChild(s);
  });

// ─── Colours ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#f7f4ef",
  paper: "#fffef9",
  ink: "#1a1a2e",
  inkLight: "#4a4a6a",
  inkFaint: "#9898b8",
  rule: "#e0ddd5",
  accent: "#2563eb",
  accentSoft: "#dbeafe",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  drawStroke: "#1a1a2e",
};

// ─── Icon shapes for panels (SVG paths) ──────────────────────────────────────
const ICONS = {
  bulb: "M12 2a7 7 0 0 1 7 7c0 3-1.7 5.5-4 6.7V18H9v-2.3C6.7 14.5 5 12 5 9a7 7 0 0 1 7-7zm-2 20h4m-4-2h4",
  chart: "M3 3v18h18M7 16l4-4 4 4 4-6",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  brain: "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  arrow: "M5 12h14M12 5l7 7-7 7",
};

const ICON_KEYS = Object.keys(ICONS);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pickIcon(idx) {
  return ICON_KEYS[idx % ICON_KEYS.length];
}

// ─── Animated Drawing Panel ───────────────────────────────────────────────────
function DrawPanel({ panel, active, played, index }) {
  const [drawn, setDrawn] = useState(false);
  const [textReveal, setTextReveal] = useState(0);
  const [iconDash, setIconDash] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!active) {
      setDrawn(false);
      setTextReveal(0);
      setIconDash(0);
      return;
    }
    // Animate icon stroke
    let start = null;
    const total = 80;
    const animIcon = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setIconDash(Math.floor(p * total));
      if (p < 1) raf.current = requestAnimationFrame(animIcon);
      else {
        setDrawn(true);
        // Then reveal text char by char
        let ci = 0;
        const txt = panel.narration || "";
        const id = setInterval(() => {
          ci++;
          setTextReveal(ci);
          if (ci >= txt.length) clearInterval(id);
        }, 22);
      }
    };
    raf.current = requestAnimationFrame(animIcon);
    return () => {
      cancelAnimationFrame(raf.current);
    };
  }, [active, panel.narration]);

  const iconPath = ICONS[pickIcon(index)];
  const dashLen = 80;

  return (
    <div
      style={{
        ...ps.panel,
        ...(active ? ps.panelActive : {}),
        ...(played && !active ? ps.panelPlayed : {}),
      }}
    >
      {/* Panel number */}
      <div style={ps.panelNum}>{String(index + 1).padStart(2, "0")}</div>

      {/* Animated icon */}
      <div style={ps.iconWrap}>
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="none"
          stroke={active ? C.accent : C.inkFaint}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.3s" }}
        >
          <path
            d={iconPath}
            strokeDasharray={dashLen}
            strokeDashoffset={active ? Math.max(0, dashLen - iconDash) : dashLen}
            style={{ transition: active ? "none" : "stroke-dashoffset 0s" }}
          />
        </svg>
      </div>

      {/* Headline */}
      <h3 style={ps.panelTitle}>{panel.title}</h3>

      {/* Key point — draws in */}
      <p style={ps.panelPoint}>
        {panel.keyPoint}
      </p>

      {/* Narration text revealing */}
      {active && (
        <p style={ps.narrationText}>
          {(panel.narration || "").slice(0, textReveal)}
          <span style={ps.cursor}>|</span>
        </p>
      )}

      {/* Playing badge */}
      {active && (
        <div style={ps.badge}>
          <span style={ps.dot2} />
          NARRATING
        </div>
      )}
      {played && !active && (
        <div style={{ ...ps.badge, background: "#dcfce7", color: C.green }}>
          ✓ DONE
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ExplainerStudio() {
  const [tab, setTab] = useState("text"); // 'text' | 'pdf'
  const [rawText, setRawText] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("idle"); // idle | generating | ready | playing | paused | done
  const [explainer, setExplainer] = useState(null); // { title, intro, panels[], outro }
  const [currentPanel, setCurrentPanel] = useState(-1);
  const [playedPanels, setPlayedPanels] = useState([]);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const synthRef = useRef(window.speechSynthesis);
  const utterRef = useRef(null);
  const panelTimeoutRef = useRef(null);

  // Load voices
  useEffect(() => {
    const load = () => {
      const vs = synthRef.current.getVoices().filter(v => v.lang.startsWith("en"));
      if (vs.length) { setVoices(vs); setSelectedVoice(vs[0]); }
    };
    load();
    synthRef.current.onvoiceschanged = load;
  }, []);

  // PDF extraction
  const handlePDF = async (file) => {
    if (!file) return;
    setPdfName(file.name);
    const lib = await loadPdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 12); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(" ") + "\n";
    }
    setPdfText(text.slice(0, 6000));
  };

  const inputText = tab === "text" ? rawText : pdfText;
  const canGenerate = inputText.trim().length > 30;

  // ── Generate explainer ─────────────────────────────────────────────────────
  const generate = async () => {
    setLoading(true);
    setStage("generating");
    setError("");
    setExplainer(null);
    setCurrentPanel(-1);
    setPlayedPanels([]);

    const prompt = `You are an expert explainer video scriptwriter. Given source material, create a structured animated explainer video script.

SOURCE MATERIAL:
"""
${inputText.slice(0, 5000)}
"""

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "title": "Short punchy title for the explainer (max 8 words)",
  "intro": "1 sentence spoken intro that hooks the viewer",
  "panels": [
    {
      "title": "Panel headline (3-5 words)",
      "keyPoint": "The core idea in 10 words max",
      "narration": "What the narrator says for this panel (2-3 sentences, conversational, clear)"
    }
  ],
  "outro": "1 sentence closing that wraps it all up"
}

Rules:
- Exactly 5 panels
- Each narration is 2-3 natural spoken sentences
- keyPoint is a punchy summary phrase
- Titles are bold and specific, not generic
- Tone: clear, engaging, like a smart friend explaining something
- Return ONLY the JSON object`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          }),
        }
      );
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (!parsed.panels || parsed.panels.length === 0) throw new Error("Bad structure");
      setExplainer(parsed);
      setStage("ready");
    } catch (e) {
      setError("Generation failed. Check your input and try again.");
      setStage("idle");
    }
    setLoading(false);
  };

  // ── Speak a line ────────────────────────────────────────────────────────────
  const speak = useCallback((text, onEnd) => {
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = selectedVoice;
    u.rate = 0.92;
    u.pitch = 1.0;
    u.volume = 1;
    u.onend = onEnd;
    utterRef.current = u;
    synthRef.current.speak(u);
  }, [selectedVoice]);

  // ── Play sequence ──────────────────────────────────────────────────────────
  const playFrom = useCallback((startIdx) => {
    if (!explainer) return;
    setStage("playing");

    const panels = explainer.panels;

    const playPanel = (idx) => {
      if (idx >= panels.length) {
        // Outro
        setCurrentPanel(-2); // -2 = outro
        speak(explainer.outro, () => {
          setStage("done");
          setCurrentPanel(-1);
        });
        return;
      }
      setCurrentPanel(idx);
      const text = panels[idx].narration;
      speak(text, () => {
        setPlayedPanels(p => [...new Set([...p, idx])]);
        panelTimeoutRef.current = setTimeout(() => playPanel(idx + 1), 600);
      });
    };

    playPanel(startIdx);
  }, [explainer, speak]);

  const startPlay = () => {
    setPlayedPanels([]);
    playFrom(0);
  };

  const pausePlay = () => {
    synthRef.current.pause();
    setStage("paused");
  };

  const resumePlay = () => {
    synthRef.current.resume();
    setStage("playing");
  };

  const stopPlay = () => {
    synthRef.current.cancel();
    clearTimeout(panelTimeoutRef.current);
    setStage("ready");
    setCurrentPanel(-1);
  };

  const reset = () => {
    stopPlay();
    setExplainer(null);
    setStage("idle");
    setRawText("");
    setPdfText("");
    setPdfName("");
    setPlayedPanels([]);
    setError("");
  };

  // ── Progress ──────────────────────────────────────────────────────────────
  const progress = explainer
    ? Math.round((playedPanels.length / (explainer.panels.length)) * 100)
    : 0;

  return (
    <div style={s.root}>
      {/* Inject animations */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.7} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {/* ── Header ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.brand}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="6" fill={C.accent} />
              <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={s.brandName}>Explainer Studio</span>
          </div>
          <span style={s.brandSub}>by Bezalel</span>
        </div>
      </header>

      <main style={s.main}>

        {/* ── Input Stage ── */}
        {(stage === "idle" || stage === "generating") && (
          <div style={s.inputCard}>
            <p style={s.inputEyebrow}>WHAT DO YOU WANT TO EXPLAIN?</p>
            <h2 style={s.inputTitle}>Drop your content. Get a video.</h2>

            {/* Tabs */}
            <div style={s.tabs}>
              {["text", "pdf"].map(t => (
                <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
                  onClick={() => setTab(t)}>
                  {t === "text" ? "✏️  Paste Text" : "📄  Upload PDF"}
                </button>
              ))}
            </div>

            {tab === "text" && (
              <textarea
                style={s.textarea}
                placeholder="Paste your topic, article, notes, or anything you want turned into an explainer video..."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={7}
              />
            )}

            {tab === "pdf" && (
              <div style={s.dropZone}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handlePDF(e.dataTransfer.files[0]); }}>
                <input type="file" accept=".pdf" style={{ display: "none" }} id="pdfIn"
                  onChange={e => handlePDF(e.target.files[0])} />
                {pdfText ? (
                  <div style={s.pdfReady}>
                    <span style={s.pdfIcon}>📄</span>
                    <div>
                      <p style={s.pdfName}>{pdfName}</p>
                      <p style={s.pdfWords}>{pdfText.split(" ").length.toLocaleString()} words extracted</p>
                    </div>
                    <button style={s.pdfClear} onClick={() => { setPdfText(""); setPdfName(""); }}>✕</button>
                  </div>
                ) : (
                  <label htmlFor="pdfIn" style={s.dropLabel}>
                    <span style={s.dropIcon}>⬆</span>
                    <p style={s.dropText}>Drag & drop a PDF or click to browse</p>
                    <p style={s.dropSub}>Up to 12 pages</p>
                  </label>
                )}
              </div>
            )}

            {/* Voice selector */}
            {voices.length > 1 && (
              <div style={s.voiceRow}>
                <label style={s.voiceLabel}>🎙 Narrator voice</label>
                <select style={s.voiceSelect}
                  value={selectedVoice?.name || ""}
                  onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value))}>
                  {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              </div>
            )}

            {error && <p style={s.error}>{error}</p>}

            <button style={{ ...s.genBtn, opacity: canGenerate && !loading ? 1 : 0.45,
                cursor: canGenerate && !loading ? "pointer" : "not-allowed" }}
              onClick={generate} disabled={!canGenerate || loading}>
              {loading ? (
                <span style={s.loadRow}>
                  <span style={s.spinner} />
                  Generating explainer...
                </span>
              ) : "→ Generate Explainer Video"}
            </button>
          </div>
        )}

        {/* ── Explainer Stage ── */}
        {explainer && stage !== "idle" && stage !== "generating" && (
          <div style={s.explainerWrap} key="explainer">

            {/* Title + intro */}
            <div style={s.titleBlock}>
              <p style={s.titleEyebrow}>EXPLAINER VIDEO</p>
              <h1 style={s.explainerTitle}>{explainer.title}</h1>
              <p style={s.introText}>{explainer.intro}</p>
            </div>

            {/* Progress bar */}
            <div style={s.progressWrap}>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${progress}%` }} />
              </div>
              <span style={s.progressLabel}>{progress}%</span>
            </div>

            {/* Panels grid */}
            <div style={s.panelsGrid}>
              {explainer.panels.map((panel, i) => (
                <DrawPanel
                  key={i}
                  panel={panel}
                  index={i}
                  active={currentPanel === i}
                  played={playedPanels.includes(i)}
                />
              ))}
            </div>

            {/* Outro */}
            {(stage === "done" || currentPanel === -2) && (
              <div style={s.outroCard}>
                <p style={s.outroEyebrow}>WRAP UP</p>
                <p style={s.outroText}>{explainer.outro}</p>
              </div>
            )}

            {/* Controls */}
            <div style={s.controls}>
              {stage === "ready" && (
                <button style={s.playBtn} onClick={startPlay}>
                  ▶ Play Explainer
                </button>
              )}
              {stage === "playing" && (
                <>
                  <button style={s.pauseBtn} onClick={pausePlay}>⏸ Pause</button>
                  <button style={s.stopBtn} onClick={stopPlay}>■ Stop</button>
                </>
              )}
              {stage === "paused" && (
                <>
                  <button style={s.playBtn} onClick={resumePlay}>▶ Resume</button>
                  <button style={s.stopBtn} onClick={stopPlay}>■ Stop</button>
                </>
              )}
              {stage === "done" && (
                <>
                  <button style={s.playBtn} onClick={startPlay}>↺ Play Again</button>
                  <button style={{ ...s.stopBtn, marginLeft: 10 }} onClick={reset}>＋ New Video</button>
                </>
              )}

              {(stage === "ready" || stage === "done") && (
                <button style={s.resetLink} onClick={reset}>← New content</button>
              )}
            </div>

            {/* Screen record tip */}
            {stage === "playing" && (
              <div style={s.tip}>
                💡 Screen record this tab to capture your explainer video
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Panel styles ─────────────────────────────────────────────────────────────
const ps = {
  panel: {
    background: C.paper,
    border: `1.5px solid ${C.rule}`,
    borderRadius: 14,
    padding: "20px 18px 16px",
    position: "relative",
    transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
    minHeight: 200,
  },
  panelActive: {
    borderColor: C.accent,
    boxShadow: `0 0 0 3px ${C.accentSoft}, 0 8px 24px rgba(37,99,235,0.12)`,
    transform: "translateY(-2px)",
  },
  panelPlayed: {
    borderColor: "#86efac",
    background: "#f0fdf4",
  },
  panelNum: {
    position: "absolute",
    top: 14,
    right: 16,
    fontSize: 11,
    fontWeight: 600,
    color: C.inkFaint,
    fontFamily: "Inter, sans-serif",
    letterSpacing: "0.05em",
  },
  iconWrap: { marginBottom: 12 },
  panelTitle: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 17,
    fontWeight: 400,
    color: C.ink,
    margin: "0 0 6px 0",
    lineHeight: 1.3,
  },
  panelPoint: {
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: C.accent,
    margin: "0 0 10px 0",
    letterSpacing: "0.01em",
    textTransform: "uppercase",
  },
  narrationText: {
    fontFamily: "Inter, sans-serif",
    fontSize: 13,
    color: C.inkLight,
    lineHeight: 1.65,
    margin: "10px 0 0 0",
    animation: "fadeUp 0.3s ease",
    borderTop: `1px solid ${C.rule}`,
    paddingTop: 10,
  },
  cursor: {
    animation: "blink 1s infinite",
    color: C.accent,
    fontWeight: 700,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    background: C.accentSoft,
    color: C.accent,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    padding: "3px 8px",
    borderRadius: 20,
    fontFamily: "Inter, sans-serif",
  },
  dot2: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: C.accent,
    display: "inline-block",
    animation: "pulse 1s ease infinite",
  },
};

// ─── Layout styles ────────────────────────────────────────────────────────────
const s = {
  root: {
    background: C.bg,
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, sans-serif",
    color: C.ink,
  },
  header: {
    background: C.paper,
    borderBottom: `1px solid ${C.rule}`,
    padding: "14px 20px",
  },
  headerInner: {
    maxWidth: 760,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandName: {
    fontSize: 16,
    fontWeight: 600,
    color: C.ink,
    letterSpacing: "-0.01em",
  },
  brandSub: {
    fontSize: 11,
    color: C.inkFaint,
    letterSpacing: "0.1em",
  },
  main: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "32px 16px 60px",
  },

  // Input card
  inputCard: {
    background: C.paper,
    border: `1px solid ${C.rule}`,
    borderRadius: 16,
    padding: "28px 24px",
    animation: "fadeUp 0.4s ease",
  },
  inputEyebrow: {
    fontSize: 10,
    letterSpacing: "0.2em",
    color: C.inkFaint,
    margin: "0 0 6px",
    fontWeight: 600,
  },
  inputTitle: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 26,
    fontWeight: 400,
    margin: "0 0 20px",
    lineHeight: 1.2,
    color: C.ink,
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: "9px 14px",
    borderRadius: 8,
    border: `1.5px solid ${C.rule}`,
    background: "transparent",
    color: C.inkLight,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    transition: "all 0.2s",
  },
  tabActive: {
    borderColor: C.accent,
    color: C.accent,
    background: C.accentSoft,
  },
  textarea: {
    width: "100%",
    background: C.bg,
    border: `1.5px solid ${C.rule}`,
    borderRadius: 10,
    color: C.ink,
    fontSize: 14,
    padding: "12px 14px",
    resize: "vertical",
    fontFamily: "Inter, sans-serif",
    lineHeight: 1.6,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 14,
  },
  dropZone: {
    border: `2px dashed ${C.rule}`,
    borderRadius: 10,
    minHeight: 120,
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.2s",
    cursor: "pointer",
  },
  dropLabel: {
    textAlign: "center",
    cursor: "pointer",
    padding: 24,
    display: "block",
    width: "100%",
  },
  dropIcon: { fontSize: 28, display: "block", marginBottom: 8 },
  dropText: { margin: "0 0 4px", fontSize: 14, color: C.inkLight },
  dropSub: { margin: 0, fontSize: 11, color: C.inkFaint },
  pdfReady: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    width: "100%",
    boxSizing: "border-box",
  },
  pdfIcon: { fontSize: 28 },
  pdfName: { margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: C.ink },
  pdfWords: { margin: 0, fontSize: 11, color: C.green },
  pdfClear: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    color: C.inkFaint,
    fontSize: 16,
    cursor: "pointer",
  },
  voiceRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  voiceLabel: { fontSize: 12, color: C.inkLight, whiteSpace: "nowrap" },
  voiceSelect: {
    flex: 1,
    minWidth: 140,
    background: C.bg,
    border: `1.5px solid ${C.rule}`,
    borderRadius: 8,
    color: C.ink,
    fontSize: 12,
    padding: "7px 10px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
  },
  error: { color: C.red, fontSize: 13, marginBottom: 10 },
  genBtn: {
    width: "100%",
    background: C.accent,
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    letterSpacing: "0.01em",
    transition: "opacity 0.2s",
  },
  loadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  spinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },

  // Explainer
  explainerWrap: { animation: "fadeUp 0.5s ease" },
  titleBlock: {
    background: C.paper,
    border: `1px solid ${C.rule}`,
    borderRadius: 14,
    padding: "24px 22px",
    marginBottom: 16,
  },
  titleEyebrow: {
    fontSize: 10,
    letterSpacing: "0.2em",
    color: C.inkFaint,
    margin: "0 0 6px",
    fontWeight: 600,
  },
  explainerTitle: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 28,
    fontWeight: 400,
    margin: "0 0 10px",
    lineHeight: 1.2,
    color: C.ink,
  },
  introText: {
    fontSize: 14,
    color: C.inkLight,
    margin: 0,
    lineHeight: 1.6,
    fontStyle: "italic",
  },
  progressWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    background: C.rule,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: `linear-gradient(90deg, ${C.accent}, #60a5fa)`,
    borderRadius: 4,
    transition: "width 0.6s ease",
  },
  progressLabel: { fontSize: 11, color: C.inkFaint, minWidth: 30, textAlign: "right" },
  panelsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 14,
    marginBottom: 16,
  },
  outroCard: {
    background: `linear-gradient(135deg, #eff6ff, #f0fdf4)`,
    border: `1.5px solid #bfdbfe`,
    borderRadius: 12,
    padding: "18px 20px",
    marginBottom: 16,
    animation: "fadeUp 0.4s ease",
  },
  outroEyebrow: {
    fontSize: 10,
    letterSpacing: "0.2em",
    color: C.accent,
    margin: "0 0 6px",
    fontWeight: 700,
  },
  outroText: {
    fontSize: 15,
    color: C.ink,
    margin: 0,
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  playBtn: {
    background: C.accent,
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
  },
  pauseBtn: {
    background: C.amber,
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
  },
  stopBtn: {
    background: "transparent",
    color: C.inkLight,
    border: `1.5px solid ${C.rule}`,
    borderRadius: 10,
    padding: "11px 18px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
  },
  resetLink: {
    background: "transparent",
    border: "none",
    color: C.inkFaint,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    marginLeft: "auto",
  },
  tip: {
    background: "#fefce8",
    border: "1px solid #fde68a",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#92400e",
    lineHeight: 1.5,
  },
};

// Inject extra keyframes
const kf = document.createElement("style");
kf.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(kf);
