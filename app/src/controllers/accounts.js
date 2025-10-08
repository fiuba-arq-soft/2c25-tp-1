// Accounts Controller
import {
  listAccounts,
  updateAccountBalance,
} from "../services/accountsService.js";

export async function getAccountsController(req, res) {
  try {
    const accounts = await listAccounts();
    res.json(accounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function putAccountBalanceController(req, res) {
  const accountId = req.params.id;
  const { balance } = req.body;

  if (!accountId || balance === undefined) {
    return res.status(400).json({ error: "Malformed request" });
  }

  const accounts = await updateAccountBalance(accountId, balance);
  res.json(accounts);
}
