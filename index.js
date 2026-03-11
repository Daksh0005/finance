import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";

/* ─────────────── THEME ─────────────── */
const G = {
  darkest: "#0a1f14",
  dark: "#1a3a2a",
  mid: "#2d6a4f",
  accent: "#52b788",
  light: "#74c69d",
  pale: "#b7e4c7",
  bg: "#f0f7f4",
  white: "#ffffff",
  warn: "#e63946",
  gold: "#f4a261",
};

/* ─────────────── FONT INJECT ─────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:wght@300;400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: ${G.bg}; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${G.bg}; }
    ::-webkit-scrollbar-thumb { background: ${G.accent}; border-radius: 4px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
    @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
    .fade-up { animation: fadeUp 0.5s ease forwards; }
    .pulse { animation: pulse 1.5s infinite; }
    .spin { animation: spin 1s linear infinite; }
  `}</style>
);

/* ─────────────── NAV PAGES ─────────────── */
const PAGES = ["Dashboard", "Trade", "AI Advisor", "Simulator", "Portfolio", "SIP Planner"];
const PAGE_ICONS = ["📊", "⚡", "🤖", "🎮", "💼", "📅"];

/* ─────────────── FUND DATA ─────────────── */
const FUNDS = [
  { name: "Monarch Flexi Cap", nav: 48.72, change: +2.3, category: "Equity", risk: "Moderate", returns1y: 18.4, returns3y: 14.2 },
  { name: "Monarch Debt Shield", nav: 21.15, change: +0.3, category: "Debt", risk: "Low", returns1y: 7.1, returns3y: 7.8 },
  { name: "Monarch Mid Cap Growth", nav: 87.44, change: +3.8, category: "Equity", risk: "High", returns1y: 28.6, returns3y: 22.1 },
  { name: "Monarch Liquid Fund", nav: 10.08, change: +0.05, category: "Liquid", risk: "Very Low", returns1y: 6.8, returns3y: 6.5 },
];

const generateChartData = (base, trend, noise) =>
  Array.from({ length: 24 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i % 12] + (i > 11 ? "'25" : "'24"),
    value: Math.round(base + trend * i + (Math.random() - 0.5) * noise),
  }));

const PORTFOLIO_DATA = generateChartData(100000, 3800, 8000);
const MARKET_SCENARIOS = {
  "Bull Run 🐂": { multiplier: 1.18, color: G.accent },
  "Bear Market 🐻": { multiplier: 0.88, color: G.warn },
  "Sideways 📊": { multiplier: 1.04, color: G.gold },
  "Flash Crash ⚡": { multiplier: 0.72, color: "#ff6b6b" },
};

/* ─────────────── HELPERS ─────────────── */
const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n) => new Intl.NumberFormat("en-IN").format(n);

/* ─────────────── CLAUDE API ─────────────── */
async function askClaude(messages, language = "English") {
  const systemPrompt = `You are Monarch AI, a friendly and expert financial advisor for Indian investors. 
Respond in ${language} language (if not English, mix with some English financial terms). 
Keep responses concise (2-4 sentences). Be warm, clear, and SEBI-compliant. 
Never give specific stock tips. Always encourage long-term investing.
Use Indian context: mention SIPs, mutual funds, NAV, SEBI, RBI where relevant.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "I'm having trouble connecting. Please try again.";
}

/* ─────────────── COMPONENTS ─────────────── */

function Btn({ children, onClick, variant = "primary", style = {}, disabled = false }) {
  const base = {
    padding: "10px 20px", borderRadius: 10, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
    transition: "all 0.2s", opacity: disabled ? 0.5 : 1, ...style,
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${G.mid}, ${G.accent})`, color: "#fff", boxShadow: `0 4px 15px ${G.accent}44` },
    outline: { background: "transparent", color: G.mid, border: `2px solid ${G.mid}` },
    danger: { background: G.warn, color: "#fff" },
    ghost: { background: "rgba(82,183,136,0.12)", color: G.mid },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: G.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 20px rgba(26,58,42,0.08)", ...style }}>
      {children}
    </div>
  );
}

function Badge({ text, color = G.accent }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700,
    }}>{text}</span>
  );
}

