const setRateLimit = require("express-rate-limit");


const perMin = 3
const rateLimitMiddleware = setRateLimit({
    windowMs: 60 * 1000,
    limit: perMin,
    message: {
        status: "429 Too Many Requests",
        timestamp: new Date().toISOString(),
        msg: `You have exceeded the limit of ${perMin} requests per minute.`
    },
    headers: true,
});

module.exports = rateLimitMiddleware;