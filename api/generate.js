// ============================================================
// COLDCRAFT AI â€” FORTRESS-LEVEL API SECURITY
// ============================================================

// --------------- RATE LIMITING ---------------
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 15; // max requests per IP per hour

// Burst protection â€” no more than 3 requests per minute
const burstLimitMap = new Map();
const BURST_WINDOW = 60 * 1000;
const BURST_MAX = 3;

// Global daily limit â€” protect your API credits
let dailyRequestCount = 0;
let dailyResetTime = Date.now() + 24 * 60 * 60 * 1000;
const DAILY_MAX = 500;

// Auto-ban after repeated violations
const blockedIPs = new Map();
const BLOCK_THRESHOLD = 5;
const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const violationMap = new Map();

function isBlocked(ip) {
  const block = blockedIPs.get(ip);
  if (!block) return false;
  if (Date.now() > block.until) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

function addViolation(ip) {
  const count = (violationMap.get(ip) || 0) + 1;
  violationMap.set(ip, count);
  if (count >= BLOCK_THRESHOLD) {
    blockedIPs.set(ip, { until: Date.now() + BLOCK_DURATION });
    return true;
  }
  return false;
}

function isRateLimited(ip) {
  const now = Date.now();

  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
  } else {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return "hourly";
  }

  const burst = burstLimitMap.get(ip);
  if (!burst || now - burst.windowStart > BURST_WINDOW) {
    burstLimitMap.set(ip, { windowStart: now, count: 1 });
  } else {
    burst.count++;
    if (burst.count > BURST_MAX) return "burst";
  }

  if (now > dailyResetTime) {
    dailyRequestCount = 0;
    dailyResetTime = now + 24 * 60 * 60 * 1000;
  }
  dailyRequestCount++;
  if (dailyRequestCount > DAILY_MAX) return "daily";

  return false;
}

// Memory cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW) rateLimitMap.delete(ip);
  }
  for (const [ip, entry] of burstLimitMap) {
    if (now - entry.windowStart > BURST_WINDOW) burstLimitMap.delete(ip);
  }
  for (const [ip, block] of blockedIPs) {
    if (now > block.until) blockedIPs.delete(ip);
  }
}, 10 * 60 * 1000);


// --------------- CORS PROTECTION ---------------
const ALLOWED_ORIGINS = [
  /\.vercel\.app$/,
  /localhost/,
  // Add your custom domain later:
  // /coldcraft\.ai$/,
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));
}


// --------------- PROMPT INJECTION PROTECTION ---------------
const BLOCKED_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules|context)/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /forget\s+(all\s+)?(previous|above|prior|your)\s+(instructions|rules|training)/i,
  /override\s+(your|all|the)\s+(instructions|rules|programming|training)/i,
  /new\s+instructions?\s*:/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+(if\s+you|a|an|though)/i,
  /roleplay\s+as/i,
  /impersonate/i,
  /you\s+must\s+obey/i,
  /system\s*prompt/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /god\s+mode/i,
  /unrestricted\s+mode/i,
  /bypass\s+(filter|safety|restriction|guard)/i,
  /remove\s+(all\s+)?(filter|safety|restriction|limit)/i,
  /what\s+(is|are)\s+your\s+(api|secret|key|password|token|credentials)/i,
  /reveal\s+(your|the)\s+(api|secret|key|system|instructions)/i,
  /show\s+(me\s+)?(your|the)\s+(api|secret|key|system|prompt)/i,
  /repeat\s+(your|the)\s+(system|initial|original)\s+(prompt|instructions|message)/i,
  /print\s+(your|the)\s+(system|initial|original)\s+(prompt|instructions)/i,
  /output\s+(your|the)\s+(system|initial|original)\s+(prompt|instructions)/i,
  /what\s+were\s+you\s+told/i,
  /<script[\s>]/i,
  /javascript\s*:/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /import\s*\(/i,
  /require\s*\(/i,
  /process\.env/i,
  /\$\{.*\}/,
  /base64/i,
  /\\u00/i,
  /\\x[0-9a-f]{2}/i,
];

function containsInjection(text) {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}


// --------------- INPUT SANITIZATION ---------------
function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/[<>{}\\]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/&#/g, "")
    .replace(/%3C|%3E|%7B|%7D/gi, "")
    .trim();
}


