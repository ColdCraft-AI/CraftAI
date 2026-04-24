import { useState, useRef } from "react";

const TONES = ["Professional", "Casual", "Bold", "Friendly", "Consultative"];
const GOALS = ["Book a meeting", "Get a reply", "Pitch a service", "Request intro", "Follow up"];

const STATS = [
  { value: "47%", label: "Avg. Reply Rate" },
  { value: "2.3x", label: "More Meetings" },
  { value: "12s", label: "Generation Time" },
];

const EXAMPLE_EMAILS = [
  {
    subject: "Quick question about [Company]'s growth plans",
    body: "Hi [First Name],\n\nI noticed [Company] recently expanded into [market/area] — congrats on the momentum.\n\nI work with companies in [industry] who are scaling fast and typically struggle with [specific pain point]. We helped [similar company] solve this and they saw [specific result] within 90 days.\n\nWould it make sense to chat for 15 minutes this week?\n\nBest,\n[Your Name]",
    tone: "Professional",
  },
  {
    subject: "Loved your recent [post/talk/launch]",
    body: "Hey [First Name],\n\nSaw your [post/talk/launch] about [topic] — really resonated with me.\n\nI've been working on something in that space. We're helping [type of company] do [specific outcome] without [common pain point].\n\nNo pitch — just thought it might be worth a quick conversation.\n\nOpen to a 10-min call this week?\n\nCheers,\n[Your Name]",
    tone: "Casual",
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
    company: "", role: "", industry: "", offer: "", proof: "",
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
  const resultRef = useRef(null);
  const MAX_FREE = 3;
  const isLocked = usageCount >= MAX_FREE;

  const FIELD_LIMITS = { company:100, role:100, industry:100, offer:500, proof:300 };
  function sanitize(value, maxLength) {
    return value.replace(/<[^>]*>/g,"").replace(/[<>{}]/g,"").replace(/javascript:/gi,"").replace(/on\w+\s*=/gi,"").trim().slice(0, maxLength);
  }
  const update = (field, value) => {
    const limit = FIELD_LIMITS[field] || 500;
    setFormData((p) => ({ ...p, [field]: sanitize(value, limit) }));
  };
  const toggleTone = (t) => {
    setFormData((p) => {
      const has = p.tones.includes(t);
      if (has) { if (p.tones.length === 1) return p; return { ...p, tones: p.tones.filter((x) => x !== t) }; }
      if (p.tones.length >= 2) return p;
      return { ...p, tones: [...p.tones, t] };
    });
  };
  const canSubmit = formData.company.trim() && formData.role.trim() && formData.offer.trim() && formData.tones.length > 0 && !generating && !isLocked;

  async function handleGenerate() {
    if (!canSubmit) return;
    const validTones = ["Professional","Casual","Bold","Friendly","Consultative"];
    const validGoals = ["Book a meeting","Get a reply","Pitch a service","Request intro","Follow up"];
    if (!formData.tones.every((t) => validTones.includes(t))) { setError("Invalid tone."); return; }
    if (!validGoals.includes(formData.goal)) { setError("Invalid goal."); return; }
    setGenerating(true); setError(null); setResults([]); setActiveResultTab(0);
    try {
      const allResults = [];
      for (const tone of formData.tones) {
        const prompt = mode === "single" ? generatePrompt(formData, tone) : generateSequencePrompt(formData, tone);
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await response.json();
        const text = data.content?.map((block) => (block.type === "text" ? block.text : "")).filter(Boolean).join("\n");
        if (text) allResults.push({ tone, text });
      }
      if (allResults.length > 0) {
        setResults(allResults);
        setUsageCount((c) => c + 1);
        setTimeout(() => { resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
      } else { setError("No response received. Please try again."); }
    } catch (err) { setError("Failed to generate. Check your connection and try again."); }
    finally { setGenerating(false); }
  }

  function copyToClipboard() {
    if (results.length === 0) return;
    const text = results.length === 1 ? results[0].text : results.map((r) => "--- " + r.tone.toUpperCase() + " ---\n\n" + r.text).join("\n\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const V = {
    bg:"#05070a", card:"#0b0f15", cardBorder:"#151c27",
    accent:"#3b82f6", accentSoft:"rgba(59,130,246,0.08)", accentBorder:"rgba(59,130,246,0.2)", accentGlow:"rgba(59,130,246,0.15)",
    green:"#10b981", greenSoft:"rgba(16,185,129,0.08)", greenBorder:"rgba(16,185,129,0.2)",
    text:"#e2e8f0", textMuted:"#64748b", textDim:"#334155",
    inputBorder:"#1e293b", danger:"#ef4444",
    font:"'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
    mono:"'JetBrains Mono', 'SF Mono', monospace",
  };
  const inputStyle = { width:"100%", padding:"14px 16px", background:V.card, border:"1px solid "+V.inputBorder, borderRadius:"10px", color:V.text, fontSize:"14px", fontFamily:V.font, outline:"none", transition:"all 0.2s", boxSizing:"border-box" };
  const labelStyle = { display:"block", fontSize:"13px", fontWeight:500, color:V.textMuted, marginBottom:"8px" };

  return (
    <div style={{ minHeight:"100vh", background:V.bg, color:V.text, fontFamily:V.font, position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800,900&display=swap');
        *{box-sizing:border-box;}
        input:focus,textarea:focus{border-color:${V.accent}!important;box-shadow:0 0 0 3px ${V.accentGlow}!important;}
        input::placeholder,textarea::placeholder{color:${V.textDim};}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:0.5;}50%{opacity:1;}}
        @keyframes gridMove{0%{transform:translateY(0);}100%{transform:translateY(40px);}}
      `}</style>

      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient("+V.cardBorder+" 1px,transparent 1px),linear-gradient(90deg,"+V.cardBorder+" 1px,transparent 1px)", backgroundSize:"40px 40px", opacity:0.3, pointerEvents:"none", animation:"gridMove 20s linear infinite" }} />
      <div style={{ position:"fixed", top:"-400px", left:"50%", transform:"translateX(-50%)", width:"900px", height:"700px", background:"radial-gradient(ellipse,"+V.accentGlow+" 0%,transparent 65%)", pointerEvents:"none" }} />

      <div style={{ maxWidth:"680px", margin:"0 auto", padding:"48px 20px", position:"relative", zIndex:1 }}>
        {/* NAV */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"48px", animation:"fadeIn 0.5s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:"linear-gradient(135deg,"+V.accent+",#60a5fa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:800, color:"#fff", fontFamily:V.mono }}>C</div>
            <span style={{ fontSize:"16px", fontWeight:700, letterSpacing:"-0.03em" }}>ColdCraft</span>
            <span style={{ fontSize:"10px", fontWeight:600, color:V.accent, background:V.accentSoft, padding:"2px 8px", borderRadius:"6px", letterSpacing:"0.05em" }}>AI</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 14px", borderRadius:"100px", border:"1px solid "+(isLocked?"rgba(239,68,68,0.3)":V.cardBorder), background:isLocked?"rgba(239,68,68,0.06)":V.card, fontFamily:V.mono, fontSize:"12px", color:isLocked?V.danger:V.textMuted }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:isLocked?V.danger:V.green, boxShadow:"0 0 6px "+(isLocked?V.danger:V.green) }} />
            {usageCount}/{MAX_FREE} free
          </div>
        </div>

        {/* HERO */}
        <div style={{ textAlign:"center", marginBottom:"48px", animation:"fadeIn 0.6s" }}>
          <h1 style={{ fontSize:"clamp(36px,7vw,56px)", fontWeight:800, lineHeight:1.05, margin:"0 0 16px", letterSpacing:"-0.04em" }}>
            Cold emails that<br/><span style={{ background:"linear-gradient(135deg,"+V.accent+",#60a5fa,"+V.green+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>actually convert</span>
          </h1>
          <p style={{ fontSize:"16px", color:V.textMuted, lineHeight:1.6, maxWidth:"460px", margin:"0 auto" }}>Generate hyper-personalized outreach in seconds. Pick your tone, define your target, let AI do the rest.</p>
        </div>

        {/* STATS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1px", background:V.cardBorder, borderRadius:"12px", overflow:"hidden", marginBottom:"40px", animation:"fadeIn 0.7s" }}>
          {STATS.map((s,i) => (
            <div key={i} style={{ background:V.card, padding:"20px 16px", textAlign:"center" }}>
              <div style={{ fontSize:"24px", fontWeight:800, fontFamily:V.mono, letterSpacing:"-0.03em", background:"linear-gradient(135deg,"+V.accent+","+V.green+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{s.value}</div>
              <div style={{ fontSize:"11px", color:V.textMuted, marginTop:"4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* MODE */}
        <div style={{ display:"flex", gap:"4px", padding:"4px", background:V.card, border:"1px solid "+V.cardBorder, borderRadius:"14px", marginBottom:"28px", animation:"fadeIn 0.8s" }}>
          {[{id:"single",label:"Single Email",icon:"✉️"},{id:"sequence",label:"3-Email Sequence",icon:"📧"}].map(m=>(
            <button key={m.id} onClick={()=>setMode(m.id)} style={{ flex:1, padding:"12px", background:mode===m.id?V.accentSoft:"transparent", border:mode===m.id?"1px solid "+V.accentBorder:"1px solid transparent", borderRadius:"10px", color:mode===m.id?V.accent:V.textMuted, fontSize:"13px", fontFamily:"inherit", fontWeight:mode===m.id?600:400, cursor:"pointer", transition:"all 0.2s" }}>{m.icon} {m.label}</button>
          ))}
        </div>

        {/* FORM */}
        <div style={{ background:V.card, border:"1px solid "+V.cardBorder, borderRadius:"14px", padding:"28px", marginBottom:"20px", animation:"fadeIn 0.9s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"24px", paddingBottom:"16px", borderBottom:"1px solid "+V.cardBorder }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:V.accent, boxShadow:"0 0 8px "+V.accentGlow }} />
            <span style={{ fontSize:"14px", fontWeight:600 }}>Prospect Details</span>
          </div>
          <div style={{ display:"grid", gap:"18px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <div><label style={labelStyle}>Company *</label><input style={inputStyle} placeholder="Stripe" maxLength={100} value={formData.company} onChange={e=>update("company",e.target.value)} /></div>
              <div><label style={labelStyle}>Recipient's Role *</label><input style={inputStyle} placeholder="Head of Sales" maxLength={100} value={formData.role} onChange={e=>update("role",e.target.value)} /></div>
            </div>
            <div><label style={labelStyle}>Industry <span style={{color:V.textDim}}>(optional)</span></label><input style={inputStyle} placeholder="Fintech, SaaS, E-commerce" maxLength={100} value={formData.industry} onChange={e=>update("industry",e.target.value)} /></div>
            <div><label style={labelStyle}>What you offer *</label><textarea style={{...inputStyle,minHeight:"80px",resize:"vertical",lineHeight:1.5}} placeholder="We help B2B SaaS companies book 30+ demos/month" maxLength={500} value={formData.offer} onChange={e=>update("offer",e.target.value)} /></div>
            <div><label style={labelStyle}>Social proof <span style={{color:V.textDim}}>(optional)</span></label><input style={inputStyle} placeholder="Helped Acme Corp 3x their reply rate in 60 days" maxLength={300} value={formData.proof} onChange={e=>update("proof",e.target.value)} /></div>
          </div>
        </div>

        {/* TONE & GOAL */}
        <div style={{ background:V.card, border:"1px solid "+V.cardBorder, borderRadius:"14px", padding:"28px", marginBottom:"20px", animation:"fadeIn 1s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"24px", paddingBottom:"16px", borderBottom:"1px solid "+V.cardBorder }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:V.green, boxShadow:"0 0 8px rgba(16,185,129,0.3)" }} />
            <span style={{ fontSize:"14px", fontWeight:600 }}>Output Settings</span>
          </div>
          <div style={{ marginBottom:"20px" }}>
            <label style={{...labelStyle,display:"flex",justifyContent:"space-between"}}><span>Tone</span><span style={{fontSize:"11px",color:V.accent,fontWeight:400}}>Select up to 2</span></label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {TONES.map(t=>(
                <button key={t} onClick={()=>toggleTone(t)} style={{ padding:"8px 18px", borderRadius:"100px", border:"1px solid "+(formData.tones.includes(t)?V.accent:V.inputBorder), background:formData.tones.includes(t)?V.accentSoft:"transparent", color:formData.tones.includes(t)?V.accent:V.textMuted, fontSize:"13px", fontFamily:"inherit", fontWeight:formData.tones.includes(t)?600:500, cursor:"pointer", transition:"all 0.2s", opacity:!formData.tones.includes(t)&&formData.tones.length>=2?0.35:1 }}>
                  {formData.tones.includes(t)&&<span style={{marginRight:"4px"}}>●</span>}{t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Goal</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {GOALS.map(g=>(
                <button key={g} onClick={()=>setFormData(p=>({...p,goal:g}))} style={{ padding:"8px 18px", borderRadius:"100px", border:"1px solid "+(formData.goal===g?"rgba(16,185,129,0.5)":V.inputBorder), background:formData.goal===g?V.greenSoft:"transparent", color:formData.goal===g?V.green:V.textMuted, fontSize:"13px", fontFamily:"inherit", fontWeight:formData.goal===g?600:500, cursor:"pointer", transition:"all 0.2s" }}>
                  {formData.goal===g&&<span style={{marginRight:"4px"}}>●</span>}{g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GENERATE */}
        <button onClick={isLocked?()=>window.open("https://buy.stripe.com/test_eVq3cx9gR2LOf0U4RLbAs00","_blank"):handleGenerate} disabled={!canSubmit&&!isLocked} style={{
          width:"100%", padding:"18px", marginBottom:"32px",
          background:canSubmit?"linear-gradient(135deg,"+V.accent+",#2563eb)":isLocked?"linear-gradient(135deg,#7c3aed,#6d28d9)":V.card,
          border:canSubmit?"1px solid "+V.accent:isLocked?"1px solid rgba(124,58,237,0.4)":"1px solid "+V.cardBorder,
          borderRadius:"12px", color:canSubmit||isLocked?"#fff":V.textDim,
          fontSize:"15px", fontWeight:700, fontFamily:"inherit", cursor:canSubmit||isLocked?"pointer":"not-allowed",
          boxShadow:canSubmit?"0 4px 20px "+V.accentGlow:"none", animation:"fadeIn 1.1s",
        }}>
          {generating?<span style={{animation:"pulse 1.2s infinite"}}>Generating...</span>:isLocked?"Unlock Unlimited → $9/mo":<>Generate {mode==="sequence"?"Sequence":"Email"} <span style={{opacity:0.6}}>→</span></>}
        </button>

        {error&&<div style={{ marginBottom:"24px", padding:"14px 18px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"10px", fontSize:"13px", color:"#f87171", animation:"fadeIn 0.3s" }}>{error}</div>}

        {/* RESULTS */}
        {results.length>0&&(
          <div ref={resultRef} style={{ marginBottom:"32px", animation:"fadeIn 0.4s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:V.green, boxShadow:"0 0 6px "+V.green }} />
                <span style={{ fontSize:"13px", fontWeight:600, color:V.textMuted }}>Generated Email{results.length>1?"s":""}</span>
              </div>
              <button onClick={copyToClipboard} style={{ padding:"6px 16px", borderRadius:"100px", background:copied?V.greenSoft:V.card, border:"1px solid "+(copied?V.greenBorder:V.cardBorder), color:copied?V.green:V.textMuted, fontSize:"12px", fontFamily:"inherit", fontWeight:500, cursor:"pointer" }}>
                {copied?"✓ Copied":results.length>1?"Copy Both":"Copy"}
              </button>
            </div>
            {results.length>1&&(
              <div style={{ display:"flex", gap:"4px", marginBottom:"12px", background:V.card, borderRadius:"10px", padding:"4px", border:"1px solid "+V.cardBorder }}>
                {results.map((r,i)=>(
                  <button key={i} onClick={()=>setActiveResultTab(i)} style={{ flex:1, padding:"10px 14px", background:activeResultTab===i?V.accentSoft:"transparent", border:activeResultTab===i?"1px solid "+V.accentBorder:"1px solid transparent", borderRadius:"8px", color:activeResultTab===i?V.accent:V.textMuted, fontSize:"13px", fontFamily:"inherit", fontWeight:activeResultTab===i?600:400, cursor:"pointer" }}>{r.tone}</button>
                ))}
              </div>
            )}
            <div style={{ background:V.card, border:"1px solid "+V.cardBorder, borderRadius:"14px", padding:"24px", fontSize:"14px", lineHeight:1.75, color:"#cbd5e1", whiteSpace:"pre-wrap" }}>
              {results[results.length>1?activeResultTab:0]?.text}
            </div>
          </div>
        )}

        {/* EXAMPLES */}
        <div style={{ marginBottom:"32px" }}>
          <button onClick={()=>setShowExamples(!showExamples)} style={{ width:"100%", padding:"14px", background:V.card, border:"1px solid "+V.cardBorder, borderRadius:"12px", color:V.textMuted, fontSize:"13px", fontFamily:"inherit", fontWeight:500, cursor:"pointer" }}>
            {showExamples?"Hide":"View"} example emails {showExamples?"↑":"↓"}
          </button>
          {showExamples&&(
            <div style={{ marginTop:"12px", animation:"fadeIn 0.3s" }}>
              <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
                {EXAMPLE_EMAILS.map((_,i)=>(
                  <button key={i} onClick={()=>setActiveExample(i)} style={{ padding:"8px 16px", borderRadius:"8px", border:"1px solid "+(activeExample===i?V.accentBorder:V.cardBorder), background:activeExample===i?V.accentSoft:"transparent", color:activeExample===i?V.accent:V.textMuted, fontSize:"12px", fontFamily:"inherit", cursor:"pointer" }}>{EXAMPLE_EMAILS[i].tone}</button>
                ))}
              </div>
              <div style={{ background:V.card, border:"1px solid "+V.cardBorder, borderRadius:"14px", padding:"20px" }}>
                <div style={{ fontSize:"13px", color:V.accent, fontWeight:600, marginBottom:"12px", fontFamily:V.mono }}>Subject: {EXAMPLE_EMAILS[activeExample].subject}</div>
                <div style={{ fontSize:"13px", color:V.textMuted, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{EXAMPLE_EMAILS[activeExample].body}</div>
              </div>
            </div>
          )}
        </div>

        {/* PRO */}
        <div style={{ position:"relative", overflow:"hidden", borderRadius:"16px", padding:"32px", background:"linear-gradient(135deg,rgba(59,130,246,0.06),rgba(16,185,129,0.04))", border:"1px solid "+V.accentBorder, textAlign:"center", marginBottom:"40px" }}>
          <div style={{ position:"absolute", top:"12px", left:"12px", width:"24px", height:"24px", borderLeft:"2px solid "+V.accent, borderTop:"2px solid "+V.accent, borderRadius:"4px 0 0 0", opacity:0.3 }} />
          <div style={{ position:"absolute", bottom:"12px", right:"12px", width:"24px", height:"24px", borderRight:"2px solid "+V.green, borderBottom:"2px solid "+V.green, borderRadius:"0 0 4px 0", opacity:0.3 }} />
          <div style={{ display:"inline-block", padding:"4px 12px", borderRadius:"100px", background:V.accentSoft, border:"1px solid "+V.accentBorder, fontSize:"11px", fontWeight:600, color:V.accent, letterSpacing:"0.05em", marginBottom:"16px", fontFamily:V.mono }}>PRO</div>
          <h3 style={{ fontSize:"22px", fontWeight:800, margin:"0 0 8px", letterSpacing:"-0.03em" }}>Unlimited cold emails for <span style={{color:V.accent}}>$9/mo</span></h3>
          <p style={{ fontSize:"14px", color:V.textMuted, lineHeight:1.6, maxWidth:"380px", margin:"0 auto 24px" }}>Unlimited generations, multi-tone comparison, 3-email sequences, no ads, priority support.</p>
          <button onClick={()=>window.open("https://buy.stripe.com/test_eVq3cx9gR2LOf0U4RLbAs00","_blank")} style={{ padding:"14px 36px", background:"linear-gradient(135deg,"+V.accent+",#2563eb)", border:"none", borderRadius:"100px", color:"#fff", fontSize:"14px", fontWeight:700, fontFamily:"inherit", cursor:"pointer", boxShadow:"0 4px 16px "+V.accentGlow }}>
            Start Free Trial →
          </button>
        </div>

        {/* FOOTER */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"20px", borderTop:"1px solid "+V.cardBorder, fontSize:"11px", color:V.textDim }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <div style={{ width:"16px", height:"16px", borderRadius:"4px", background:"linear-gradient(135deg,"+V.accent+",#60a5fa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8px", fontWeight:800, color:"#fff", fontFamily:V.mono }}>C</div>
            ColdCraft AI
          </div>
          <div>© 2026</div>
        </div>
      </div>
    </div>
  );
}
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
