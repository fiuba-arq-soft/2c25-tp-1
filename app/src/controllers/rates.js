// Rates Controller
import { listRates, upsertRate } from "../services/ratesService.js";

export async function getRatesController(req, res) {
  const rates = await listRates();
  res.json(rates);
}

export async function putRatesController(req, res) {
  const { baseCurrency, counterCurrency, rate } = req.body;
  if (!baseCurrency || !counterCurrency || rate === undefined) {
    return res.status(400).json({ error: "Malformed request" });
  }
  const rates = await upsertRate({ baseCurrency, counterCurrency, rate });
  res.json(rates);
}
