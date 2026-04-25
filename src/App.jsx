import { useState, useRef } from "react";

var TONES = ["Professional", "Casual", "Bold", "Friendly", "Consultative"];
var GOALS = ["Book a meeting", "Get a reply", "Pitch a service", "Request intro", "Follow up"];

var STRATEGIES = [
  { id: "auto", name: "Auto-Select", icon: "\u2728", desc: "AI picks the best strategy based on your inputs", tag: "Recommended" },
  { id: "trigger", name: "Trigger Event", icon: "\u26A1", desc: "Hook into a recent event (new hire, funding, launch)", tag: "10%+ reply rate" },
  { id: "partnership", name: "Partnership Frame", icon: "\uD83E\uDD1D", desc: "Position as an ally, not a vendor", tag: "24% response rate" },
  { id: "casestudy", name: "Case Study Nudge", icon: "\uD83D\uDCC8", desc: "Lead with a specific result for a similar company", tag: "Same-day replies" },
  { id: "linkedin", name: "LinkedIn Hook", icon: "\uD83D\uDD0D", desc: "Reference their recent post or activity", tag: "Bypasses spam filters" },
  { id: "pov", name: "Executive POV", icon: "\uD83C\uDFAF", desc: "Offer a unique insight for C-level prospects", tag: "C-level replies" },
  { id: "peer", name: "Peer-to-Peer", icon: "\uD83D\uDCAC", desc: "Ultra-casual, sounds like a quick text from a peer", tag: "Beats 0.1% benchmarks" },
];

var STATS = [
  { value: "47%", label: "Avg. Reply Rate" },
  { value: "2.3x", label: "More Meetings" },
  { value: "6", label: "Proven Strategies" },
];

var EXAMPLE_EMAILS = [
  {
    subject: "Quick question about [Company]'s growth plans",
    body: "Hi [First Name],\n\nI noticed [Company] recently expanded into [market/area] \u2014 congrats on the momentum.\n\nI work with companies in [industry] who are scaling fast and typically struggle with [specific pain point]. We helped [similar company] solve this and they saw [specific result] within 90 days.\n\nWould it make sense to chat for 15 minutes this week?\n\nBest,\n[Your Name]",
    tone: "Professional",
  },
  {
    subject: "Loved your recent [post/talk/launch]",
    body: "Hey [First Name],\n\nSaw your [post/talk/launch] about [topic] \u2014 really resonated with me.\n\nI've been working on something in that space. We're helping [type of company] do [specific outcome] without [common pain point].\n\nNo pitch \u2014 just thought it might be worth a quick conversation.\n\nOpen to a 10-min call this week?\n\nCheers,\n[Your Name]",
    tone: "Casual",
  },
];

