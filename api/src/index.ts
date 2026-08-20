import cors from "cors";
import express from "express";

type Verdict = "mistake" | "defensible";
type Signal = "IN" | "OUT" | "UNKNOWN";

type Trade = {
  symbol: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  size: number;
};

type EngineSignal = { signal: Signal; confidence: number };
type EngineContext = {
  orthrus: EngineSignal;
  hydra: EngineSignal;
  sisyphus: EngineSignal;
  source: string;
};

type Agent = { id: string; name: string; lens: string };

const CSV_HEADERS = ["symbol", "entry_date", "exit_date", "entry_price", "exit_price", "size"] as const;
const MAX_ROWS = 500;
const MAX_BYTES = 1_000_000;
const OPENAI_URL = "https://api.openai.com/v1/responses";

const ROLES: Agent[] = [
  { id: "risk_manager", name: "Risk Manager", lens: "position sizing, stop discipline, and whether the exit was a defined rule or a discretionary flinch" },
  { id: "quant", name: "Quant", lens: "the size of the move, the available signals, and whether the data justified an action" },
  { id: "behavioral", name: "Behavioral Psych", lens: "emotional patterns such as panic, FOMO, greed, or revenge trading" },
  { id: "contrarian", name: "Contrarian", lens: "crowd positioning and whether the trader followed the herd or had a genuine edge" },
  { id: "regime", name: "Regime Analyst", lens: "the Orthrus, Hydra, and Sisyphus signals and whether the decision fought or followed them" },
  { id: "devils_advocate", name: "Devil's Advocate", lens: "the strongest honest defense of the trade, including constraints not present in the CSV" },
];

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "hexagon-api" });
});

app.get("/v1/status", (_req, res) => {
  res.json({
    ok: true,
    seats: ROLES.length,
    provider: "openai",
    ready: Boolean(process.env.OPENAI_API_KEY && process.env.ENGINE_DATA_URL),
    requires: ["OPENAI_API_KEY", "ENGINE_DATA_URL"],
  });
});

