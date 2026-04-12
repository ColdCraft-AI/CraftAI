import { useState, useEffect, useRef } from "react";

const TONES = ["Professional", "Casual", "Bold", "Friendly", "Consultative"];
const GOALS = ["Book a meeting", "Get a reply", "Pitch a service", "Request intro", "Follow up"];

const EXAMPLE_EMAILS = [
  {
    subject: "Quick question about [Company]'s growth plans",
    body: `Hi [First Name],

I noticed [Company] recently expanded into [market/area] — congrats on the momentum.

I work with companies in [industry] who are scaling fast and typically struggle with [specific pain point]. We helped [similar company] solve this and they saw [specific result] within 90 days.

Would it make sense to chat for 15 minutes this week to see if we could do something similar for [Company]?

Either way, excited to watch your growth.

Best,
[Your Name]`,
    tone: "Professional",
    goal: "Book a meeting",
  },
  {
    subject: "Loved your recent [post/talk/launch]",
    body: `Hey [First Name],

Saw your [post/talk/launch] about [topic] — really resonated with me, especially the part about [specific detail].

I've been working on something in that space that I think you'd find interesting. We're helping [type of company] do [specific outcome] without [common pain point].

No pitch — just thought it might be worth a quick conversation since you're clearly thinking about this stuff.

Open to a 10-min call this week?

Cheers,
[Your Name]`,
    tone: "Casual",
    goal: "Get a reply",
  },
];

function generatePrompt(formData, tone) {
  return `You are an expert cold email copywriter. Generate a cold outreach email based on these inputs:

PROSPECT INFO:
- Company: ${formData.company}
- Recipient's Role: ${formData.role}
- Industry: ${formData.industry || "Not specified"}

SENDER INFO:
- What you offer: ${formData.offer}
- Key result/proof: ${formData.proof || "Not specified"}

SETTINGS:
- Tone: ${tone}
- Goal: ${formData.goal}
- Email length: Short (under 120 words)

RULES:
1. Subject line must be under 8 words, lowercase, curiosity-driven
2. Opening line must NOT start with "I" — start with something about THEM
3. Keep it under 120 words total
4. Include exactly ONE clear call-to-action
5. No fluff, no buzzwords, no "I hope this email finds you well"
6. Sound like a real human, not a template
7. Use line breaks for readability

Respond in this EXACT format:
SUBJECT: [subject line]
---
[email body]`;
}

function generateSequencePrompt(formData, tone) {
  return `You are an expert cold email copywriter. Generate a 3-email follow-up SEQUENCE based on these inputs:

PROSPECT INFO:
- Company: ${formData.company}
- Recipient's Role: ${formData.role}
- Industry: ${formData.industry || "Not specified"}

SENDER INFO:
- What you offer: ${formData.offer}
- Key result/proof: ${formData.proof || "Not specified"}

SETTINGS:
- Tone: ${tone}
- Goal: ${formData.goal}

RULES FOR ALL EMAILS:
1. Each email under 100 words
2. Never start with "I" — always about THEM
3. Each email takes a DIFFERENT angle (don't repeat the same pitch)
4. Subject lines under 8 words, lowercase
5. Sound human, not templated
6. Email 1: Initial outreach. Email 2: Follow-up 3 days later (new angle, reference email 1 briefly). Email 3: Breakup email 5 days later (create subtle urgency).

Format EXACTLY like this:
EMAIL 1 (Day 1):
SUBJECT: [subject]
---
[body]

EMAIL 2 (Day 4):
SUBJECT: [subject]
---
[body]

EMAIL 3 (Day 9):
SUBJECT: [subject]
---
[body]`;
}