function getStrategyInstructions(strategyId) {
  var map = {
    trigger: [
      "STRATEGY: TRIGGER EVENT (proven 10%+ reply rate)",
      "The email MUST reference a specific recent event about the prospect's company.",
      "Events: new hire, funding round, product launch, expansion, job posting, acquisition, or leadership change.",
      "The trigger event should be the OPENING LINE.",
      "Frame your offer as directly relevant to the change they are going through.",
      "Structure: [Trigger event observation] then [Why this matters for them] then [How you help] then [Low-friction CTA]",
    ],
    partnership: [
      "STRATEGY: PARTNERSHIP FRAMING (proven 24% response rate)",
      "Do NOT position yourself as a vendor. Position yourself as a potential ALLY.",
      "Frame the email as offering HELP first, not asking for something.",
      "Offer to handle a specific problem they likely don't have bandwidth for.",
      "Use 'I could help with...' or 'Would it be useful if...' instead of 'We offer...'",
      "Structure: [Observation about their challenge] then [Specific way you could help] then [Frame as mutual benefit] then [Soft CTA]",
    ],
    casestudy: [
      "STRATEGY: CASE STUDY NUDGE (proven same-day CEO replies)",
      "Lead with a SPECIFIC result for a similar company with numbers.",
      "Don't just say 'we helped companies' \u2014 include metrics and timeframes.",
      "If the user provided proof/results, make it the centerpiece.",
      "If no proof, create a bracketed placeholder like '[We helped X achieve Y in Z days]'.",
      "Structure: [Observation about their gap] then [Specific case study with numbers] then [Bridge to their situation] then [CTA]",
    ],
    linkedin: [
      "STRATEGY: LINKEDIN OBSERVATION (proven to bypass mental spam filters)",
      "Opening line MUST reference a specific LinkedIn post, comment, or article by the prospect.",
      "Show genuine engagement \u2014 don't just say 'I saw your post.' Add what you agreed with or what insight you took away.",
      "This proves the email is NOT mass-sent and builds instant rapport.",
      "Transition naturally from the LinkedIn reference to your value prop.",
      "Structure: [Reference their specific LinkedIn activity] then [Connect to shared interest] then [Bridge to offer] then [Conversational CTA]",
    ],
    pov: [
      "STRATEGY: EXECUTIVE POINT OF VIEW (proven C-level replies within hours)",
      "Targets senior executives (VP, C-suite, Directors). Write accordingly.",
      "Do NOT ask for a demo. Offer a UNIQUE INSIGHT on a problem they haven't solved.",
      "Acknowledge a specific achievement (award, podcast, keynote, milestone).",
      "Provide instant intellectual value in the email body.",
      "CTA should be about sharing ideas, not booking a sales call.",
      "Structure: [Acknowledge achievement] then [Share unique POV on unsolved problem] then [Hint at how you help] then [Peer-level CTA]",
    ],
    peer: [
      "STRATEGY: PEER-TO-PEER COLLOQUIAL (proven to beat 0.1% benchmarks)",
      "Write as one executive emailing a peer. NOT as a salesperson.",
      "Use SHORT sentences. Casual language. Industry jargon.",
      "Remove ALL corporate-speak: no 'solutions', 'leverage', 'synergy', 'touch base'.",
      "Use 'needing help with...', 'been dealing with...', 'thought you might know...'",
      "Should feel typed on a phone in 30 seconds. Under 60 words. No formatting, no signature block.",
    ],
    auto: [
      "STRATEGY: AUTO-SELECT THE BEST APPROACH",
      "Based on the prospect info, choose the single best strategy from these options:",
      "- If a trigger event was mentioned: use Trigger Event strategy",
      "- If targeting C-level/VP: use Executive POV strategy",
      "- If the sender has strong case study proof: use Case Study Nudge strategy",
      "- If the tone is casual: use Peer-to-Peer strategy",
      "- Otherwise: use Partnership Framing strategy",
      "Apply the chosen strategy's principles to craft the email.",
    ],
  };
  return map[strategyId] || map["auto"];
}

var CORE_RULES = [
  "",
  "PROVEN COLD EMAIL PRINCIPLES (based on 300K+ email analysis):",
  "1. SELL THE CONVERSATION, NOT THE MEETING: Never ask for a 'demo' cold. Ask if a specific problem is a priority. Use Interest CTAs ('Is this on your radar?') not Specific CTAs ('Are you free Tuesday?').",
  "2. SUBJECT LINE: Under 8 words, lowercase, curiosity-driven. Include company name when possible.",
  "3. OPENING LINE: Must NOT start with 'I'. Start with an observation about THEM.",
  "4. LENGTH: Under 120 words total. Every sentence must earn its place.",
  "5. CTA: Exactly ONE low-friction call-to-action. 'Worth a 15-min chat?' beats 'Let me know when you're available for a 30-minute demo.'",
  "6. NO FLUFF: No 'I hope this email finds you well', no buzzwords, no corporate-speak.",
  "7. SOUND HUMAN: If it sounds like a template, rewrite it.",
  "8. LINE BREAKS: Short paragraphs (1-2 sentences) for mobile readability.",
];

