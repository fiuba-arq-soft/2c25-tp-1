export function setRandomExchange(userContext, events, done) {
    const currencies = ['USD', 'EUR', 'ARS', 'BRL'];

    const pick = () => currencies[Math.floor(Math.random() * currencies.length)];
    let base = pick();
    let counter = pick();
    while (counter === base) counter = pick();

    const randAmount = () => +(Math.random() * (10 - 1) + 1).toFixed(2);

    userContext.vars.baseCurrency = base;
    userContext.vars.counterCurrency = counter;
    userContext.vars.baseAmount = randAmount();

    return done();
}
export function metricsByEndpoint_beforeRequest(req, userContext, events, done) {
    return done();
}
export function metricsByEndpoint_afterResponse(req, res, userContext, events, done) {
    return done();
}