export default function ColdEmailGenerator() {
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    industry: "",
    offer: "",
    proof: "",
    tones: ["Professional"],
    goal: "Book a meeting",
  });
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [activeResultTab, setActiveResultTab] = useState(0);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [mode, setMode] = useState("single"); // single or sequence
  const [showExamples, setShowExamples] = useState(false);
  const [activeExample, setActiveExample] = useState(0);
  const resultRef = useRef(null);

  const MAX_FREE = 3;
  const isLocked = usageCount >= MAX_FREE;

  const update = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const toggleTone = (t) => {
    setFormData((p) => {
      const has = p.tones.includes(t);
      if (has) {
        if (p.tones.length === 1) return p; // must keep at least 1
        return { ...p, tones: p.tones.filter((x) => x !== t) };
      }
      if (p.tones.length >= 2) return p; // max 2
      return { ...p, tones: [...p.tones, t] };
    });
  };

  const canSubmit =
    formData.company.trim() &&
    formData.role.trim() &&
    formData.offer.trim() &&
    formData.tones.length > 0 &&
    !generating &&
    !isLocked;

  async function handleGenerate() {
    if (!canSubmit) return;
    setGenerating(true);
    setError(null);
    setResults([]);
    setActiveResultTab(0);

    try {
      const allResults = [];
      for (const tone of formData.tones) {
        const prompt =
          mode === "single"
            ? generatePrompt(formData, tone)
            : generateSequencePrompt(formData, tone);

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        const data = await response.json();
        const text = data.content
          ?.map((block) => (block.type === "text" ? block.text : ""))
          .filter(Boolean)
          .join("\n");

        if (text) {
          allResults.push({ tone, text });
        }
      }

      if (allResults.length > 0) {
        setResults(allResults);
        setUsageCount((c) => c + 1);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        setError("No response received. Please try again.");
      }
    } catch (err) {
      setError("Failed to generate. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard() {
    if (results.length === 0) return;
    const text = results.length === 1
      ? results[0].text
      : results.map((r) => `--- ${r.tone.toUpperCase()} VERSION ---\n\n${r.text}`).join("\n\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "#18181f",
    border: "1px solid #2a2a35",
    borderRadius: "8px",
    color: "#e8e6e1",
    fontSize: "14px",
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: "#6b6b7b",
    marginBottom: "6px",
    fontWeight: 500,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c12",
        color: "#e8e6e1",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');
        
        input:focus, textarea:focus {
          border-color: #ff6b35 !important;
        }
        
        input::placeholder, textarea::placeholder {
          color: #3a3a48;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .chip-active {
          background: #ff6b35 !important;
          color: #0c0c12 !important;
          border-color: #ff6b35 !important;
          font-weight: 600 !important;
        }

        * { box-sizing: border-box; }
      `}</style>

      {/* Accent glow */}
      <div
        style={{
          position: "fixed", top: "-300px", left: "50%", transform: "translateX(-50%)",
          width: "800px", height: "600px",
          background: "radial-gradient(ellipse, rgba(255,107,53,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 20px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: "20px",
              background: "#ff6b3512",
              border: "1px solid #ff6b3530",
              fontSize: "11px",
              letterSpacing: "2px",
              color: "#ff6b35",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            AI-Powered
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 48px)",
              fontWeight: 700,
              lineHeight: 1.05,
              margin: "0 0 12px 0",
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "-1px",
            }}
          >
            Cold Email
            <br />
            <span style={{ color: "#ff6b35" }}>Generator</span>
          </h1>
          <p style={{ fontSize: "15px", color: "#6b6b7b", lineHeight: 1.5, maxWidth: "420px", margin: "0 auto" }}>
            Enter your prospect details. Get a personalized cold email that actually gets replies.
          </p>
        </div>

        {/* Usage counter */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 18px",
            background: "#14141c",
            border: "1px solid #1e1e2a",
            borderRadius: "10px",
            marginBottom: "28px",
            fontSize: "13px",
          }}
        >
          <span style={{ color: "#6b6b7b" }}>
            Free generations today
          </span>
          <span style={{ color: isLocked ? "#ff4444" : "#ff6b35", fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>
            {usageCount}/{MAX_FREE}
          </span>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px", background: "#14141c", borderRadius: "10px", padding: "4px", border: "1px solid #1e1e2a" }}>
          {[
            { id: "single", label: "Single Email", icon: "✉️" },
            { id: "sequence", label: "3-Email Sequence", icon: "📧" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1,
                padding: "10px",
                background: mode === m.id ? "#1e1e2a" : "transparent",
                border: mode === m.id ? "1px solid #ff6b3530" : "1px solid transparent",
                borderRadius: "8px",
                color: mode === m.id ? "#ff6b35" : "#6b6b7b",
                fontSize: "13px",
                fontFamily: "inherit",
                fontWeight: mode === m.id ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: "grid", gap: "18px", marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Company *</label>
              <input
                style={inputStyle}
                placeholder="e.g. Stripe"
                value={formData.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Recipient's Role *</label>
              <input
                style={inputStyle}
                placeholder="e.g. Head of Sales"
                value={formData.role}
                onChange={(e) => update("role", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Industry (optional)</label>
            <input
              style={inputStyle}
              placeholder="e.g. Fintech, SaaS, E-commerce"
              value={formData.industry}
              onChange={(e) => update("industry", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>What you offer *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "72px", resize: "vertical", lineHeight: 1.5 }}
              placeholder="e.g. We help B2B SaaS companies book 30+ demos/month using AI-personalized outreach"
              value={formData.offer}
              onChange={(e) => update("offer", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Key result or proof (optional)</label>
            <input
              style={inputStyle}
              placeholder="e.g. Helped Acme Corp 3x their reply rate in 60 days"
              value={formData.proof}
              onChange={(e) => update("proof", e.target.value)}
            />
          </div>

          {/* Tone */}
          <div>
            <label style={labelStyle}>Tone <span style={{ color: "#ff6b35", fontWeight: 400, letterSpacing: "0", textTransform: "none" }}>— pick up to 2 for side-by-side comparison</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {TONES.map((t) => (
                <button
                  key={t}
                  className={formData.tones.includes(t) ? "chip-active" : ""}
                  onClick={() => toggleTone(t)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "20px",
                    border: "1px solid #2a2a35",
                    background: "#18181f",
                    color: "#888",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    opacity: !formData.tones.includes(t) && formData.tones.length >= 2 ? 0.4 : 1,
                  }}
                >
                  {t} {formData.tones.includes(t) ? "✓" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label style={labelStyle}>Goal</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {GOALS.map((g) => (
                <button
                  key={g}
                  className={formData.goal === g ? "chip-active" : ""}
                  onClick={() => update("goal", g)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "20px",
                    border: "1px solid #2a2a35",
                    background: "#18181f",
                    color: "#888",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: "16px",
            background: canSubmit
              ? "linear-gradient(135deg, #ff6b35, #ff8f5e)"
              : "#1e1e2a",
            border: "none",
            borderRadius: "10px",
            color: canSubmit ? "#0c0c12" : "#444",
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: canSubmit ? "pointer" : "not-allowed",
            letterSpacing: "0.5px",
            transition: "all 0.2s",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {generating ? (
            <span style={{ animation: "pulse 1.2s infinite" }}>
              ✍️ Writing{mode === "sequence" ? " sequence" : ""}...
            </span>
          ) : isLocked ? (
            "🔒 Upgrade to Pro for Unlimited"
          ) : (
            `Generate ${mode === "sequence" ? "3-Email Sequence" : "Cold Email"} →`
          )}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: "16px", padding: "14px 18px",
            background: "#ff444415", border: "1px solid #ff444430",
            borderRadius: "8px", fontSize: "13px", color: "#ff6666",
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div
            ref={resultRef}
            style={{
              marginTop: "28px",
              animation: "fadeUp 0.4s ease-out",
            }}
          >
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "12px",
            }}>
              <span style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#ff6b35" }}>
                {mode === "sequence" ? "Your 3-Email Sequence" : "Your Cold Email"}{results.length > 1 ? "s" : ""}
              </span>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: "6px 14px",
                  background: copied ? "#00ff8820" : "#1e1e2a",
                  border: copied ? "1px solid #00ff8840" : "1px solid #2a2a35",
                  borderRadius: "6px",
                  color: copied ? "#00ff88" : "#888",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "✓ Copied!" : results.length > 1 ? "📋 Copy Both" : "📋 Copy"}
              </button>
            </div>

            {/* Tone tabs when 2 results */}
            {results.length > 1 && (
              <div style={{
                display: "flex", gap: "6px", marginBottom: "12px",
                background: "#14141c", borderRadius: "10px", padding: "4px",
                border: "1px solid #1e1e2a",
              }}>
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveResultTab(i)}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      background: activeResultTab === i ? "#1e1e2a" : "transparent",
                      border: activeResultTab === i ? "1px solid #ff6b3530" : "1px solid transparent",
                      borderRadius: "8px",
                      color: activeResultTab === i ? "#ff6b35" : "#6b6b7b",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      fontWeight: activeResultTab === i ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {r.tone} Version
                  </button>
                ))}
              </div>
            )}

            <div style={{
              background: "#14141c",
              border: "1px solid #1e1e2a",
              borderRadius: "12px",
              padding: "24px",
              fontSize: "14px",
              lineHeight: 1.7,
              color: "#ccc",
              whiteSpace: "pre-wrap",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {results[results.length > 1 ? activeResultTab : 0]?.text}
            </div>
          </div>
        )}

        {/* Example emails toggle */}
        <div style={{ marginTop: "36px" }}>
          <button
            onClick={() => setShowExamples(!showExamples)}
            style={{
              width: "100%",
              padding: "14px",
              background: "#14141c",
              border: "1px solid #1e1e2a",
              borderRadius: "10px",
              color: "#6b6b7b",
              fontSize: "13px",
              fontFamily: "inherit",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s",
            }}
          >
            {showExamples ? "Hide" : "See"} Example Emails {showExamples ? "↑" : "↓"}
          </button>
          {showExamples && (
            <div style={{ marginTop: "14px", animation: "fadeUp 0.3s ease-out" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                {EXAMPLE_EMAILS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveExample(i)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: activeExample === i ? "1px solid #ff6b3540" : "1px solid #1e1e2a",
                      background: activeExample === i ? "#1e1e2a" : "transparent",
                      color: activeExample === i ? "#ff6b35" : "#555",
                      fontSize: "12px",
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Example {i + 1}: {EXAMPLE_EMAILS[i].tone}
                  </button>
                ))}
              </div>
              <div style={{
                background: "#14141c",
                border: "1px solid #1e1e2a",
                borderRadius: "10px",
                padding: "20px",
              }}>
                <div style={{ fontSize: "12px", color: "#ff6b35", marginBottom: "4px", fontWeight: 600 }}>
                  Subject: {EXAMPLE_EMAILS[activeExample].subject}
                </div>
                <div style={{
                  fontSize: "13px", color: "#999", lineHeight: 1.7,
                  whiteSpace: "pre-wrap", marginTop: "12px",
                }}>
                  {EXAMPLE_EMAILS[activeExample].body}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pro upsell */}
        <div style={{
          marginTop: "36px",
          padding: "24px",
          background: "linear-gradient(135deg, #ff6b3508, #ff8f5e05)",
          border: "1px solid #ff6b3520",
          borderRadius: "14px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "20px", marginBottom: "8px" }}>⚡</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#e8e6e1", marginBottom: "8px", fontFamily: "'Space Mono', monospace" }}>
            Go Pro — $9/month
          </div>
          <div style={{ fontSize: "13px", color: "#6b6b7b", lineHeight: 1.6, maxWidth: "360px", margin: "0 auto 16px" }}>
            Unlimited emails. Multi-email sequences. A/B subject line testing. CSV export. No ads.
          </div>
          <button style={{
            padding: "12px 32px",
            background: "linear-gradient(135deg, #ff6b35, #ff8f5e)",
            border: "none",
            borderRadius: "8px",
            color: "#0c0c12",
            fontSize: "14px",
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}>
            Upgrade Now →
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "1px solid #1a1a24",
          fontSize: "11px",
          color: "#333",
          textAlign: "center",
          lineHeight: 1.6,
        }}>
          ColdCraft AI — Personalized outreach, powered by AI.
          <br />
          © 2026 All rights reserved.
        </div>
      </div>
    </div>
  );
}