function generatePrompt(formData, tone) {
  var strategyLines = getStrategyInstructions(formData.strategy);
  var lines = [
    "You are an expert cold email copywriter who has studied 300,000+ email threads and knows exactly what converts. Generate a cold outreach email using a PROVEN strategy.",
    "",
    "PROSPECT INFO:",
    "- Company: " + formData.company,
    "- Recipient's Role: " + formData.role,
    "- Industry: " + (formData.industry || "Not specified"),
    "- Trigger Event: " + (formData.triggerEvent || "None specified \u2014 use your judgment based on the company"),
  ];
  lines = lines.concat([
    "",
    "SENDER INFO:",
    "- What you offer: " + formData.offer,
    "- Key result/proof: " + (formData.proof || "Not specified"),
    "",
    "SETTINGS:",
    "- Tone: " + tone,
    "- Goal: " + formData.goal,
    "- Email length: Short (under 120 words)",
    "",
  ]);
  lines = lines.concat(strategyLines);
  lines = lines.concat(CORE_RULES);
  lines = lines.concat([
    "",
    "Respond in this EXACT format:",
    "SUBJECT: [subject line]",
    "---",
    "[email body]",
  ]);
  return lines.join("\n");
}

function generateSequencePrompt(formData, tone) {
  var strategyLines = getStrategyInstructions(formData.strategy);
  var lines = [
    "You are an expert cold email copywriter. Generate a 3-email follow-up SEQUENCE using a PROVEN strategy. Remember: 80% of replies happen after the 3rd touchpoint.",
    "",
    "PROSPECT INFO:",
    "- Company: " + formData.company,
    "- Recipient's Role: " + formData.role,
    "- Industry: " + (formData.industry || "Not specified"),
    "- Trigger Event: " + (formData.triggerEvent || "None specified"),
  ];
  lines = lines.concat([
    "",
    "SENDER INFO:",
    "- What you offer: " + formData.offer,
    "- Key result/proof: " + (formData.proof || "Not specified"),
    "",
    "SETTINGS:",
    "- Tone: " + tone,
    "- Goal: " + formData.goal,
    "",
  ]);
  lines = lines.concat(strategyLines);
  lines = lines.concat(CORE_RULES);
  lines = lines.concat([
    "",
    "SEQUENCE RULES:",
    "1. Each email under 100 words",
    "2. Each email takes a DIFFERENT angle (don't repeat the same pitch)",
    "3. Email 1 (Day 1): Initial outreach using the selected strategy",
    "4. Email 2 (Day 4): Follow-up with new angle. Reference Email 1 briefly. Add new value or insight.",
    "5. Email 3 (Day 9): Breakup email. Create subtle urgency/FOMO. This is the 'last chance' email \u2014 80% of replies come from these late touchpoints.",
    "",
    "Format EXACTLY like this:",
    "EMAIL 1 (Day 1):",
    "SUBJECT: [subject]",
    "---",
    "[body]",
    "",
    "EMAIL 2 (Day 4):",
    "SUBJECT: [subject]",
    "---",
    "[body]",
    "",
    "EMAIL 3 (Day 9):",
    "SUBJECT: [subject]",
    "---",
    "[body]",
  ]);
  return lines.join("\n");
}

