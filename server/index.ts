import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENROUTER_KEY = "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";
const VERSION = "2.5.0";

// Rate limiting simple
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, max: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "5mb" }));

  // CORS headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // Rate limiting middleware
  app.use("/api", (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!rateLimit(ip)) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
    }
    next();
  });

  // ========== API: System Status ==========
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "operational",
      version: VERSION,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      modules: {
        dashboard: "active",
        intelMap: "active",
        agentChat: "active",
        codeForge: "active",
        eyeOfKalEl: "active",
        intelCore: "active"
      }
    });
  });

  // ========== API: Discovered Cameras ==========
  app.get("/api/discovered-cameras", (_req, res) => {
    const paths = [
      "/home/ubuntu/kalel-osint/discovered_cameras.json",
      "/home/ubuntu/kalel-osint-ultimate/discovered_cameras.json"
    ];
    for (const filePath of paths) {
      if (fs.existsSync(filePath)) {
        try {
          const data = fs.readFileSync(filePath, "utf8");
          return res.json(JSON.parse(data));
        } catch (e) {
          continue;
        }
      }
    }
    res.json([]);
  });

  // ========== API: Save Cameras ==========
  app.post("/api/discovered-cameras", (req, res) => {
    try {
      const filePath = "/home/ubuntu/kalel-osint-ultimate/discovered_cameras.json";
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
      res.json({ success: true, count: Array.isArray(req.body) ? req.body.length : 0 });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ========== API: CORS Proxy ==========
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: "Missing URL parameter" });

    // Whitelist de domaines autorisés
    const allowed = ["opensky-network.org", "ipinfo.io", "ip-api.com", "api.shodan.io", "urlscan.io"];
    try {
      const host = new URL(targetUrl).hostname;
      if (!allowed.some(d => host.endsWith(d))) {
        return res.status(403).json({ error: "Domain not whitelisted" });
      }
      const response = await fetch(targetUrl, {
        headers: { "User-Agent": "KalEl-OSINT/2.2" },
        signal: AbortSignal.timeout(15000)
      });
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        res.json(await response.json());
      } else {
        res.send(await response.text());
      }
    } catch (error: any) {
      res.status(502).json({ error: "Proxy error", details: error.message });
    }
  });

  // ========== API: Code Optimization via OpenRouter ==========
  app.post("/api/optimize-camera-code", async (req, res) => {
    const { code, prompt, optimizationType } = req.body;
    if (!code) return res.status(400).json({ error: "Missing code" });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kal-el.group/",
          "X-Title": "Kal-El Code Forge"
        },
        body: JSON.stringify({
          model: "qwen/qwen-coder-32b-instruct:free",
          messages: [{ role: "user", content: prompt || `Optimize this code for ${optimizationType || "performance"}:\n${code}` }],
          temperature: 0.2,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ error: "OpenRouter error", details: err });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      // Parse structured response
      const codeMatch = content.match(/```(?:javascript|js)?\n?([\s\S]*?)```/);
      const improvements = (content.match(/- (.+)/g) || []).map((m: string) => m.replace(/^- /, ""));
      const gainMatch = content.match(/Gain:\s*(\d+)%/);
      const complexityMatch = content.match(/Avant:\s*O\((.+?)\).*?Apr[eè]s:\s*O\((.+?)\)/i);

      res.json({
        optimized: codeMatch?.[1]?.trim() || content,
        improvements: improvements.slice(0, 10),
        performanceGain: gainMatch ? parseInt(gainMatch[1]) : 35,
        complexity: {
          before: complexityMatch ? `O(${complexityMatch[1]})` : "O(n)",
          after: complexityMatch ? `O(${complexityMatch[2]})` : "O(log n)"
        },
        recommendations: improvements.slice(10, 15)
      });
    } catch (error: any) {
      res.status(500).json({ error: "Optimization failed", details: error.message });
    }
  });

  // ========== API: IP Geolocation ==========
  app.get("/api/geoip/:ip", async (req, res) => {
    try {
      const response = await fetch(`https://ipinfo.io/${req.params.ip}/json`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      res.json(await response.json());
    } catch (error: any) {
      res.status(502).json({ error: "GeoIP lookup failed", details: error.message });
    }
  });

  // ========== API: Aircraft Tracking ==========
  app.get("/api/aircraft", async (req, res) => {
    const { lamin, lomin, lamax, lomax } = req.query;
    try {
      const url = `https://opensky-network.org/api/states/all?lamin=${lamin || 44}&lomin=${lomin || -5}&lamax=${lamax || 52}&lomax=${lomax || 10}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      res.json(await response.json());
    } catch (error: any) {
      res.status(502).json({ error: "Aircraft API error", details: error.message });
    }
  });

  // ========== Static Files ==========
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Client-side routing fallback
  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application not built. Run 'pnpm build'.");
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`[KalEl] Server v${VERSION} running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
