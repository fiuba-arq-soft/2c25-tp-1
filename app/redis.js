import Redis from "ioredis";

let redis;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// === LUA scripts para atomicidad ===
const LUA_RESERVE = `
local bal = tonumber(redis.call('HGET', KEYS[1], 'balance') or '0')
local hold = tonumber(redis.call('HGET', KEYS[1], 'hold') or '0')
local available = bal - hold
if available >= tonumber(ARGV[1]) then
    redis.call('HINCRBYFLOAT', KEYS[1], 'hold', ARGV[1])
    return 'OK'
else
    return 'INSUFFICIENT_FUNDS'
end
`;

const LUA_COMMIT = `
local hold = tonumber(redis.call('HGET', KEYS[1], 'hold') or '0')
if hold >= tonumber(ARGV[1]) then
    redis.call('HINCRBYFLOAT', KEYS[1], 'balance', -ARGV[1])
    redis.call('HINCRBYFLOAT', KEYS[1], 'hold', -ARGV[1])
    return 'OK'
else
    return 'INSUFFICIENT_HOLD'
end
`;

const LUA_ROLLBACK = `
local hold = tonumber(redis.call('HGET', KEYS[1], 'hold') or '0')
if hold >= tonumber(ARGV[1]) then
    redis.call('HINCRBYFLOAT', KEYS[1], 'hold', -ARGV[1])
    return 'OK'
else
    return 'INSUFFICIENT_HOLD'
end
`;

const LUA_CREDIT = `
redis.call('HINCRBYFLOAT', KEYS[1], 'balance', ARGV[1])
return 'OK'
`;

// === INICIALIZACIÓN ===
export async function init() {
    redis = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
    });

    console.log(`Redis connecting at ${REDIS_HOST}:${REDIS_PORT}`);
    await initializeDefaultData();
}

async function initializeDefaultData() {
    // Verificar si ya existen datos
    const accountsExist = await redis.exists('account:1');
    const ratesExist = await redis.exists('rate:ARS:USD');
    
    if (!accountsExist) {
        const defaultAccounts = [
            { id: 1, currency: "ARS", balance: 120000000, hold: 0 },
            { id: 2, currency: "USD", balance: 60000, hold: 0 },
            { id: 3, currency: "EUR", balance: 40000, hold: 0 },
            { id: 4, currency: "BRL", balance: 60000, hold: 0 }
        ];
        
        for (const account of defaultAccounts) {
            await redis.hset(`account:${account.id}`, account);
        }
        
        await redis.sadd('account_ids', ...defaultAccounts.map(a => a.id));
    }
    
    if (!ratesExist) {
        const defaultRates = {
            "ARS": { "BRL": 0.00360, "EUR": 0.00057, "USD": 0.00068 },
            "BRL": { "ARS": 277.3 },
            "EUR": { "ARS": 1741 },
            "USD": { "ARS": 1469 }
        };
        
        for (const [baseCurrency, rates] of Object.entries(defaultRates)) {
            for (const [counterCurrency, rate] of Object.entries(rates)) {
                await redis.set(`rate:${baseCurrency}:${counterCurrency}`, rate);
            }
        }
    }
}

// === OPERACIONES DE CUENTAS ===
export async function getAccount(accountId) {
    const account = await redis.hgetall(`account:${accountId}`);
    if (Object.keys(account).length === 0) return null;
    
    return {
        id: parseInt(account.id),
        currency: account.currency,
        balance: parseFloat(account.balance),
        hold: parseFloat(account.hold || 0)
    };
}

export async function getAccountByCurrency(currency) {
    const accountIds = await redis.smembers('account_ids');
    
    for (const id of accountIds) {
        const account = await getAccount(parseInt(id));
        if (account && account.currency === currency) {
            return account;
        }
    }
    return null;
}

export async function setAccountBalance(accountId, newBalance) {
    await redis.hset(`account:${accountId}`, 'balance', newBalance);
}

// === OPERACIONES DE FONDOS (TRANSACCIONALES) ===
export async function reserveFunds(accountId, amount) {
    try {
        const result = await redis.eval(LUA_RESERVE, 1, `account:${accountId}`, amount);
        return result === "OK";
    } catch (error) {
        console.error(`Error reserving funds for account ${accountId}:`, error);
        return false;
    }
}

export async function commitFunds(accountId, amount) {
    try {
        const result = await redis.eval(LUA_COMMIT, 1, `account:${accountId}`, amount);
        return result === "OK";
    } catch (error) {
        console.error(`Error committing funds for account ${accountId}:`, error);
        return false;
    }
}

export async function rollbackFunds(accountId, amount) {
    try {
        const result = await redis.eval(LUA_ROLLBACK, 1, `account:${accountId}`, amount);
        return result === "OK";
    } catch (error) {
        console.error(`Error rolling back funds for account ${accountId}:`, error);
        return false;
    }
}

export async function creditFunds(accountId, amount) {
    try {
        const result = await redis.eval(LUA_CREDIT, 1, `account:${accountId}`, amount);
        return result === "OK";
    } catch (error) {
        console.error(`Error crediting funds to account ${accountId}:`, error);
        return false;
    }
}

// === OPERACIONES DE RATES ===
export async function getRate(baseCurrency, counterCurrency) {
    const rate = await redis.get(`rate:${baseCurrency}:${counterCurrency}`);
    return rate ? parseFloat(rate) : null;
}

export async function setRate(baseCurrency, counterCurrency, rate) {
    await redis.set(`rate:${baseCurrency}:${counterCurrency}`, rate);
    const reciprocalRate = Number((1 / rate).toFixed(5));
    await redis.set(`rate:${counterCurrency}:${baseCurrency}`, reciprocalRate);
}

// === OPERACIONES DE LOG ===
export async function addLogEntry(logEntry) {
    await redis.lpush('transaction_log', JSON.stringify(logEntry));
    await redis.ltrim('transaction_log', 0, 9999);
}

// === OPERACIONES BULK (para compatibilidad) ===
export async function getAccounts() {
    const accountIds = await redis.smembers('account_ids');
    const accounts = [];
    
    for (const id of accountIds) {
        const account = await getAccount(parseInt(id));
        if (account) accounts.push(account);
    }
    
    return accounts;
}

export async function getRates() {
    const keys = await redis.keys('rate:*');
    const rates = {};
    
    for (const key of keys) {
        const [, baseCurrency, counterCurrency] = key.split(':');
        const rate = await redis.get(key);
        
        if (!rates[baseCurrency]) rates[baseCurrency] = {};
        rates[baseCurrency][counterCurrency] = parseFloat(rate);
    }
    
    return rates;
}

export async function getLog() {
    const entries = await redis.lrange('transaction_log', 0, 999);
    return entries.map(entry => JSON.parse(entry));
}

// === CONTROL DE TRANSACCIONES ===
export async function startTx(txid, metadata = {}) {
    try {
        await redis.hmset(`tx:${txid}`, {
            state: "pending",
            startedAt: Date.now(),
            ...metadata
        });
        return true;
    } catch (error) {
        console.error(`Error starting transaction ${txid}:`, error);
        return false;
    }
}

export async function setTxState(txid, state) {
    try {
        await redis.hset(`tx:${txid}`, "state", state);
        await redis.hset(`tx:${txid}`, "updatedAt", Date.now());
        return true;
    } catch (error) {
        console.error(`Error setting transaction state ${txid}:`, error);
        return false;
    }
}

export async function cleanupTx(txid) {
    try {
        await redis.del(`tx:${txid}`);
        return true;
    } catch (error) {
        console.error(`Error cleaning up transaction ${txid}:`, error);
        return false;
    }
}