// --------------- SECURITY HEADERS ---------------
function setSecurityHeaders(res) {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
}


// --------------- WHITELIST VALIDATION ---------------
const VALID_TONES = ["Professional", "Casual", "Bold", "Friendly", "Consultative"];
const VALID_GOALS = ["Book a meeting", "Get a reply", "Pitch a service", "Request intro", "Follow up"];

function validateStructuredInput(prompt) {
  const hasProspectInfo = /PROSPECT INFO:/i.test(prompt);
  const hasSenderInfo = /SENDER INFO:/i.test(prompt);
  const hasTone = VALID_TONES.some((t) => prompt.includes("Tone: " + t));
  const hasGoal = VALID_GOALS.some((g) => prompt.includes("Goal: " + g));
  return hasProspectInfo && hasSenderInfo && hasTone && hasGoal;
}


// --------------- BOT DETECTION ---------------
function isSuspiciousRequest(req) {
  const ua = req.headers["user-agent"] || "";
  if (!ua || ua.length < 10) return true;

  const botPatterns = [
    /curl/i, /wget/i, /python-requests/i, /httpie/i,
    /postman/i, /insomnia/i, /scrapy/i, /phantomjs/i,
    /headless/i, /selenium/i, /puppeteer/i, /playwright/i,
    /http-client/i, /java\//i, /go-http/i, /node-fetch/i,
    /axios/i, /aiohttp/i, /okhttp/i,
  ];
  if (botPatterns.some((p) => p.test(ua))) return true;

  if (!req.headers.accept) return true;

  return false;
}


// ============================================================
// MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  setSecurityHeaders(res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get client IP
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim()
    || req.headers["x-real-ip"]
    || "unknown";

  // Check auto-block list
  if (isBlocked(ip)) {
    return res.status(403).json({ error: "Access denied." });
  }

  // CORS check
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  if (!isAllowedOrigin(origin || referer)) {
    addViolation(ip);
    return res.status(403).json({ error: "Forbidden" });
  }

  // Bot detection
  if (isSuspiciousRequest(req)) {
    addViolation(ip);
    return res.status(403).json({ error: "Forbidden" });
  }

  // Rate limiting (3 layers)
  const rateLimitResult = isRateLimited(ip);
  if (rateLimitResult) {
    addViolation(ip);
    const messages = {
      hourly: "Too many requests. Please try again later.",
      burst: "Slow down! Please wait a moment.",
      daily: "Service at capacity. Please try again tomorrow.",
    };
    return res.status(429).json({ error: messages[rateLimitResult] });
  }

  // Body validation
  if (!req.body || typeof req.body !== "object") {
    addViolation(ip);
    return res.status(400).json({ error: "Invalid request." });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    addViolation(ip);
    return res.status(400).json({ error: "Missing prompt." });
  }

  // Sanitize
  const cleanPrompt = sanitizeInput(prompt);

  // Length checks
  if (cleanPrompt.length > 2000) {
    addViolation(ip);
    return res.status(400).json({ error: "Input too long." });
  }
  if (cleanPrompt.trim().length < 10) {
    addViolation(ip);
    return res.status(400).json({ error: "Input too short." });
  }

  // Injection check
  if (containsInjection(cleanPrompt)) {
    addViolation(ip);
    return res.status(400).json({ error: "Invalid input detected." });
  }

  // Structure validation (only accept our expected prompt format)
  if (!validateStructuredInput(cleanPrompt)) {
    addViolation(ip);
    return res.status(400).json({ error: "Invalid request format." });
  }

  // API key check
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not configured");
    return res.status(500).json({ error: "Service configuration error." });
  }

  // Call Anthropic API with timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: cleanPrompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", JSON.stringify(data).slice(0, 200));
      return res.status(502).json({ error: "AI generation failed. Please try again." });
    }

    // Only return what the frontend needs (strip everything else)
    const safeResponse = {
      content: (data.content || []).map((block) => ({
        type: block.type,
        text: block.type === "text" ? block.text : undefined,
      })),
    };

    return res.status(200).json(safeResponse);
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Request timed out. Please try again." });
    }
    console.error("Server error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