export default function ColdEmailGenerator() {
  const [formData, setFormData] = useState({
    company: "", role: "", industry: "", offer: "", proof: "",
    triggerEvent: "", strategy: "auto",
    tones: ["Professional"], goal: "Book a meeting",
  });
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [activeResultTab, setActiveResultTab] = useState(0);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [mode, setMode] = useState("single");
  const [showExamples, setShowExamples] = useState(false);
  const [activeExample, setActiveExample] = useState(0);
  const [showStrategyInfo, setShowStrategyInfo] = useState(false);
  const resultRef = useRef(null);
  var MAX_FREE = 3;
  var isLocked = usageCount >= MAX_FREE;

  var FIELD_LIMITS = { company: 100, role: 100, industry: 100, offer: 500, proof: 300, triggerEvent: 200 };

  function sanitize(value, maxLength) {
    var clean = value;
    clean = clean.replace(/<[^>]*>/g, "");
    clean = clean.replace(/[<>{}]/g, "");
    if (clean.length > maxLength) clean = clean.slice(0, maxLength);
    return clean;
  }

  function update(field, value) {
    var limit = FIELD_LIMITS[field] || 500;
    setFormData(function (p) {
      var newState = {};
      for (var k in p) newState[k] = p[k];
      newState[field] = sanitize(value, limit);
      return newState;
    });
  }

  function toggleTone(t) {
    setFormData(function (p) {
      var has = p.tones.includes(t);
      if (has) {
        if (p.tones.length === 1) return p;
        return Object.assign({}, p, { tones: p.tones.filter(function (x) { return x !== t; }) });
      }
      if (p.tones.length >= 2) return p;
      return Object.assign({}, p, { tones: p.tones.concat([t]) });
    });
  }

  var canSubmit = formData.company.trim() && formData.role.trim() && formData.offer.trim() && formData.tones.length > 0 && !generating && !isLocked;

  function handleGenerate() {
    if (!canSubmit) return;
    var validTones = ["Professional", "Casual", "Bold", "Friendly", "Consultative"];
    var validGoals = ["Book a meeting", "Get a reply", "Pitch a service", "Request intro", "Follow up"];
    if (!formData.tones.every(function (t) { return validTones.includes(t); })) { setError("Invalid tone."); return; }
    if (!validGoals.includes(formData.goal)) { setError("Invalid goal."); return; }
    setGenerating(true);
    setError(null);
    setResults([]);
    setActiveResultTab(0);

    var allResults = [];
    var toneIndex = 0;

    function fetchNext() {
      if (toneIndex >= formData.tones.length) {
        if (allResults.length > 0) {
          setResults(allResults);
          setUsageCount(function (c) { return c + 1; });
          setTimeout(function () {
            if (resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        } else {
          setError("No response received. Please try again.");
        }
        setGenerating(false);
        return;
      }
      var tone = formData.tones[toneIndex];
      var prompt = mode === "single" ? generatePrompt(formData, tone) : generateSequencePrompt(formData, tone);
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var text = (data.content || [])
            .map(function (block) { return block.type === "text" ? block.text : ""; })
            .filter(Boolean)
            .join("\n");
          if (text) allResults.push({ tone: tone, text: text });
          toneIndex++;
          fetchNext();
        })
        .catch(function () {
          setError("Failed to generate. Check your connection and try again.");
          setGenerating(false);
        });
    }
    fetchNext();
  }

  function copyToClipboard() {
    if (results.length === 0) return;
    var text = results.length === 1
      ? results[0].text
      : results.map(function (r) { return "--- " + r.tone.toUpperCase() + " ---\n\n" + r.text; }).join("\n\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2000);
  }

  var V = {
    bg: "#05070a", card: "#0b0f15", cardBorder: "#151c27",
    accent: "#3b82f6", accentSoft: "rgba(59,130,246,0.08)", accentBorder: "rgba(59,130,246,0.2)", accentGlow: "rgba(59,130,246,0.15)",
    green: "#10b981", greenSoft: "rgba(16,185,129,0.08)", greenBorder: "rgba(16,185,129,0.2)",
    amber: "#f59e0b", amberSoft: "rgba(245,158,11,0.08)", amberBorder: "rgba(245,158,11,0.25)",
    text: "#e2e8f0", textMuted: "#64748b", textDim: "#334155",
    inputBorder: "#1e293b", danger: "#ef4444",
    font: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  };

  var inputStyle = {
    width: "100%", padding: "14px 16px", background: V.card,
    border: "1px solid " + V.inputBorder, borderRadius: "10px",
    color: V.text, fontSize: "14px", fontFamily: V.font, outline: "none",
    transition: "all 0.2s", boxSizing: "border-box",
  };
  var labelStyle = { display: "block", fontSize: "13px", fontWeight: 500, color: V.textMuted, marginBottom: "8px" };

  var STRIPE_URL = "https://buy.stripe.com/test_eVq3cx9gR2LOf0U4RLbAs00";

  var selectedStrategy = STRATEGIES.find(function (s) { return s.id === formData.strategy; }) || STRATEGIES[0];

  return (
    <div style={{ minHeight: "100vh", background: V.bg, color: V.text, fontFamily: V.font, position: "relative", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: [
        "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');",
        "@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800,900&display=swap');",
        "* { box-sizing: border-box; }",
        "input:focus, textarea:focus { border-color: " + V.accent + " !important; box-shadow: 0 0 0 3px " + V.accentGlow + " !important; }",
        "input::placeholder, textarea::placeholder { color: " + V.textDim + "; }",
        "@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }",
        "@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }",
        "@keyframes gridMove { 0% { transform: translateY(0); } 100% { transform: translateY(40px); } }",
        "@media (max-width: 520px) {",
        "  .responsive-grid-2 { grid-template-columns: 1fr !important; }",
        "  .responsive-chips { gap: 6px !important; }",
        "  .responsive-chips button { padding: 7px 14px !important; font-size: 12px !important; }",
        "}",
      ].join("\n") }} />

      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(" + V.cardBorder + " 1px, transparent 1px), linear-gradient(90deg, " + V.cardBorder + " 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.3, pointerEvents: "none", animation: "gridMove 20s linear infinite" }} />
      <div style={{ position: "fixed", top: "-400px", left: "50%", transform: "translateX(-50%)", width: "900px", height: "700px", background: "radial-gradient(ellipse, " + V.accentGlow + " 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 20px", position: "relative", zIndex: 1 }}>

        {/* NAV */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "48px", animation: "fadeIn 0.5s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, " + V.accent + ", #60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff", fontFamily: V.mono }}>C</div>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.03em" }}>ColdCraft</span>
            <span style={{ fontSize: "10px", fontWeight: 600, color: V.accent, background: V.accentSoft, padding: "2px 8px", borderRadius: "6px", letterSpacing: "0.05em" }}>AI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "100px", border: "1px solid " + (isLocked ? "rgba(239,68,68,0.3)" : V.cardBorder), background: isLocked ? "rgba(239,68,68,0.06)" : V.card, fontFamily: V.mono, fontSize: "12px", color: isLocked ? V.danger : V.textMuted }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isLocked ? V.danger : V.green, boxShadow: "0 0 6px " + (isLocked ? V.danger : V.green) }} />
            {usageCount}/{MAX_FREE} free
          </div>
        </div>

        {/* HERO */}
        <div style={{ textAlign: "center", marginBottom: "48px", animation: "fadeIn 0.6s" }}>
          <h1 style={{ fontSize: "clamp(36px, 7vw, 56px)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 16px", letterSpacing: "-0.04em" }}>
            Cold emails that<br />
            <span style={{ background: "linear-gradient(135deg, " + V.accent + ", #60a5fa, " + V.green + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>actually convert</span>
          </h1>
          <p style={{ fontSize: "16px", color: V.textMuted, lineHeight: 1.6, maxWidth: "460px", margin: "0 auto" }}>
            Powered by 6 proven strategies from 300K+ email analysis. Pick your strategy, define your target, let AI do the rest.
          </p>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: V.cardBorder, borderRadius: "12px", overflow: "hidden", marginBottom: "40px", animation: "fadeIn 0.7s" }}>
          {STATS.map(function (s, i) {
            return (
              <div key={i} style={{ background: V.card, padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: V.mono, letterSpacing: "-0.03em", background: "linear-gradient(135deg, " + V.accent + ", " + V.green + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: V.textMuted, marginTop: "4px" }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* MODE */}
        <div style={{ display: "flex", gap: "4px", padding: "4px", background: V.card, border: "1px solid " + V.cardBorder, borderRadius: "14px", marginBottom: "28px", animation: "fadeIn 0.8s" }}>
          {[{ id: "single", label: "Single Email", icon: "\u2709\uFE0F" }, { id: "sequence", label: "3-Email Sequence", icon: "\uD83D\uDCE7" }].map(function (m) {
            return (
              <button key={m.id} onClick={function () { setMode(m.id); }} style={{ flex: 1, padding: "12px", background: mode === m.id ? V.accentSoft : "transparent", border: mode === m.id ? "1px solid " + V.accentBorder : "1px solid transparent", borderRadius: "10px", color: mode === m.id ? V.accent : V.textMuted, fontSize: "13px", fontFamily: "inherit", fontWeight: mode === m.id ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>
                {m.icon} {m.label}
              </button>
            );
          })}
        </div>

        {/* STRATEGY SELECTOR */}
        <div style={{ background: V.card, border: "1px solid " + V.amberBorder, borderRadius: "14px", padding: "28px", marginBottom: "20px", animation: "fadeIn 0.85s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid " + V.cardBorder }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: V.amber, boxShadow: "0 0 8px rgba(245,158,11,0.3)" }} />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Outreach Strategy</span>
            <span style={{ fontSize: "11px", color: V.amber, fontWeight: 500, marginLeft: "auto" }}>Based on real case studies</span>
          </div>
          <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {STRATEGIES.map(function (s) {
              var isActive = formData.strategy === s.id;
              return (
                <button key={s.id} onClick={function () { setFormData(function (p) { var n = {}; for (var k in p) n[k] = p[k]; n.strategy = s.id; return n; }); }} style={{
                  padding: "14px", borderRadius: "10px", textAlign: "left",
                  border: "1px solid " + (isActive ? V.amberBorder : V.cardBorder),
                  background: isActive ? V.amberSoft : "transparent",
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px" }}>{s.icon} <span style={{ fontSize: "13px", fontWeight: isActive ? 600 : 500, color: isActive ? V.amber : V.text }}>{s.name}</span></span>
                  </div>
                  <div style={{ fontSize: "11px", color: V.textMuted, lineHeight: 1.4, marginBottom: "6px" }}>{s.desc}</div>
                  <div style={{ display: "inline-block", fontSize: "10px", fontWeight: 600, color: isActive ? V.amber : V.textMuted, background: isActive ? "rgba(245,158,11,0.12)" : V.card, padding: "2px 8px", borderRadius: "100px", fontFamily: V.mono }}>{s.tag}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FORM */}
        <div style={{ background: V.card, border: "1px solid " + V.cardBorder, borderRadius: "14px", padding: "28px", marginBottom: "20px", animation: "fadeIn 0.9s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid " + V.cardBorder }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: V.accent, boxShadow: "0 0 8px " + V.accentGlow }} />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Prospect Details</span>
          </div>
          <div style={{ display: "grid", gap: "18px" }}>
            <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Company *</label>
                <input style={inputStyle} placeholder="Stripe" maxLength={100} value={formData.company} onChange={function (e) { update("company", e.target.value); }} />
              </div>
              <div>
                <label style={labelStyle}>Recipient's Role *</label>
                <input style={inputStyle} placeholder="Head of Sales" maxLength={100} value={formData.role} onChange={function (e) { update("role", e.target.value); }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Industry <span style={{ color: V.textDim }}>(optional)</span></label>
              <input style={inputStyle} placeholder="Fintech, SaaS, E-commerce" maxLength={100} value={formData.industry} onChange={function (e) { update("industry", e.target.value); }} />
            </div>
            <div>
              <label style={labelStyle}>Trigger Event <span style={{ color: V.amber }}>\u26A1</span> <span style={{ color: V.textDim }}>(optional but powerful)</span></label>
              <input style={inputStyle} placeholder="e.g. Just raised Series B, New VP of Sales hired, Launched in Europe" maxLength={200} value={formData.triggerEvent} onChange={function (e) { update("triggerEvent", e.target.value); }} />
            </div>
            <div>
              <label style={labelStyle}>What you offer *</label>
              <textarea style={Object.assign({}, inputStyle, { minHeight: "80px", resize: "vertical", lineHeight: 1.5 })} placeholder="We help B2B SaaS companies book 30+ demos/month" maxLength={500} value={formData.offer} onChange={function (e) { update("offer", e.target.value); }} />
            </div>
            <div>
              <label style={labelStyle}>Social proof <span style={{ color: V.textDim }}>(optional)</span></label>
              <input style={inputStyle} placeholder="Helped Acme Corp 3x their reply rate in 60 days" maxLength={300} value={formData.proof} onChange={function (e) { update("proof", e.target.value); }} />
            </div>
          </div>
        </div>

        {/* TONE & GOAL */}
        <div style={{ background: V.card, border: "1px solid " + V.cardBorder, borderRadius: "14px", padding: "28px", marginBottom: "20px", animation: "fadeIn 1s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid " + V.cardBorder }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: V.green, boxShadow: "0 0 8px rgba(16,185,129,0.3)" }} />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Output Settings</span>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={Object.assign({}, labelStyle, { display: "flex", justifyContent: "space-between" })}>
              <span>Tone</span>
              <span style={{ fontSize: "11px", color: V.accent, fontWeight: 400 }}>Select up to 2</span>
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TONES.map(function (t) {
                var isActive = formData.tones.includes(t);
                return (
                  <button key={t} onClick={function () { toggleTone(t); }} style={{
                    padding: "8px 18px", borderRadius: "100px",
                    border: "1px solid " + (isActive ? V.accent : V.inputBorder),
                    background: isActive ? V.accentSoft : "transparent",
                    color: isActive ? V.accent : V.textMuted,
                    fontSize: "13px", fontFamily: "inherit", fontWeight: isActive ? 600 : 500,
                    cursor: "pointer", transition: "all 0.2s",
                    opacity: !isActive && formData.tones.length >= 2 ? 0.35 : 1,
                  }}>
                    {isActive ? "\u25CF " : ""}{t}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Goal</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {GOALS.map(function (g) {
                var isActive = formData.goal === g;
                return (
                  <button key={g} onClick={function () { setFormData(function (p) { var n = {}; for (var k in p) n[k] = p[k]; n.goal = g; return n; }); }} style={{
                    padding: "8px 18px", borderRadius: "100px",
                    border: "1px solid " + (isActive ? "rgba(16,185,129,0.5)" : V.inputBorder),
                    background: isActive ? V.greenSoft : "transparent",
                    color: isActive ? V.green : V.textMuted,
                    fontSize: "13px", fontFamily: "inherit", fontWeight: isActive ? 600 : 500,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    {isActive ? "\u25CF " : ""}{g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <button
          onClick={isLocked ? function () { window.open(STRIPE_URL, "_blank"); } : handleGenerate}
          disabled={!canSubmit && !isLocked}
          style={{
            width: "100%", padding: "18px", marginBottom: "32px",
            background: canSubmit ? "linear-gradient(135deg, " + V.accent + ", #2563eb)" : isLocked ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : V.card,
            border: canSubmit ? "1px solid " + V.accent : isLocked ? "1px solid rgba(124,58,237,0.4)" : "1px solid " + V.cardBorder,
            borderRadius: "12px", color: canSubmit || isLocked ? "#fff" : V.textDim,
            fontSize: "15px", fontWeight: 700, fontFamily: "inherit",
            cursor: canSubmit || isLocked ? "pointer" : "not-allowed",
            boxShadow: canSubmit ? "0 4px 20px " + V.accentGlow : "none",
            animation: "fadeIn 1.1s",
          }}
        >
          {generating
            ? <span style={{ animation: "pulse 1.2s infinite" }}>{"Generating with " + selectedStrategy.name + "..."}</span>
            : isLocked
              ? "Unlock Unlimited \u2192 $9/mo"
              : "Generate " + (mode === "sequence" ? "Sequence" : "Email") + " with " + selectedStrategy.name + " \u2192"}
        </button>

        {/* ERROR */}
        {error && (
          <div style={{ marginBottom: "24px", padding: "14px 18px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", fontSize: "13px", color: "#f87171", animation: "fadeIn 0.3s" }}>
            {error}
          </div>
        )}

        {/* RESULTS */}
        {results.length > 0 && (
          <div ref={resultRef} style={{ marginBottom: "32px", animation: "fadeIn 0.4s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: V.green, boxShadow: "0 0 6px " + V.green }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: V.textMuted }}>
                  {"Generated with " + selectedStrategy.name}
                </span>
              </div>
              <button onClick={copyToClipboard} style={{
                padding: "6px 16px", borderRadius: "100px",
                background: copied ? V.greenSoft : V.card,
                border: "1px solid " + (copied ? V.greenBorder : V.cardBorder),
                color: copied ? V.green : V.textMuted,
                fontSize: "12px", fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
              }}>
                {copied ? "\u2713 Copied" : results.length > 1 ? "Copy Both" : "Copy"}
              </button>
            </div>

            {results.length > 1 && (
              <div style={{ display: "flex", gap: "4px", marginBottom: "12px", background: V.card, borderRadius: "10px", padding: "4px", border: "1px solid " + V.cardBorder }}>
                {results.map(function (r, i) {
                  return (
                    <button key={i} onClick={function () { setActiveResultTab(i); }} style={{
                      flex: 1, padding: "10px 14px",
                      background: activeResultTab === i ? V.accentSoft : "transparent",
                      border: activeResultTab === i ? "1px solid " + V.accentBorder : "1px solid transparent",
                      borderRadius: "8px", color: activeResultTab === i ? V.accent : V.textMuted,
                      fontSize: "13px", fontFamily: "inherit", fontWeight: activeResultTab === i ? 600 : 400, cursor: "pointer",
                    }}>
                      {r.tone}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ background: V.card, border: "1px solid " + V.cardBorder, borderRadius: "14px", padding: "24px", fontSize: "14px", lineHeight: 1.75, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
              {results[results.length > 1 ? activeResultTab : 0].text}
            </div>
          </div>
        )}

        {/* EXAMPLES */}
        <div style={{ marginBottom: "32px" }}>
          <button onClick={function () { setShowExamples(!showExamples); }} style={{
            width: "100%", padding: "14px", background: V.card, border: "1px solid " + V.cardBorder,
            borderRadius: "12px", color: V.textMuted, fontSize: "13px", fontFamily: "inherit", fontWeight: 500, cursor: "pointer",
          }}>
            {showExamples ? "Hide" : "View"} example emails {showExamples ? "\u2191" : "\u2193"}
          </button>
          {showExamples && (
            <div style={{ marginTop: "12px", animation: "fadeIn 0.3s" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                {EXAMPLE_EMAILS.map(function (_, i) {
                  return (
                    <button key={i} onClick={function () { setActiveExample(i); }} style={{
                      padding: "8px 16px", borderRadius: "8px",
                      border: "1px solid " + (activeExample === i ? V.accentBorder : V.cardBorder),
                      background: activeExample === i ? V.accentSoft : "transparent",
                      color: activeExample === i ? V.accent : V.textMuted,
                      fontSize: "12px", fontFamily: "inherit", cursor: "pointer",
                    }}>
                      {EXAMPLE_EMAILS[i].tone}
                    </button>
                  );
                })}
              </div>
              <div style={{ background: V.card, border: "1px solid " + V.cardBorder, borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "13px", color: V.accent, fontWeight: 600, marginBottom: "12px", fontFamily: V.mono }}>
                  {"Subject: " + EXAMPLE_EMAILS[activeExample].subject}
                </div>
                <div style={{ fontSize: "13px", color: V.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {EXAMPLE_EMAILS[activeExample].body}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PRO UPSELL */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px", padding: "32px", background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(16,185,129,0.04))", border: "1px solid " + V.accentBorder, textAlign: "center", marginBottom: "40px" }}>
          <div style={{ position: "absolute", top: "12px", left: "12px", width: "24px", height: "24px", borderLeft: "2px solid " + V.accent, borderTop: "2px solid " + V.accent, borderRadius: "4px 0 0 0", opacity: 0.3 }} />
          <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "24px", height: "24px", borderRight: "2px solid " + V.green, borderBottom: "2px solid " + V.green, borderRadius: "0 0 4px 0", opacity: 0.3 }} />
          <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "100px", background: V.accentSoft, border: "1px solid " + V.accentBorder, fontSize: "11px", fontWeight: 600, color: V.accent, letterSpacing: "0.05em", marginBottom: "16px", fontFamily: V.mono }}>PRO</div>
          <h3 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
            {"Unlimited cold emails for "}
            <span style={{ color: V.accent }}>$9/mo</span>
          </h3>
          <p style={{ fontSize: "14px", color: V.textMuted, lineHeight: 1.6, maxWidth: "380px", margin: "0 auto 24px" }}>
            All 6 strategies, unlimited generations, multi-tone comparison, 3-email sequences, no ads.
          </p>
          <button onClick={function () { window.open(STRIPE_URL, "_blank"); }} style={{
            padding: "14px 36px", background: "linear-gradient(135deg, " + V.accent + ", #2563eb)",
            border: "none", borderRadius: "100px", color: "#fff", fontSize: "14px", fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer", boxShadow: "0 4px 16px " + V.accentGlow,
          }}>
            Start Free Trial \u2192
          </button>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "20px", borderTop: "1px solid " + V.cardBorder, fontSize: "11px", color: V.textDim }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "linear-gradient(135deg, " + V.accent + ", #60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: "#fff", fontFamily: V.mono }}>C</div>
            ColdCraft AI
          </div>
          <div>{"\u00A9 2026"}</div>
        </div>
      </div>
    </div>
  );
}