/* ════════════════════════════════════════
   PAGE 1 — DASHBOARD
════════════════════════════════════════ */
function Dashboard({ setPage }) {
  const stats = [
    { label: "Portfolio Value", value: "₹4,82,310", change: "+₹38,240", up: true, icon: "💰" },
    { label: "Today's Gain", value: "₹2,184", change: "+0.45%", up: true, icon: "📈" },
    { label: "Active SIPs", value: "3", change: "₹15,000/mo", up: true, icon: "🔄" },
    { label: "XIRR Returns", value: "16.8%", change: "vs 7.1% FD", up: true, icon: "🎯" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${G.darkest} 0%, ${G.dark} 50%, ${G.mid} 100%)`,
        borderRadius: 20, padding: "28px 28px 24px", marginBottom: 20, position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `${G.accent}18` }} />
        <div style={{ position: "absolute", bottom: -30, right: 80, width: 100, height: 100, borderRadius: "50%", background: `${G.light}10` }} />
        <div style={{ color: G.pale, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Good morning, Ravi 👋</div>
        <div style={{ color: "#fff", fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>₹4,82,310</div>
        <div style={{ color: G.accent, fontSize: 13, fontWeight: 500, marginBottom: 20 }}>↑ ₹38,240 this month (+8.6%)</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => setPage("Trade")} style={{ padding: "8px 16px", fontSize: 12 }}>+ Invest Now</Btn>
          <Btn variant="ghost" onClick={() => setPage("Portfolio")} style={{ padding: "8px 16px", fontSize: 12, background: "rgba(255,255,255,0.1)", color: "#fff" }}>View Portfolio</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: G.dark, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.up ? G.accent : G.warn, marginTop: 2, fontWeight: 600 }}>{s.change}</div>
              </div>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Mini chart */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: G.dark, fontSize: 14 }}>Portfolio Growth</div>
          <Badge text="24 months" color={G.mid} />
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={PORTFOLIO_DATA}>
            <defs>
              <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={G.accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={G.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={G.accent} strokeWidth={2.5} fill="url(#pgGrad)" dot={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#aaa" }} tickLine={false} axisLine={false} interval={5} />
            <Tooltip formatter={(v) => [fmt(v), "Value"]} contentStyle={{ background: G.dark, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Quick actions */}
      <div style={{ fontWeight: 700, color: G.dark, marginBottom: 12, fontSize: 14 }}>Quick Actions</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { icon: "🤖", label: "Ask AI", page: "AI Advisor" },
          { icon: "🎮", label: "Simulate", page: "Simulator" },
          { icon: "📅", label: "Plan SIP", page: "SIP Planner" },
        ].map((a) => (
          <Card key={a.label} style={{ padding: 14, textAlign: "center", cursor: "pointer", transition: "transform 0.2s" }}
            onClick={() => setPage(a.page)}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: G.mid }}>{a.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE 2 — KYC
════════════════════════════════════════ */
function KYC() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", pan: "", aadhaar: "", phone: "", otp: "" });
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const steps = ["Personal Info", "PAN / Aadhaar", "Liveness Check", "OTP Verify", "Done 🎉"];

  const simulateScan = (field) => {
    setScanning(true);
    setError("");
    setTimeout(() => {
      setScanning(false);
      if (field === "pan") setForm((f) => ({ ...f, pan: "ABCDE1234F" }));
      if (field === "aadhaar") setForm((f) => ({ ...f, aadhaar: "9876 5432 1098" }));
    }, 2000);
  };

  const sendOTP = () => {
    if (!form.phone || form.phone.length < 10) { setError("Enter a valid 10-digit number"); return; }
    setOtpSent(true); setOtpTimer(30); setError("");
    const t = setInterval(() => setOtpTimer((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
  };

  const next = () => {
    setError("");
    if (step === 0 && !form.name) { setError("Please enter your full name"); return; }
    if (step === 1 && (!form.pan || !form.aadhaar)) { setError("Scan or enter both PAN and Aadhaar"); return; }
    if (step === 3 && form.otp !== "1234") { setError("Wrong OTP. Try 1234 for demo"); return; }
    if (step === 3) { setDone(true); return; }
    setStep((s) => s + 1);
  };

  if (done) return (
    <div style={{ textAlign: "center", padding: "60px 20px", animation: "fadeUp 0.5s ease" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: G.dark, fontWeight: 700, marginBottom: 8 }}>KYC Complete!</div>
      <div style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>Your account is now active. Start your first SIP in minutes.</div>
      <Btn>Start Investing Now</Btn>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      {/* Header */}
      <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${G.dark}, ${G.mid})`, color: "#fff" }}>
        <div style={{ fontSize: 12, color: G.pale, marginBottom: 4 }}>Zero Drop-Off KYC</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>Verify in 3 Minutes ⚡</div>
        <div style={{ fontSize: 11, color: G.pale, marginTop: 4 }}>Traditional banks take 46 hours. We do it in 180 seconds.</div>
      </Card>

      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, alignItems: "center" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
              background: i < step ? G.accent : i === step ? G.mid : "#e0e0e0",
              color: i <= step ? "#fff" : "#aaa",
              transition: "all 0.3s"
            }}>{i < step ? "✓" : i + 1}</div>
            <div style={{ fontSize: 8, color: i === step ? G.mid : "#aaa", fontWeight: i === step ? 700 : 400, textAlign: "center" }}>{s}</div>
          </div>
        ))}
      </div>

      <Card>
        {error && <div style={{ background: "#ffeaea", border: `1px solid ${G.warn}`, borderRadius: 8, padding: "8px 12px", color: G.warn, fontSize: 12, marginBottom: 14 }}>⚠️ {error}</div>}

        {step === 0 && (
          <div style={{ animation: "slideIn 0.4s ease" }}>
            <div style={{ fontWeight: 700, color: G.dark, marginBottom: 16, fontSize: 16 }}>👤 Personal Details</div>
            {[["Full Name", "name", "Ravi Kumar"], ["Email", "email", "ravi@example.com"]].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6, fontWeight: 600 }}>{label}</div>
                <input value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={ph}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid #e0e0e0`, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border 0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = G.accent}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: "slideIn 0.4s ease" }}>
            <div style={{ fontWeight: 700, color: G.dark, marginBottom: 16, fontSize: 16 }}>🪪 PAN & Aadhaar</div>
            {[["PAN Card", "pan", "ABCDE1234F"], ["Aadhaar Number", "aadhaar", "9876 5432 1098"]].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6, fontWeight: 600 }}>{label}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={ph}
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1.5px solid #e0e0e0`, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", letterSpacing: key === "pan" ? 1 : 0 }}
                  />
                  <button onClick={() => simulateScan(key)} disabled={scanning}
                    style={{ background: G.bg, border: `1.5px solid ${G.accent}`, borderRadius: 10, padding: "0 14px", cursor: "pointer", fontSize: 18 }}>
                    {scanning ? <span className="spin" style={{ display: "inline-block" }}>⟳</span> : "📷"}
                  </button>
                </div>
                {scanning && <div style={{ fontSize: 10, color: G.accent, marginTop: 4, animation: "pulse 1s infinite" }}>Scanning document…</div>}
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "slideIn 0.4s ease", textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: G.dark, marginBottom: 8, fontSize: 16 }}>🛡️ Liveness Check</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>AI-powered deepfake detection</div>
            <div style={{
              width: 160, height: 160, borderRadius: "50%", margin: "0 auto 20px",
              background: `linear-gradient(135deg, ${G.dark}, ${G.mid})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `4px solid ${G.accent}`,
              boxShadow: `0 0 0 8px ${G.accent}22, 0 0 0 16px ${G.accent}11`,
              fontSize: 60
            }}>🤳</div>
            <LivenessCheck onComplete={() => setStep(3)} />
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "slideIn 0.4s ease" }}>
            <div style={{ fontWeight: 700, color: G.dark, marginBottom: 8, fontSize: 16 }}>📱 Verify Phone</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>We'll send a 4-digit OTP to your number</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210" maxLength={10}
                style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1.5px solid #e0e0e0`, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              <button onClick={sendOTP} disabled={otpTimer > 0}
                style={{ background: G.mid, color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", cursor: otpTimer > 0 ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, opacity: otpTimer > 0 ? 0.6 : 1 }}>
                {otpTimer > 0 ? `${otpTimer}s` : "Send OTP"}
              </button>
            </div>
            {otpSent && (
              <div>
                <div style={{ fontSize: 11, color: G.accent, marginBottom: 10 }}>✅ OTP sent! (Demo: use 1234)</div>
                <input value={form.otp} onChange={(e) => setForm((f) => ({ ...f, otp: e.target.value }))}
                  placeholder="Enter 4-digit OTP" maxLength={4}
                  style={{ width: "100%", padding: "14px", borderRadius: 10, border: `2px solid ${G.accent}`, fontSize: 20, textAlign: "center", letterSpacing: 8, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
          {step > 0 && <Btn variant="outline" onClick={() => setStep((s) => s - 1)}>← Back</Btn>}
          <Btn onClick={next} style={{ marginLeft: "auto" }}>
            {step === steps.length - 2 ? "Complete KYC ✓" : "Continue →"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

function LivenessCheck({ onComplete }) {
  const [phase, setPhase] = useState(0);
  const prompts = ["Look straight at camera", "Turn head slightly left", "Blink twice", "Smile naturally", "✅ Verified!"];
  useEffect(() => {
    if (phase < prompts.length - 1) {
      const t = setTimeout(() => setPhase((p) => p + 1), 1500);
      return () => clearTimeout(t);
    } else {
      setTimeout(onComplete, 800);
    }
  }, [phase]);
  return (
    <div>
      <div style={{ fontSize: 13, color: phase === prompts.length - 1 ? G.accent : G.dark, fontWeight: 600, marginBottom: 12, transition: "color 0.3s" }}>
        {prompts[phase]}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {prompts.slice(0, -1).map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= phase ? G.accent : "#e0e0e0", transition: "background 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE 3 — AI ADVISOR (REAL CHAT)
════════════════════════════════════════ */
function AIAdvisor() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Namaste! 🙏 I'm Monarch AI, your personal wealth advisor. Ask me anything about your investments, SIPs, or market conditions — in English, Hindi, Bengali, or Tamil!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("English");
  const bottomRef = useRef(null);
  const langs = ["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi"];
  const quickQ = ["Why is my fund down?", "Should I increase my SIP?", "Best fund for 5 years?", "How to save tax?"];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    const updated = [...messages, { role: "user", content: msg }];
    setMessages(updated);
    setLoading(true);
    try {
      const apiMsgs = updated.map((m) => ({ role: m.role, content: m.content }));
      const reply = await askClaude(apiMsgs, language);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  }, [input, messages, language]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", animation: "fadeUp 0.5s ease" }}>
      {/* Header */}
      <Card style={{ marginBottom: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${G.mid}, ${G.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, color: G.dark, fontSize: 14 }}>Monarch AI Advisor</div>
              <div style={{ fontSize: 10, color: G.accent }}>● Online · SEBI Compliant</div>
            </div>
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${G.accent}`, fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: G.mid, background: G.bg, fontWeight: 600, outline: "none" }}>
            {langs.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </Card>

      {/* Quick questions */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
        {quickQ.map((q) => (
          <button key={q} onClick={() => send(q)}
            style={{ whiteSpace: "nowrap", padding: "6px 12px", borderRadius: 20, background: G.white, border: `1.5px solid ${G.pale}`, fontSize: 11, cursor: "pointer", color: G.mid, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, flexShrink: 0 }}>
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12, animation: "fadeUp 0.3s ease" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${G.mid}, ${G.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>🤖</div>
            )}
            <div style={{
              maxWidth: "78%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? `linear-gradient(135deg, ${G.mid}, ${G.accent})` : G.white,
              color: m.role === "user" ? "#fff" : G.dark,
              fontSize: 13, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${G.mid}, ${G.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
            <div style={{ background: G.white, padding: "12px 16px", borderRadius: "18px 18px 18px 4px", display: "flex", gap: 4, alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: G.accent, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          placeholder={`Ask in ${language}…`}
          style={{ flex: 1, padding: "14px 16px", borderRadius: 14, border: `2px solid ${G.pale}`, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", background: G.white, transition: "border 0.2s" }}
          onFocus={(e) => e.target.style.borderColor = G.accent}
          onBlur={(e) => e.target.style.borderColor = G.pale}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${G.mid}, ${G.accent})`, border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() ? 0.5 : 1 }}>
          ➤
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE 4 — SIMULATOR
════════════════════════════════════════ */
function Simulator() {
  const [scenario, setScenario] = useState("Bull Run 🐂");
  const [investment, setInvestment] = useState(100000);
  const [years, setYears] = useState(5);

  const sc = MARKET_SCENARIOS[scenario];
  const annualReturn = sc.multiplier;
  const finalValue = investment * Math.pow(annualReturn, years);
  const gain = finalValue - investment;

  const chartData = Array.from({ length: years * 12 + 1 }, (_, i) => ({
    month: i,
    value: Math.round(investment * Math.pow(annualReturn, i / 12) + (Math.random() - 0.5) * investment * 0.02),
  }));

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${G.dark}, ${G.mid})`, color: "#fff" }}>
        <div style={{ fontSize: 12, color: G.pale, marginBottom: 4 }}>🎮 Gamified Market Simulator</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>Simulate Before You Invest</div>
        <div style={{ fontSize: 11, color: G.pale, marginTop: 4 }}>Test your portfolio in different market conditions.</div>
      </Card>

      {/* Scenario picker */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: G.dark, marginBottom: 8 }}>Choose Market Scenario</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(MARKET_SCENARIOS).map(([name, s]) => (
            <div key={name} onClick={() => setScenario(name)}
              style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", border: `2px solid ${scenario === name ? s.color : "#e0e0e0"}`, background: scenario === name ? s.color + "15" : G.white, transition: "all 0.2s" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: scenario === name ? s.color : G.dark }}>{name}</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{((s.multiplier - 1) * 100).toFixed(0)}% annual return</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: G.dark }}>Investment Amount</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: G.mid }}>{fmt(investment)}</span>
          </div>
          <input type="range" min={10000} max={1000000} step={10000} value={investment}
            onChange={(e) => setInvestment(+e.target.value)}
            style={{ width: "100%", accentColor: G.accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa" }}>
            <span>₹10K</span><span>₹10L</span>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: G.dark }}>Investment Horizon</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: G.mid }}>{years} years</span>
          </div>
          <input type="range" min={1} max={20} step={1} value={years}
            onChange={(e) => setYears(+e.target.value)}
            style={{ width: "100%", accentColor: G.accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa" }}>
            <span>1yr</span><span>20yr</span>
          </div>
        </div>
      </Card>

      {/* Result */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <Card style={{ textAlign: "center", background: `linear-gradient(135deg, ${G.dark}, ${G.mid})`, color: "#fff" }}>
          <div style={{ fontSize: 10, color: G.pale, marginBottom: 4 }}>Final Value</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>{fmt(Math.round(finalValue))}</div>
        </Card>
        <Card style={{ textAlign: "center", background: gain >= 0 ? `${G.accent}15` : `${G.warn}15`, border: `2px solid ${gain >= 0 ? G.accent : G.warn}` }}>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Total Gain/Loss</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: gain >= 0 ? G.mid : G.warn }}>
            {gain >= 0 ? "+" : ""}{fmt(Math.round(gain))}
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <div style={{ fontWeight: 700, color: G.dark, marginBottom: 12, fontSize: 13 }}>
          Projected Growth — <span style={{ color: sc.color }}>{scenario}</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sc.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={sc.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <Area type="monotone" dataKey="value" stroke={sc.color} strokeWidth={2.5} fill="url(#simGrad)" dot={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#aaa" }} tickLine={false} axisLine={false} tickFormatter={(v) => v % 12 === 0 ? `Y${v / 12}` : ""} />
            <Tooltip formatter={(v) => [fmt(v), "Portfolio"]} contentStyle={{ background: G.dark, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE 5 — PORTFOLIO
════════════════════════════════════════ */
function Portfolio() {
  const [selected, setSelected] = useState(null);
  const total = 482310;
  const alloc = [
    { name: "Equity", pct: 62, value: 299032, color: G.accent },
    { name: "Debt", pct: 22, value: 106108, color: G.gold },
    { name: "Liquid", pct: 10, value: 48231, color: G.light },
    { name: "Gold", pct: 6, value: 28939, color: "#f4c261" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${G.dark}, ${G.mid})`, color: "#fff", padding: "20px 20px" }}>
        <div style={{ fontSize: 11, color: G.pale }}>Total Portfolio Value</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, marginBottom: 4 }}>₹4,82,310</div>
        <div style={{ color: G.accent, fontSize: 12, fontWeight: 600 }}>↑ ₹38,240 (+8.6%) all time</div>
      </Card>

      {/* Allocation bar */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: G.dark, marginBottom: 12, fontSize: 13 }}>Asset Allocation</div>
        <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 14, marginBottom: 12 }}>
          {alloc.map((a) => <div key={a.name} style={{ width: `${a.pct}%`, background: a.color, transition: "width 0.5s" }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {alloc.map((a) => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: a.color, flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: G.dark }}>{a.name}</span>
                <span style={{ fontSize: 10, color: "#888", marginLeft: 6 }}>{a.pct}% · {fmt(a.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Funds */}
      <div style={{ fontWeight: 700, color: G.dark, marginBottom: 10, fontSize: 13 }}>Your Funds</div>
      {FUNDS.map((fund) => (
        <Card key={fund.name} style={{ marginBottom: 10, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", border: selected === fund.name ? `2px solid ${G.accent}` : "2px solid transparent" }}
          onClick={() => setSelected(selected === fund.name ? null : fund.name)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: G.dark, fontSize: 13, marginBottom: 4 }}>{fund.name}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <Badge text={fund.category} color={G.mid} />
                <Badge text={fund.risk} color={fund.risk === "High" ? G.warn : fund.risk === "Low" ? G.accent : G.gold} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: G.dark }}>₹{fund.nav}</div>
              <div style={{ fontSize: 11, color: fund.change > 0 ? G.accent : G.warn, fontWeight: 600 }}>{fund.change > 0 ? "+" : ""}{fund.change}%</div>
            </div>
          </div>
          {selected === fund.name && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${G.bg}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, animation: "fadeUp 0.3s ease" }}>
              <div style={{ background: G.bg, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#888" }}>1 Year Returns</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.mid, fontFamily: "'Cormorant Garamond', serif" }}>{fund.returns1y}%</div>
              </div>
              <div style={{ background: G.bg, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#888" }}>3 Year Returns</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.mid, fontFamily: "'Cormorant Garamond', serif" }}>{fund.returns3y}%</div>
              </div>
              <Btn style={{ gridColumn: "span 2", padding: "10px" }}>Start SIP in this Fund</Btn>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE 6 — SIP PLANNER
════════════════════════════════════════ */
function SIPPlanner() {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [tenure, setTenure] = useState(10);
  const [step, setStep] = useState(0);

  const months = tenure * 12;
  const r = rate / 100 / 12;
  const fv = monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  const invested = monthly * months;
  const gains = fv - invested;

  const chartData = Array.from({ length: months + 1 }, (_, i) => {
    const val = monthly * ((Math.pow(1 + r, i) - 1) / r) * (1 + r);
    return { month: i, invested: monthly * i, value: Math.round(val) };
  }).filter((_, i) => i % 6 === 0);

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${G.dark}, ${G.mid})`, color: "#fff" }}>
        <div style={{ fontSize: 11, color: G.pale, marginBottom: 4 }}>📅 SIP Planner</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>Build Wealth Systematically</div>
        <div style={{ fontSize: 11, color: G.pale, marginTop: 4 }}>Small, consistent investments create extraordinary wealth.</div>
      </Card>

      {/* Controls */}
      <Card style={{ marginBottom: 16 }}>
        {[
          { label: "Monthly SIP", value: monthly, set: setMonthly, min: 500, max: 100000, step: 500, fmt: (v) => fmt(v) },
          { label: "Expected Returns (p.a.)", value: rate, set: setRate, min: 4, max: 25, step: 0.5, fmt: (v) => `${v}%` },
          { label: "Investment Period", value: tenure, set: setTenure, min: 1, max: 30, step: 1, fmt: (v) => `${v} years` },
        ].map((c) => (
          <div key={c.label} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: G.dark }}>{c.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: G.mid }}>{c.fmt(c.value)}</span>
            </div>
            <input type="range" min={c.min} max={c.max} step={c.step} value={c.value}
              onChange={(e) => c.set(+e.target.value)}
              style={{ width: "100%", accentColor: G.accent }} />
          </div>
        ))}
      </Card>

      {/* Results */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "You Invest", value: fmt(invested), color: G.dark },
          { label: "Wealth Gained", value: fmt(Math.round(gains)), color: G.accent },
          { label: "Final Corpus", value: fmt(Math.round(fv)), color: G.mid },
        ].map((r) => (
          <Card key={r.label} style={{ textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: G.dark, marginBottom: 12, fontSize: 13 }}>Growth Projection</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={G.accent} stopOpacity={0.35} />
                <stop offset="95%" stopColor={G.accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={G.gold} stopOpacity={0.25} />
                <stop offset="95%" stopColor={G.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <Area type="monotone" dataKey="value" stroke={G.accent} strokeWidth={2.5} fill="url(#sipGrad)" dot={false} name="Corpus" />
            <Area type="monotone" dataKey="invested" stroke={G.gold} strokeWidth={1.5} fill="url(#invGrad)" dot={false} name="Invested" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#aaa" }} tickLine={false} axisLine={false} tickFormatter={(v) => v % 24 === 0 ? `Y${v / 12}` : ""} />
            <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ background: G.dark, border: "none", borderRadius: 8, color: "#fff", fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Btn style={{ width: "100%", padding: 14, fontSize: 14 }}>🚀 Start This SIP Now</Btn>
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE — TRADE (BUY / SELL + AI REC)
════════════════════════════════════════ */

const TRADE_FUNDS = [
  { id: 1, name: "Monarch Flexi Cap", nav: 48.72, change: +2.3, category: "Equity", risk: "Moderate", returns1y: 18.4, returns3y: 14.2, held: 120, sentiment: "bullish" },
  { id: 2, name: "Monarch Debt Shield", nav: 21.15, change: +0.3, category: "Debt", risk: "Low", returns1y: 7.1, returns3y: 7.8, held: 200, sentiment: "neutral" },
  { id: 3, name: "Monarch Mid Cap Growth", nav: 87.44, change: +3.8, category: "Equity", risk: "High", returns1y: 28.6, returns3y: 22.1, held: 45, sentiment: "bullish" },
  { id: 4, name: "Monarch Liquid Fund", nav: 10.08, change: +0.05, category: "Liquid", risk: "Very Low", returns1y: 6.8, returns3y: 6.5, held: 500, sentiment: "neutral" },
  { id: 5, name: "Monarch Small Cap Alpha", nav: 134.50, change: -1.2, category: "Equity", risk: "Very High", returns1y: 34.2, returns3y: 28.5, held: 0, sentiment: "bearish" },
  { id: 6, name: "Monarch ELSS Tax Saver", nav: 62.30, change: +1.1, category: "ELSS", risk: "Moderate", returns1y: 16.8, returns3y: 13.9, held: 80, sentiment: "bullish" },
];

const SENTIMENT_CONFIG = {
  bullish: { label: "Strong Buy", color: "#16a34a", bg: "#dcfce7", icon: "🚀" },
  neutral: { label: "Hold", color: G.gold, bg: "#fef9c3", icon: "⏸️" },
  bearish: { label: "Caution", color: G.warn, bg: "#fee2e2", icon: "⚠️" },
};

async function getTradeRecommendation(fund, action, amount) {
  const prompt = `Fund: ${fund.name}
Category: ${fund.category}, Risk: ${fund.risk}
Current NAV: ₹${fund.nav} (${fund.change > 0 ? "+" : ""}${fund.change}% today)
1Y Returns: ${fund.returns1y}%, 3Y Returns: ${fund.returns3y}%
Units held: ${fund.held}
User wants to: ${action} ₹${amount}

Give a concise 3-point recommendation:
1. Should they ${action} now? (Yes/No/Wait — one word + one sentence why)
2. Risk assessment for this decision (one sentence)
3. Better alternative if any (one sentence)

Be direct, data-driven, SEBI-compliant. Use ✅ ⚠️ 💡 icons for each point.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: "You are Monarch AI, a SEBI-registered robo-advisor. Give sharp, personalized buy/sell recommendations. Always add a disclaimer: 'Investments are subject to market risk.'",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Unable to fetch recommendation.";
}

function TradeModal({ fund, action, onClose, onConfirm }) {
  const [amount, setAmount] = useState(5000);
  const [rec, setRec] = useState("");
  const [loadingRec, setLoadingRec] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const units = (amount / fund.nav).toFixed(3);
  const isSell = action === "SELL";
  const maxSell = Math.floor(fund.held * fund.nav);

  const fetchRec = async () => {
    setLoadingRec(true);
    setRec("");
    const r = await getTradeRecommendation(fund, action, amount);
    setRec(r);
    setLoadingRec(false);
  };

  useEffect(() => { fetchRec(); }, []);

  const handleConfirm = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setConfirmed(true); }, 2000);
  };

  if (confirmed) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
      <div style={{ background: G.white, borderRadius: 20, padding: 32, textAlign: "center", maxWidth: 340, width: "100%", animation: "fadeUp 0.4s ease" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{isSell ? "💸" : "🎉"}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: G.dark, marginBottom: 8 }}>
          Order Placed!
        </div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
          {action} ₹{amount.toLocaleString("en-IN")} in {fund.name}
        </div>
        <div style={{ fontSize: 12, color: G.accent, marginBottom: 24 }}>~{units} units @ ₹{fund.nav} NAV</div>
        <div style={{ background: G.bg, borderRadius: 12, padding: 12, marginBottom: 20, fontSize: 11, color: "#666" }}>
          ✅ Order will be processed at next NAV cut-off (3:00 PM IST)
        </div>
        <Btn onClick={onClose} style={{ width: "100%" }}>Done</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: G.white, borderRadius: "20px 20px 0 0", padding: "24px 20px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", animation: "fadeUp 0.4s ease" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <div style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: isSell ? G.warn + "22" : G.accent + "22", color: isSell ? G.warn : G.mid }}>
                {action}
              </div>
              <Badge text={fund.category} color={G.mid} />
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: G.dark }}>{fund.name}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>NAV ₹{fund.nav} · {fund.change > 0 ? "+" : ""}{fund.change}% today</div>
          </div>
          <button onClick={onClose} style={{ background: G.bg, border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Amount */}
        <div style={{ background: G.bg, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600 }}>
            {isSell ? "Redeem Amount" : "Investment Amount"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: G.dark }}>₹</span>
            <input
              type="number" value={amount}
              onChange={(e) => setAmount(Math.max(100, +e.target.value))}
              style={{ flex: 1, fontSize: 28, fontWeight: 700, color: G.dark, border: "none", background: "transparent", fontFamily: "'Cormorant Garamond', serif", outline: "none" }}
            />
          </div>
          <input type="range"
            min={isSell ? 100 : 500}
            max={isSell ? maxSell : 500000}
            step={isSell ? 100 : 500}
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
            style={{ width: "100%", accentColor: isSell ? G.warn : G.accent, marginBottom: 8 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888" }}>
            <span>~{units} units</span>
            {isSell && <span style={{ color: G.warn }}>Max: {fmt(maxSell)}</span>}
          </div>
          {/* Quick amounts */}
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {[1000, 5000, 10000, 25000, 50000].map((v) => (
              <button key={v} onClick={() => setAmount(v)}
                style={{ padding: "4px 10px", borderRadius: 8, border: `1.5px solid ${amount === v ? (isSell ? G.warn : G.accent) : "#e0e0e0"}`, background: amount === v ? (isSell ? G.warn + "15" : G.accent + "15") : "transparent", fontSize: 11, cursor: "pointer", color: amount === v ? (isSell ? G.warn : G.mid) : "#888", fontWeight: 600 }}>
                ₹{v >= 1000 ? v / 1000 + "K" : v}
              </button>
            ))}
          </div>
        </div>

        {/* AI Recommendation */}
        <div style={{ background: `linear-gradient(135deg, ${G.darkest}, ${G.dark})`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ color: G.accent, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              🤖 AI Recommendation
            </div>
            <button onClick={fetchRec} disabled={loadingRec}
              style={{ background: "rgba(82,183,136,0.2)", border: `1px solid ${G.accent}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 10, color: G.accent, fontFamily: "'DM Sans', sans-serif" }}>
              {loadingRec ? "⟳ Analysing…" : "↻ Refresh"}
            </button>
          </div>
          {loadingRec ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "12px 0" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: G.accent, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
              ))}
              <span style={{ color: G.pale, fontSize: 12, marginLeft: 4 }}>Analysing fund data…</span>
            </div>
          ) : rec ? (
            <div style={{ color: G.pale, fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{rec}</div>
          ) : null}
        </div>

        {/* Confirm */}
        <button onClick={handleConfirm} disabled={processing}
          style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none", cursor: "pointer",
            background: processing ? "#ccc" : isSell ? `linear-gradient(135deg, ${G.warn}, #ff6b6b)` : `linear-gradient(135deg, ${G.mid}, ${G.accent})`,
            color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
            boxShadow: processing ? "none" : `0 6px 20px ${isSell ? G.warn : G.accent}55`,
            transition: "all 0.3s"
          }}>
          {processing ? "⟳ Processing Order…" : `Confirm ${action} · ₹${amount.toLocaleString("en-IN")}`}
        </button>
        <div style={{ textAlign: "center", fontSize: 10, color: "#aaa", marginTop: 10 }}>
          Investments are subject to market risk. Read all scheme documents carefully.
        </div>
      </div>
    </div>
  );
}

function Trade() {
  const [tab, setTab] = useState("All");
  const [modal, setModal] = useState(null); // { fund, action }
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const categories = ["All", "Equity", "Debt", "Liquid", "ELSS"];

  const filtered = TRADE_FUNDS
    .filter((f) => tab === "All" || f.category === tab)
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "returns" ? b.returns1y - a.returns1y : sortBy === "nav" ? b.nav - a.nav : a.name.localeCompare(b.name));

  return (
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      {modal && <TradeModal fund={modal.fund} action={modal.action} onClose={() => setModal(null)} />}

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${G.darkest}, ${G.dark})`,
        borderRadius: 20, padding: "20px 20px 16px", marginBottom: 16,
      }}>
        <div style={{ color: G.pale, fontSize: 11, marginBottom: 4 }}>⚡ Smart Trading Desk</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Buy & Sell Funds</div>
        <div style={{ color: G.pale, fontSize: 11, marginBottom: 16 }}>AI-powered recommendations on every trade</div>
        {/* Portfolio snapshot */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Holdings Value", value: "₹4,82,310" },
            { label: "Today P&L", value: "+₹2,184", color: G.accent },
            { label: "Available Cash", value: "₹1,23,500" },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: G.pale, marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color || "#fff", fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Sort */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#aaa" }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search funds…"
            style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10, border: `1.5px solid #e0e0e0`, fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", background: G.white }}
          />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid #e0e0e0`, fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: G.mid, background: G.white, fontWeight: 600, outline: "none" }}>
          <option value="name">A–Z</option>
          <option value="returns">Returns</option>
          <option value="nav">NAV</option>
        </select>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setTab(c)}
            style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${tab === c ? G.mid : "#e0e0e0"}`, background: tab === c ? G.mid : G.white, color: tab === c ? "#fff" : "#888", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Fund cards */}
      {filtered.map((fund) => {
        const sent = SENTIMENT_CONFIG[fund.sentiment];
        const hasHolding = fund.held > 0;
        return (
          <div key={fund.id} style={{ background: G.white, borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 16px rgba(26,58,42,0.07)", border: "1.5px solid transparent", transition: "all 0.2s" }}>
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ flex: 1, marginRight: 10 }}>
                <div style={{ fontWeight: 700, color: G.dark, fontSize: 13, marginBottom: 4 }}>{fund.name}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge text={fund.category} color={G.mid} />
                  <Badge text={fund.risk} color={fund.risk === "High" || fund.risk === "Very High" ? G.warn : fund.risk === "Low" || fund.risk === "Very Low" ? G.accent : G.gold} />
                  {hasHolding && <Badge text={`${fund.held} units held`} color={G.mid} />}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: G.dark }}>₹{fund.nav}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: fund.change > 0 ? G.accent : G.warn }}>{fund.change > 0 ? "▲" : "▼"} {Math.abs(fund.change)}%</div>
              </div>
            </div>

            {/* Returns row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
              {[
                { label: "1Y Return", value: `${fund.returns1y}%`, color: fund.returns1y > 10 ? G.mid : G.gold },
                { label: "3Y Return", value: `${fund.returns3y}%`, color: fund.returns3y > 10 ? G.mid : G.gold },
                { label: "Current Value", value: hasHolding ? fmt(Math.round(fund.held * fund.nav)) : "—", color: G.dark },
              ].map((m) => (
                <div key={m.label} style={{ background: G.bg, borderRadius: 8, padding: "6px 8px" }}>
                  <div style={{ fontSize: 9, color: "#aaa" }}>{m.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* AI Sentiment tag */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: sent.bg, borderRadius: 8, padding: "6px 10px", flex: 1, marginRight: 8 }}>
                <span style={{ fontSize: 14 }}>{sent.icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: sent.color }}>AI: {sent.label}</div>
                  <div style={{ fontSize: 9, color: "#888" }}>Based on 90-day trend & momentum</div>
                </div>
              </div>
            </div>

            {/* Buy / Sell buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => setModal({ fund, action: "BUY" })}
                style={{
                  padding: "11px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${G.mid}, ${G.accent})`,
                  color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
                  boxShadow: `0 4px 14px ${G.accent}44`, transition: "transform 0.15s"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                🛒 BUY
              </button>
              <button
                onClick={() => hasHolding && setModal({ fund, action: "SELL" })}
                disabled={!hasHolding}
                style={{
                  padding: "11px", borderRadius: 12, border: `2px solid ${hasHolding ? G.warn : "#e0e0e0"}`, cursor: hasHolding ? "pointer" : "not-allowed",
                  background: hasHolding ? G.warn + "12" : G.bg,
                  color: hasHolding ? G.warn : "#ccc", fontSize: 13, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s"
                }}
              >
                💰 SELL {!hasHolding && "(No Units)"}
              </button>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 13 }}>No funds found for "{search}"</div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   ROOT APP
════════════════════════════════════════ */
export default function MonarchApp() {
  const [page, setPage] = useState("Dashboard");

  const pageMap = {
    Dashboard: <Dashboard setPage={setPage} />,
    Trade: <Trade />,
    "AI Advisor": <AIAdvisor />,
    Simulator: <Simulator />,
    Portfolio: <Portfolio />,
    "SIP Planner": <SIPPlanner />,
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: G.bg, position: "relative", display: "flex", flexDirection: "column" }}>
      <FontStyle />

      {/* Top Bar */}
      <div style={{
        background: `linear-gradient(90deg, ${G.darkest}, ${G.dark})`,
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${G.accent}, ${G.light})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👑</div>
          <div>
            <div style={{ color: "#fff", fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, lineHeight: 1 }}>MONARCH</div>
            <div style={{ color: G.pale, fontSize: 8, letterSpacing: 2, lineHeight: 1 }}>NETWORTH CAPITAL</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge text="SEBI Reg." color={G.accent} />
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${G.accent}22`, border: `2px solid ${G.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>👤</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "16px 16px 80px", overflowY: "auto" }} key={page}>
        {pageMap[page]}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480,
        background: G.white, borderTop: "1px solid #e8f0ec",
        display: "flex", padding: "8px 0 4px",
        boxShadow: "0 -4px 20px rgba(26,58,42,0.1)",
        zIndex: 100
      }}>
        {PAGES.map((p, i) => (
          <div key={p} onClick={() => setPage(p)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", padding: "4px 0" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              background: page === p ? `linear-gradient(135deg, ${G.mid}, ${G.accent})` : "transparent",
              transition: "all 0.2s",
              boxShadow: page === p ? `0 4px 12px ${G.accent}44` : "none"
            }}>{PAGE_ICONS[i]}</div>
            <div style={{ fontSize: 8, color: page === p ? G.mid : "#aaa", fontWeight: page === p ? 700 : 400, transition: "color 0.2s" }}>{p}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
