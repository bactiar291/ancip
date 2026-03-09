"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ── helpers ── */
function countryFlag(code) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button className={`ic-copy${ok ? " ok" : ""}`}
      onClick={() => { navigator.clipboard.writeText(String(text ?? "")); setOk(true); setTimeout(() => setOk(false), 1800); }}>
      {ok ? "✓ ok" : "⎘ copy"}
    </button>
  );
}

function OutLine({ label, val, color = "", copy = false }) {
  const empty = !val && val !== 0;
  return (
    <div className="out-line">
      <span className="out-key">{label}</span>
      <span className={`out-val${empty ? " dim" : color ? " " + color : " white"}`}>
        {empty ? "—" : val}
        {copy && !empty && <CopyBtn text={val} />}
      </span>
    </div>
  );
}

/* ════════════════════════
   INTRO ANIMATION (5 detik)
   ════════════════════════ */
function IntroScreen({ onDone }) {
  const [frame, setFrame]   = useState(0);
  const [posX, setPosX]     = useState(-80);
  const [phase, setPhase]   = useState("run"); // run | slash | text | fade
  const [showText, setSText] = useState(false);
  const [fadeOut, setFade]   = useState(false);
  const [charFrame, setCF]   = useState(0);

  // Running frames (ascii silhouette)
  const runFrames = [
    // frame 0
    `  O  \n /|\\ \n/ \\ `,
    // frame 1
    `  O  \n /|\\ \n  />`,
    // frame 2
    `  O  \n /|\\ \n /\\ `,
    // frame 3
    `  O  \n \\|\\ \n  \\>`,
  ];

  // Slash frames
  const slashFrames = [
    `  O  \n-/|\\\n / \\`,
    `  O  \n /|-\n / \\`,
    `  O  \n /|\\\n-/ \\`,
  ];

  useEffect(() => {
    // Animate running character across screen
    const runInt = setInterval(() => {
      setCF(f => (f + 1) % runFrames.length);
    }, 120);

    const moveInt = setInterval(() => {
      setPosX(x => {
        if (x > 105) return x; // stop at right
        return x + 2.2;
      });
    }, 40);

    // At ~1.8s char reaches center → slash
    setTimeout(() => {
      clearInterval(runInt);
      setPhase("slash");
      let sf = 0;
      const slashInt = setInterval(() => {
        setCF(sf % slashFrames.length);
        sf++;
        if (sf >= slashFrames.length * 2) {
          clearInterval(slashInt);
          setPhase("text");
          setSText(true);
        }
      }, 100);
    }, 1800);

    // At 4.2s → fade out
    setTimeout(() => { setFade(true); }, 4200);

    // At 5s → done
    setTimeout(() => { onDone(); }, 5000);

    return () => { clearInterval(runInt); clearInterval(moveInt); };
  }, []);

  const frames = phase === "slash" ? slashFrames : runFrames;

  return (
    <div className={`intro-screen${fadeOut ? " fade-out" : ""}`}>
      {/* Scanline grid */}
      <div className="intro-grid" />

      {/* Corner decorations */}
      <div className="intro-corner tl-c">┌──</div>
      <div className="intro-corner tr-c">──┐</div>
      <div className="intro-corner bl-c">└──</div>
      <div className="intro-corner br-c">──┘</div>

      {/* Running character */}
      <div className="char-wrap" style={{ left: `${posX}%` }}>
        <pre className="char-ascii">{frames[charFrame % frames.length]}</pre>
        {phase === "slash" && (
          <div className="slash-effect">
            {["╱","╲","╱","╲","─"].map((s,i) => (
              <span key={i} style={{ animationDelay: `${i * 0.06}s` }}>{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Speed lines when running */}
      {phase === "run" && (
        <div className="speed-lines">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="speed-line"
              style={{ top: `${30 + i * 5}%`, width: `${40 + i * 8}px`, left: `${posX - 12 + (i % 3) * 3}%`, opacity: 0.4 - i * 0.03 }} />
          ))}
        </div>
      )}

      {/* Main text reveal */}
      {showText && (
        <div className="intro-text-wrap">
          <div className="intro-logo">ANAM BACTIAR</div>
          <div className="intro-sub">IP INTELLIGENCE TERMINAL</div>
          <div className="intro-ver">v2.0 — Initializing...</div>
          <div className="intro-bar">
            <div className="intro-bar-fill" />
          </div>
        </div>
      )}

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className="particle"
          style={{
            left: `${10 + i * 8}%`,
            animationDelay: `${i * 0.18}s`,
            animationDuration: `${2 + (i % 3) * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════
   MAIN PAGE
   ════════════════════════ */
export default function Page() {
  const [showIntro, setShowIntro] = useState(true);
  const [ip, setIp]               = useState("");
  const [loading, setLoad]         = useState(false);
  const [ipData, setIpData]        = useState(null);
  const [agData, setAgData]        = useState(null);
  const [error, setError]          = useState(null);
  const [history, setHist]         = useState([]);
  const [booted, setBoot]          = useState(false);
  const inputRef                   = useRef(null);

  const pushHist = useCallback((type, text) => setHist(h => [...h, { type, text }]), []);

  // Boot after intro
  useEffect(() => {
    if (!showIntro) {
      const lines = [
        { t: 100,  text: "System ready. Type IP address or press ⌖ ME to detect yours." },
        { t: 600,  text: "Modules loaded: [geo] [dns] [isp] [ua] [security]" },
      ];
      lines.forEach(({ t, text }) => setTimeout(() => pushHist("sys", text), t));
      setTimeout(() => setBoot(true), 700);
    }
  }, [showIntro, pushHist]);

  const doLookup = useCallback(async (target) => {
    const q = (target ?? ip).trim();
    if (!q) return;
    pushHist("cmd", `lookup ${q}`);
    setLoad(true); setIpData(null); setError(null);
    try {
      const res  = await fetch(`/api/lookup?ip=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "IP tidak valid.");
        pushHist("err", data.error || "IP tidak valid.");
      } else {
        setIpData(data);
        pushHist("ok", `Resolved → ${data.ip} | ${[data.city, data.country].filter(Boolean).join(", ")}`);
      }
    } catch (e) {
      setError("Server error: " + e.message);
      pushHist("err", e.message);
    }
    setLoad(false);
  }, [ip, pushHist]);

  const doMyIp = useCallback(async () => {
    pushHist("cmd", "whoami --self");
    setLoad(true); setIpData(null); setError(null);
    try {
      const [agRes, ipRes] = await Promise.all([
        fetch("/api/myagent"),
        fetch("/api/lookup?ip="),
      ]);
      const ag  = await agRes.json();
      const ipd = await ipRes.json();
      setAgData(ag);
      if (ipd.ok) {
        setIpData(ipd);
        setIp(ipd.ip);
        pushHist("ok", `Your IP: ${ipd.ip} | ${ag.device} | ${ag.browser}`);
      } else {
        setError(ipd.error);
        pushHist("err", ipd.error);
      }
    } catch (e) { setError(e.message); pushHist("err", e.message); }
    setLoad(false);
  }, [pushHist]);

  const onKey = (e) => {
    if (e.key === "Enter" && ip.trim()) doLookup();
  };

  const d     = ipData;
  const flag  = d ? countryFlag(d.countryCode) : "";
  const isVpn = d?.proxy || d?.hosting;

  if (showIntro) return <IntroScreen onDone={() => setShowIntro(false)} />;

  return (
    <div className="root" style={{ animation: "fadeInMain .6s ease" }}>

      {/* ── HEADER ── */}
      <header className="brand-wrap">
        <div>
          <div className="brand-anim">
            <div className="brand-text" data-text="ANAM BACTIAR">ANAM BACTIAR</div>
          </div>
          <div className="brand-sub">IP Intelligence Terminal</div>
        </div>
        <div className="term-pill">ONLINE</div>
      </header>

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-ey">// ip_tracer.sh — root@ancip</div>
        <h1 className="hero-h">Trace <span>Any IP</span> Like a Pro.</h1>
        <p className="hero-d">Terminal geolocation — deteksi lokasi, ISP, perangkat, user agent, dan koordinat dari IP manapun.</p>
      </div>

      {/* ── TERMINAL WINDOW ── */}
      <div className="terminal">

        {/* Title bar */}
        <div className="term-bar">
          <div className="tl tl-r"/><div className="tl tl-y"/><div className="tl tl-g"/>
          <div className="term-title">ancip — bash — 80×24</div>
          <div className="term-status"><div className="status-live"/>LIVE</div>
        </div>

        <div className="term-body">

          {/* Boot history */}
          {history.map((h, i) => (
            <div key={i} style={{ marginBottom: 2, fontSize: "0.78rem" }}>
              {h.type === "sys" && <span style={{ color: "#8899cc" }}>{"[sys]"} <span style={{ color: "#c9d1e0" }}>{h.text}</span></span>}
              {h.type === "cmd" && <span style={{ color: "#ffd700" }}>$ <span style={{ color: "#ffe066" }}>{h.text}</span></span>}
              {h.type === "ok"  && <span style={{ color: "#00ff88" }}>✓ <span style={{ color: "#ccffe8" }}>{h.text}</span></span>}
              {h.type === "err" && <span style={{ color: "#ff4455" }}>✗ <span style={{ color: "#ffaaaa" }}>{h.text}</span></span>}
            </div>
          ))}

          {booted && <hr className="term-div" />}

          {/* Input prompt */}
          {booted && (
            <div className="prompt-line" style={{ flexWrap: "wrap" }}>
              <span className="prompt-user">anam</span>
              <span className="prompt-at">@</span>
              <span className="prompt-host">ancip</span>
              <span className="prompt-path"> ~/ip</span>
              <span className="prompt-sym">›</span>
              <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  ref={inputRef}
                  className="term-input"
                  type="text"
                  placeholder="ketik IP (contoh: 8.8.8.8) lalu Enter..."
                  value={ip}
                  onChange={e => { setIp(e.target.value); setError(null); }}
                  onKeyDown={onKey}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="run-btn" onClick={() => doLookup()} disabled={!ip.trim() || loading}>
                  {loading ? "..." : "▶ RUN"}
                </button>
                <button className="run-btn run-btn-yellow" onClick={doMyIp} disabled={loading}>
                  ⌖ MY IP
                </button>
              </div>
            </div>
          )}

          {loading && (
            <>
              <div style={{ color: "#8899cc", marginTop: 8, fontSize: "0.78rem" }}>
                <span className="loading-dots">Resolving</span>
              </div>
              <div className="prog-bar"><div className="prog-fill" /></div>
            </>
          )}

          {error && <div className="out-err" style={{ marginTop: 10 }}>{error}</div>}

          {/* ── IP OUTPUT ── */}
          {d && (
            <>
              <hr className="term-div" />
              <div className="map-vis">
                <div className="mg" /><div className="ms" />
                <div className="mpin">
                  <div className="mpin-ring" /><div className="mpin-ring" style={{ animationDelay: ".7s" }} />
                  <div className="mpin-dot" />
                </div>
                {d.lat && d.lon && <div className="mcoords">{Number(d.lat).toFixed(4)}, {Number(d.lon).toFixed(4)}</div>}
                <div className="mcity">{flag} {[d.city, d.country].filter(Boolean).join(", ")}</div>
              </div>

              <div className="out-section">
                <div className="out-header">IP Information</div>
                <OutLine label="ip_address"   val={d.ip}          color="green" copy />
                <OutLine label="ip_type"      val={d.type}        color="cyan" />
                <OutLine label="status"       val={isVpn ? "⚠ VPN / PROXY / HOSTING DETECTED" : "✓ CLEAN — No proxy detected"} color={isVpn ? "red" : "green"} />
              </div>

              <div className="out-section">
                <div className="out-header">Geolocation</div>
                <OutLine label="country"      val={d.country ? `${flag} ${d.country}` : null} color="yellow" />
                <OutLine label="country_code" val={d.countryCode} copy />
                <OutLine label="region"       val={d.region} />
                <OutLine label="city"         val={d.city} />
                <OutLine label="postal_code"  val={d.zip} />
                <OutLine label="latitude"     val={d.lat}  color="cyan" />
                <OutLine label="longitude"    val={d.lon}  color="cyan" />
                <OutLine label="timezone"     val={d.timezone} />
              </div>

              <div className="out-section">
                <div className="out-header">Network</div>
                <OutLine label="isp"          val={d.isp}  color="yellow" copy />
                <OutLine label="organization" val={d.org !== d.isp ? d.org : null} />
                <OutLine label="asn"          val={d.asn}  color="cyan" copy />
                <OutLine label="data_source"  val={d.source} />
              </div>
            </>
          )}

          {/* ── UA OUTPUT ── */}
          {agData && (
            <>
              <hr className="term-div" />
              <div className="out-section">
                <div className="out-header">Your Device</div>
                <OutLine label="client_ip"    val={agData.clientIp} color="green" copy />
                <OutLine label="device"       val={agData.device}   color="yellow" />
                <OutLine label="os"           val={agData.os}       color="cyan" />
                <OutLine label="browser"      val={agData.browser}  color="cyan" />
                <OutLine label="device_type"  val={agData.isMobile ? "📱 Mobile / Smartphone" : "🖥  Desktop / Laptop"} />
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "0.56rem", letterSpacing: "0.16em", color: "var(--text3)", textTransform: "uppercase", marginBottom: 6 }}>raw_user_agent</div>
                  <div className="ua-raw">{agData.ua}</div>
                </div>
              </div>
            </>
          )}

          {booted && !loading && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--text3)", fontSize: "0.68rem" }}>// awaiting input</span>
              <span className="prompt-cursor" />
            </div>
          )}
        </div>
      </div>

      <footer className="ftr">
        <div className="ft">Powered by ipwho.is · ipapi.co · ip.guide<br/><span style={{ color: "var(--text3)" }}>No API key · Server-side proxy · HTTPS ✓</span></div>
        <div className="ft" style={{ textAlign: "right" }}>By <a href="https://github.com/bactiar291" target="_blank" rel="noopener noreferrer">Anam Bactiar</a></div>
      </footer>
    </div>
  );
}
