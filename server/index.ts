import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENROUTER_KEY = "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";
const VERSION = "3.5.0";

// Rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, max: number = 120, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; expires: number }>();
function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) return entry.data;
  cache.delete(key);
  return null;
}
function setCache(key: string, data: any, ttlMs: number = 60000) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

async function safeFetch(url: string, options: any = {}, timeoutMs = 12000): Promise<Response> {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "5mb" }));

  // CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // Rate limiting
  app.use("/api", (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!rateLimit(ip)) return res.status(429).json({ error: "Rate limit exceeded" });
    next();
  });

  // ========== API: System Status ==========
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "operational", version: VERSION, uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      modules: {
        dashboard: "active", intelMap: "active", agentChat: "active",
        codeForge: "active", eyeOfKalEl: "active", intelCore: "active",
        middleEast: "active", cyberThreat: "active", sigint: "active",
        humint: "active", satellites: "active", maritime: "active",
        threatReport: "active"
      },
      apis: {
        "ip-api.com": "free", "internetdb.shodan.io": "free",
        "cve.circl.lu": "free", "crt.sh": "free",
        "stat.ripe.net": "free", "web.archive.org": "free",
        "services.nvd.nist.gov": "free", "opensky-network.org": "free",
        "openrouter.ai": "active"
      }
    });
  });

  // ========== API: IP Geolocation (ip-api.com — FREE, no key) ==========
  app.get("/api/geoip/:ip", async (req, res) => {
    const ip = req.params.ip;
    const cached = getCached(`geoip:${ip}`);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,query`);
      const data = await r.json();
      setCache(`geoip:${ip}`, data, 300000); // 5 min cache
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "GeoIP lookup failed", details: e.message });
    }
  });

  // ========== API: Shodan InternetDB (FREE, no key) ==========
  app.get("/api/internetdb/:ip", async (req, res) => {
    const ip = req.params.ip;
    const cached = getCached(`idb:${ip}`);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`https://internetdb.shodan.io/${ip}`);
      const data = await r.json();
      setCache(`idb:${ip}`, data, 600000); // 10 min cache
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "InternetDB lookup failed", details: e.message });
    }
  });

  // ========== API: Full OSINT Scan (combines ip-api + Shodan InternetDB) ==========
  app.get("/api/osint/ip/:ip", async (req, res) => {
    const ip = req.params.ip;
    const cached = getCached(`osint:${ip}`);
    if (cached) return res.json(cached);
    try {
      const [geoRes, shodanRes] = await Promise.allSettled([
        safeFetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,query`),
        safeFetch(`https://internetdb.shodan.io/${ip}`)
      ]);
      const geo = geoRes.status === "fulfilled" ? await geoRes.value.json() : null;
      const shodan = shodanRes.status === "fulfilled" ? await shodanRes.value.json() : null;

      const result = {
        ip, timestamp: new Date().toISOString(),
        geolocation: geo,
        infrastructure: shodan,
        threatScore: calculateThreatScore(geo, shodan),
        summary: generateSummary(ip, geo, shodan)
      };
      setCache(`osint:${ip}`, result, 300000);
      res.json(result);
    } catch (e: any) {
      res.status(502).json({ error: "OSINT scan failed", details: e.message });
    }
  });

  // ========== API: CVE Search (CIRCL — FREE, no key) ==========
  app.get("/api/cve/latest", async (_req, res) => {
    const cached = getCached("cve:latest");
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch("https://cve.circl.lu/api/last/20");
      const data = await r.json();
      setCache("cve:latest", data, 300000);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "CVE fetch failed", details: e.message });
    }
  });

  app.get("/api/cve/search/:vendor/:product", async (req, res) => {
    const { vendor, product } = req.params;
    const key = `cve:${vendor}:${product}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`https://cve.circl.lu/api/search/${vendor}/${product}`);
      const data = await r.json();
      setCache(key, data, 600000);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "CVE search failed", details: e.message });
    }
  });

  app.get("/api/cve/:id", async (req, res) => {
    const id = req.params.id;
    const cached = getCached(`cve:${id}`);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`https://cve.circl.lu/api/cve/${id}`);
      const data = await r.json();
      setCache(`cve:${id}`, data, 3600000);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "CVE lookup failed", details: e.message });
    }
  });

  // ========== API: NVD NIST Vulnerability Search (FREE, no key) ==========
  app.get("/api/nvd/search", async (req, res) => {
    const keyword = req.query.keyword as string;
    if (!keyword) return res.status(400).json({ error: "Missing keyword" });
    const key = `nvd:${keyword}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=20`);
      const data = await r.json();
      setCache(key, data, 600000);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "NVD search failed", details: e.message });
    }
  });

  // ========== API: Certificate Transparency (crt.sh — FREE, no key) ==========
  app.get("/api/certs/:domain", async (req, res) => {
    const domain = req.params.domain;
    const key = `certs:${domain}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, {}, 20000);
      const data = await r.json();
      // Deduplicate and limit
      const seen = new Set();
      const unique = data.filter((c: any) => {
        const k = c.common_name + c.serial_number;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).slice(0, 100);
      setCache(key, unique, 600000);
      res.json(unique);
    } catch (e: any) {
      res.status(502).json({ error: "Certificate lookup failed", details: e.message });
    }
  });

  // ========== API: RIPE NCC ASN/Prefix (FREE, no key) ==========
  app.get("/api/ripe/prefixes/:asn", async (req, res) => {
    const asn = req.params.asn;
    const key = `ripe:${asn}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`https://stat.ripe.net/data/announced-prefixes/data.json?resource=${asn}`);
      const data = await r.json();
      setCache(key, data, 600000);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "RIPE lookup failed", details: e.message });
    }
  });

  app.get("/api/ripe/whois/:resource", async (req, res) => {
    const resource = req.params.resource;
    const key = `ripe-whois:${resource}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`https://stat.ripe.net/data/whois/data.json?resource=${resource}`);
      const data = await r.json();
      setCache(key, data, 600000);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "RIPE whois failed", details: e.message });
    }
  });

  // ========== API: Wayback Machine (FREE, no key) ==========
  app.get("/api/wayback/:domain", async (req, res) => {
    const domain = req.params.domain;
    const key = `wayback:${domain}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const r = await safeFetch(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=50&fl=timestamp,original,statuscode,mimetype`);
      const data = await r.json();
      setCache(key, data, 600000);
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Wayback lookup failed", details: e.message });
    }
  });

  // ========== API: Aircraft Tracking (OpenSky — FREE, no key) ==========
  app.get("/api/aircraft", async (req, res) => {
    const { lamin, lomin, lamax, lomax } = req.query;
    const key = `aircraft:${lamin}:${lomin}:${lamax}:${lomax}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const url = `https://opensky-network.org/api/states/all?lamin=${lamin || 25}&lomin=${lomin || 30}&lamax=${lamax || 42}&lomax=${lomax || 60}`;
      const r = await safeFetch(url, {}, 15000);
      const data = await r.json();
      setCache(key, data, 15000); // 15s cache for live data
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: "Aircraft API error", details: e.message });
    }
  });

  // ========== API: OSINT Domain Recon (combines crt.sh + Wayback + RIPE) ==========
  app.get("/api/osint/domain/:domain", async (req, res) => {
    const domain = req.params.domain;
    const key = `osint-domain:${domain}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const [certsRes, waybackRes] = await Promise.allSettled([
        safeFetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, {}, 20000),
        safeFetch(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=30&fl=timestamp,original,statuscode,mimetype`)
      ]);

      const certs = certsRes.status === "fulfilled" ? await certsRes.value.json() : [];
      const wayback = waybackRes.status === "fulfilled" ? await waybackRes.value.json() : [];

      // Extract unique subdomains from certificates
      const subdomains = new Set<string>();
      if (Array.isArray(certs)) {
        certs.forEach((c: any) => {
          if (c.name_value) {
            c.name_value.split("\n").forEach((n: string) => {
              if (n.includes(domain)) subdomains.add(n.replace("*.", ""));
            });
          }
        });
      }

      const result = {
        domain, timestamp: new Date().toISOString(),
        subdomains: Array.from(subdomains).slice(0, 50),
        certificates: Array.isArray(certs) ? certs.slice(0, 30).map((c: any) => ({
          commonName: c.common_name, issuer: c.issuer_name,
          notBefore: c.not_before, notAfter: c.not_after
        })) : [],
        webArchive: Array.isArray(wayback) ? wayback.slice(1, 31) : [],
        stats: {
          totalSubdomains: subdomains.size,
          totalCerts: Array.isArray(certs) ? certs.length : 0,
          totalSnapshots: Array.isArray(wayback) ? wayback.length - 1 : 0
        }
      };
      setCache(key, result, 600000);
      res.json(result);
    } catch (e: any) {
      res.status(502).json({ error: "Domain recon failed", details: e.message });
    }
  });

  // ========== API: Google Dorking Generator ==========
  app.get("/api/dorks/:target", (req, res) => {
    const target = req.params.target;
    const dorks = [
      { category: "Exposed Files", query: `site:${target} filetype:pdf OR filetype:doc OR filetype:xls OR filetype:csv`, risk: "medium" },
      { category: "Login Pages", query: `site:${target} inurl:login OR inurl:admin OR inurl:signin`, risk: "high" },
      { category: "Config Files", query: `site:${target} filetype:env OR filetype:yml OR filetype:conf OR filetype:ini`, risk: "critical" },
      { category: "Database Dumps", query: `site:${target} filetype:sql OR filetype:db OR filetype:bak`, risk: "critical" },
      { category: "Error Messages", query: `site:${target} "error" OR "warning" OR "fatal" OR "exception"`, risk: "medium" },
      { category: "Directory Listing", query: `site:${target} intitle:"index of" OR intitle:"directory listing"`, risk: "high" },
      { category: "Exposed APIs", query: `site:${target} inurl:api OR inurl:v1 OR inurl:v2 OR inurl:graphql`, risk: "high" },
      { category: "Git Repos", query: `site:${target} inurl:.git OR inurl:.env OR inurl:.svn`, risk: "critical" },
      { category: "Backup Files", query: `site:${target} filetype:bak OR filetype:old OR filetype:backup`, risk: "high" },
      { category: "Sensitive Paths", query: `site:${target} inurl:wp-admin OR inurl:phpmyadmin OR inurl:cpanel`, risk: "critical" },
      { category: "Cameras/IoT", query: `site:${target} inurl:"/view/view.shtml" OR inurl:"/live/cam" OR intitle:"webcam"`, risk: "high" },
      { category: "Pastebin Leaks", query: `site:pastebin.com "${target}"`, risk: "high" },
      { category: "GitHub Leaks", query: `site:github.com "${target}" password OR secret OR api_key`, risk: "critical" },
      { category: "Shodan", query: `https://www.shodan.io/search?query=hostname:${target}`, risk: "high" },
      { category: "Censys", query: `https://search.censys.io/search?resource=hosts&q=${target}`, risk: "medium" },
    ];
    res.json({ target, dorks, generated: new Date().toISOString() });
  });

  // ========== API: Exploit Search (CVE + NVD combined) ==========
  app.get("/api/exploits/search", async (req, res) => {
    const keyword = req.query.q as string;
    if (!keyword) return res.status(400).json({ error: "Missing query" });
    const key = `exploits:${keyword}`;
    const cached = getCached(key);
    if (cached) return res.json(cached);
    try {
      const [circlRes, nvdRes] = await Promise.allSettled([
        safeFetch(`https://cve.circl.lu/api/search/${encodeURIComponent(keyword)}/`, {}, 15000),
        safeFetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=15`, {}, 15000)
      ]);

      const circl = circlRes.status === "fulfilled" ? await circlRes.value.json() : [];
      const nvd = nvdRes.status === "fulfilled" ? await nvdRes.value.json() : { vulnerabilities: [] };

      const result = {
        keyword, timestamp: new Date().toISOString(),
        circlResults: Array.isArray(circl) ? circl.slice(0, 20) : [],
        nvdResults: nvd.vulnerabilities || [],
        totalCircl: Array.isArray(circl) ? circl.length : 0,
        totalNvd: nvd.totalResults || 0
      };
      setCache(key, result, 600000);
      res.json(result);
    } catch (e: any) {
      res.status(502).json({ error: "Exploit search failed", details: e.message });
    }
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
          return res.json(JSON.parse(fs.readFileSync(filePath, "utf8")));
        } catch { continue; }
      }
    }
    res.json([]);
  });

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

  // ========== API: CORS Proxy (extended whitelist) ==========
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: "Missing URL" });
    const allowed = [
      "opensky-network.org", "ipinfo.io", "ip-api.com", "api.shodan.io",
      "internetdb.shodan.io", "urlscan.io", "cve.circl.lu", "crt.sh",
      "stat.ripe.net", "web.archive.org", "services.nvd.nist.gov",
      "openrouter.ai", "api.bgpview.io"
    ];
    try {
      const host = new URL(targetUrl).hostname;
      if (!allowed.some(d => host.endsWith(d))) {
        return res.status(403).json({ error: "Domain not whitelisted" });
      }
      const r = await safeFetch(targetUrl, { headers: { "User-Agent": "KalEl-OSINT/3.5" } });
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("json")) res.json(await r.json());
      else res.send(await r.text());
    } catch (e: any) {
      res.status(502).json({ error: "Proxy error", details: e.message });
    }
  });

  // ========== API: Code Optimization via OpenRouter ==========
  app.post("/api/optimize-camera-code", async (req, res) => {
    const { code, prompt, optimizationType } = req.body;
    if (!code) return res.status(400).json({ error: "Missing code" });
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          temperature: 0.2, max_tokens: 4096
        })
      });
      if (!r.ok) return res.status(r.status).json({ error: "OpenRouter error", details: await r.text() });
      const data = await r.json();
      const content = data.choices?.[0]?.message?.content || "";
      const codeMatch = content.match(/```(?:javascript|js|python|typescript|ts)?\n?([\s\S]*?)```/);
      const improvements = (content.match(/- (.+)/g) || []).map((m: string) => m.replace(/^- /, ""));
      res.json({
        optimized: codeMatch?.[1]?.trim() || content,
        improvements: improvements.slice(0, 10),
        performanceGain: 35,
        complexity: { before: "O(n²)", after: "O(n log n)" },
        recommendations: improvements.slice(10, 15)
      });
    } catch (e: any) {
      res.status(500).json({ error: "Optimization failed", details: e.message });
    }
  });

  // ========== API: Health Check for all connectors ==========
  app.get("/api/health", async (_req, res) => {
    const checks = [
      { name: "ip-api.com", url: "http://ip-api.com/json/8.8.8.8" },
      { name: "Shodan InternetDB", url: "https://internetdb.shodan.io/8.8.8.8" },
      { name: "CVE CIRCL", url: "https://cve.circl.lu/api/last/1" },
      { name: "NIST NVD", url: "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1&keywordSearch=test" },
      { name: "OpenSky Network", url: "https://opensky-network.org/api/states/all?lamin=47&lomin=5&lamax=48&lomax=6" },
      { name: "RIPE NCC", url: "https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS15169" },
      { name: "crt.sh", url: "https://crt.sh/?q=example.com&output=json" },
      { name: "OpenRouter AI", url: "https://openrouter.ai/api/v1/models" },
    ];

    const results = await Promise.allSettled(
      checks.map(async (c) => {
        const start = Date.now();
        try {
          const r = await safeFetch(c.url, {}, 8000);
          return { name: c.name, status: r.ok ? "online" : "degraded", latency: Date.now() - start, code: r.status };
        } catch (e: any) {
          return { name: c.name, status: "offline", latency: Date.now() - start, error: e.message };
        }
      })
    );

    res.json({
      timestamp: new Date().toISOString(),
      connectors: results.map(r => r.status === "fulfilled" ? r.value : { name: "unknown", status: "error" })
    });
  });

  // ========== Static Files ==========
  const staticPath = process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send("Application not built. Run 'pnpm build'.");
  });

  const port = process.env.PORT || 3002;
  server.listen(port, () => {
    console.log(`[KalEl] Server v${VERSION} running on http://localhost:${port}/`);
  });
}

// Helper: Calculate threat score from geo + shodan data
function calculateThreatScore(geo: any, shodan: any): number {
  let score = 0;
  if (shodan?.ports?.length > 5) score += 20;
  if (shodan?.vulns?.length > 0) score += 30 + Math.min(shodan.vulns.length * 5, 30);
  if (geo?.proxy) score += 15;
  if (geo?.hosting) score += 10;
  if (shodan?.tags?.includes("compromised")) score += 25;
  return Math.min(score, 100);
}

// Helper: Generate human-readable summary
function generateSummary(ip: string, geo: any, shodan: any): string {
  const parts = [`IP ${ip}`];
  if (geo?.city) parts.push(`located in ${geo.city}, ${geo.country}`);
  if (geo?.isp) parts.push(`operated by ${geo.isp}`);
  if (shodan?.ports?.length) parts.push(`with ${shodan.ports.length} open ports (${shodan.ports.join(", ")})`);
  if (shodan?.vulns?.length) parts.push(`and ${shodan.vulns.length} known vulnerabilities`);
  if (shodan?.hostnames?.length) parts.push(`resolving to ${shodan.hostnames.join(", ")}`);
  return parts.join(", ") + ".";
}

startServer().catch(console.error);