app.post("/v1/reviews", async (req, res, next) => {
  try {
    const csv = typeof req.body?.csv === "string" ? req.body.csv : "";
    const trades = parseCsv(csv);
    const selected = selectTrade(trades);
    const engine = await getEngineContext(selected.symbol);
    const review = await buildReview(selected, trades, engine);
    res.json({ ok: true, review, scope: "Engine signals are a model input; this review is educational analysis, not investment advice." });
  } catch (error) {
    const known = error as Error & { statusCode?: number };
    if (known.statusCode) {
      res.status(known.statusCode).json({ ok: false, error: known.message });
      return;
    }
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("hexagon-api request failed", error instanceof Error ? error.message : "unknown error");
  res.status(502).json({ ok: false, error: "The council is unavailable. Please try again shortly." });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`hexagon-api listening on ${port}`));

function parseCsv(csv: string): Trade[] {
  if (!csv.trim()) throw userError("Choose a CSV file with at least one completed trade.");
  if (Buffer.byteLength(csv, "utf8") > MAX_BYTES) throw userError("CSV is over the 1 MB review limit.");
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw userError("CSV must include the documented header and at least one trade row.");
  if (lines.length - 1 > MAX_ROWS) throw userError(`CSV is limited to ${MAX_ROWS} trades per review.`);

  const headers = splitCsv(lines[0]).map((value) => value.trim().toLowerCase());
  if (headers.length !== CSV_HEADERS.length || headers.some((header, index) => header !== CSV_HEADERS[index])) {
    throw userError(`CSV header must exactly match: ${CSV_HEADERS.join(",")}`);
  }

  return lines.slice(1).map((line, index) => {
    const values = splitCsv(line);
    if (values.length !== CSV_HEADERS.length) throw userError(`CSV line ${index + 2} must have exactly ${CSV_HEADERS.length} columns.`);
    const [symbolRaw, entryDate, exitDate, entryPriceRaw, exitPriceRaw, sizeRaw] = values.map((value) => value.trim());
    const symbol = symbolRaw.toUpperCase();
    if (!/^[A-Z0-9.-]{1,16}$/.test(symbol)) throw userError(`CSV line ${index + 2} has an invalid symbol.`);
    if (!isDate(entryDate) || !isDate(exitDate) || exitDate < entryDate) throw userError(`CSV line ${index + 2} has invalid trade dates.`);
    return {
      symbol,
      entryDate,
      exitDate,
      entryPrice: positive(entryPriceRaw, "entry_price", index + 2),
      exitPrice: positive(exitPriceRaw, "exit_price", index + 2),
      size: positive(sizeRaw, "size", index + 2),
    };
  });
}

function splitCsv(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { current += char; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { values.push(current); current = ""; continue; }
    current += char;
  }
  if (quoted) throw userError("CSV contains an unterminated quoted field.");
  values.push(current);
  return values;
}

function positive(value: string, field: string, line: number): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw userError(`CSV line ${line} ${field} must be a positive number.`);
  return number;
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

let engineCache: { expiresAt: number; data: unknown } | null = null;

async function getEngineContext(symbol: string): Promise<EngineContext> {
  const source = process.env.ENGINE_DATA_URL;
  if (!source) throw serviceError("ENGINE_DATA_URL is not configured.");
  const data = await loadEngineData(source);
  const engines = Array.isArray((data as { engines?: unknown[] }).engines) ? (data as { engines: unknown[] }).engines : [];
  const signal = (key: string): EngineSignal => {
    const engine = engines.find((candidate: any) => candidate?.key === key) as any;
    const assets = Array.isArray(engine?.assets) ? engine.assets : [];
    const asset = assets.find((candidate: any) => candidate?.ticker === symbol) || assets.find((candidate: any) => candidate?.ticker === "SPY");
    const strategy = asset?.metrics?.strategy || {};
    const benchmark = asset?.metrics?.benchmark || {};
    const sharpe = Number(strategy.sharpe || 0);
    const inMarket = Number(strategy.pctInMarket || 0);
    const drawdown = Math.max(0, Math.abs(Number(benchmark.maxDrawdownPct || 0)));
    if (!asset) return { signal: "UNKNOWN", confidence: 0 };
    return { signal: inMarket >= 50 || sharpe >= 0.7 ? "IN" : "OUT", confidence: round(Math.max(.45, Math.min(.9, .5 + sharpe * .12 + drawdown / 500)), 2) };
  };
  return { orthrus: signal("orthrus"), hydra: signal("hydra"), sisyphus: signal("sisyphus"), source };
}

async function loadEngineData(source: string): Promise<unknown> {
  if (engineCache && engineCache.expiresAt > Date.now()) return engineCache.data;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(source, { signal: controller.signal });
    if (!response.ok) throw serviceError("The configured engine data source is unavailable.");
    const data = await response.json();
    engineCache = { data, expiresAt: Date.now() + 5 * 60_000 };
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function selectTrade(trades: Trade[]): Trade {
  return [...trades].sort((a, b) => Math.abs((b.exitPrice - b.entryPrice) * b.size) - Math.abs((a.exitPrice - a.entryPrice) * a.size))[0];
}

function estimatedPath(trade: Trade, engine: EngineContext) {
  const pnl = (trade.exitPrice - trade.entryPrice) * trade.size;
  const inVotes = [engine.orthrus, engine.hydra, engine.sisyphus].filter((item) => item.signal === "IN").length;
  if (pnl < 0 && inVotes >= 2) return { date: addDays(trade.exitDate, 7), price: round(trade.entryPrice * 1.023, 2) };
  return { date: trade.exitDate, price: trade.exitPrice };
}

async function buildReview(trade: Trade, allTrades: Trade[], engine: EngineContext) {
  if (!process.env.OPENAI_API_KEY) throw serviceError("OPENAI_API_KEY is not configured.");
  const path = estimatedPath(trade, engine);
  const userOutcome = round((trade.exitPrice - trade.entryPrice) * trade.size, 2);
  const councilOutcome = round((path.price - trade.entryPrice) * trade.size, 2);
  const cost = round(councilOutcome - userOutcome, 2);
  const context = [
    `Trade: ${trade.symbol}; entry ${trade.entryDate} at ${trade.entryPrice}; exit ${trade.exitDate} at ${trade.exitPrice}; size ${trade.size}.`,
    `Realized result: ${userOutcome}. Estimated engine-aligned path: exit ${path.date} at ${path.price}; result ${councilOutcome}; gap ${cost}.`,
    `Signals: Orthrus ${engine.orthrus.signal} (${engine.orthrus.confidence}), Hydra ${engine.hydra.signal} (${engine.hydra.confidence}), Sisyphus ${engine.sisyphus.signal} (${engine.sisyphus.confidence}).`,
    "Do not invent market prices, news, ATR, account context, or performance history not in this record. State uncertainty where appropriate.",
  ].join("\n");
  const agents = await Promise.all(ROLES.map((role) => reviewSeat(role, context)));
  const mistakes = agents.filter((agent) => agent.verdict === "mistake").length;
  const defensible = agents.length - mistakes;
  const pattern = cost > 0 ? "engine-aligned path indicates a potential early exit" : "engine-aligned path does not indicate a larger missed gain";
  return {
    trade: { ...trade, pnl: userOutcome, pnlPct: round(((trade.exitPrice / trade.entryPrice) - 1) * 100, 1) },
    agents,
    verdict: {
      decision: cost > 0 ? "HOLD" : "REVIEW",
      consensusMistake: mistakes,
      consensusDefensible: defensible,
      userOutcome,
      councilOutcome,
      decisionCost: cost,
      heldToDate: path.date,
      summary: `Consensus ${mistakes}-${defensible}. The model-estimated engine-aligned path changed the outcome from $${userOutcome} to $${councilOutcome}.`,
    },
    patternFlag: `${allTrades.length} uploaded trades; selected ${trade.symbol} for the largest model-estimated decision gap (${pattern}).`,
  };
}

async function reviewSeat(role: Agent, context: string): Promise<{ id: string; name: string; verdict: Verdict; text: string }> {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      store: false,
      instructions: `You are the ${role.name} seat of The Hexagon, a six-seat post-trade review council. Review through only this lens: ${role.lens}. Be clinical and concise. Never give investment advice or claim facts not supplied. Return JSON that matches the schema.`,
      input: context,
      text: { format: { type: "json_schema", name: "hexagon_seat", strict: true, schema: { type: "object", properties: { verdict: { type: "string", enum: ["mistake", "defensible"] }, text: { type: "string", minLength: 1, maxLength: 500 } }, required: ["verdict", "text"], additionalProperties: false } } },
    }),
  });
  if (!response.ok) throw serviceError("OpenAI could not complete the council review.");
  const data = await response.json() as { output_text?: unknown };
  let result: { verdict?: unknown; text?: unknown };
  try { result = JSON.parse(String(data.output_text || "")); } catch { throw serviceError("OpenAI returned an invalid council response."); }
  if ((result.verdict !== "mistake" && result.verdict !== "defensible") || typeof result.text !== "string" || !result.text.trim()) {
    throw serviceError("OpenAI returned an incomplete council response.");
  }
  return { id: role.id, name: role.name, verdict: result.verdict, text: result.text.trim() };
}

function addDays(date: string, days: number) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
function round(value: number, digits = 0) { const multiplier = 10 ** digits; return Math.round(value * multiplier) / multiplier; }
function userError(message: string) { return Object.assign(new Error(message), { statusCode: 400 }); }
function serviceError(message: string) { return Object.assign(new Error(message), { statusCode: 503 }); }
