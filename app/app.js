import express from "express";
import {
  init as redisInit,
  setAccountBalance,
  getPendingTxs,
  getAccounts,
  getRates,
  setRate,
  getLog,
} from "./redis.js";
import {
  exchange,
} from "./exchange_redis.js";

await redisInit();

const pendingTxs = await getPendingTxs();

for (const tx of pendingTxs) {
    console.log(`Procesando tx pendiente: ${tx.id}`);
    await exchange(tx, true);
}

const app = express();
const port = 3000;

app.use(express.json());

// ACCOUNT endpoints

app.get("/accounts", async (req, res) => {
  try {
    const accounts = await getAccounts();
    res.json(accounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ACCOUNT endpoints
app.put("/accounts/:id/balance", async (req, res) => {
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || !balance) {
    return res.status(400).json({ error: "Malformed request" });
  }

  await setAccountBalance(accountId, balance);
  const accounts = await getAccounts(); 
  res.json(accounts);
});

// RATE endpoints
app.get("/rates", async (req, res) => {
  const rates = await getRates();
  res.json(rates);
});

app.put("/rates", async (req, res) => {
  const { baseCurrency, counterCurrency, rate } = req.body;

  if (!baseCurrency || !counterCurrency || !rate) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const newRateRequest = { ...req.body };
  await setRate(newRateRequest);
  const rates = await getRates();
  res.json(rates);
});

// LOG endpoint
app.get("/log", async (req, res) => {
  const log = await getLog();
  res.json(log);
});

// EXCHANGE endpoint

app.post("/exchange", async (req, res) => {
  const {
    baseCurrency,
    counterCurrency,
    baseAccountId,
    counterAccountId,
    baseAmount,
  } = req.body;

  if (
    !baseCurrency ||
    !counterCurrency ||
    !baseAccountId ||
    !counterAccountId ||
    !baseAmount
  ) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const exchangeRequest = { ...req.body };
  const exchangeResult = await exchange(exchangeRequest);

  res.status(exchangeResult.status).json(exchangeResult);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Exchange API listening on port ${port}`);
});

export default app;
