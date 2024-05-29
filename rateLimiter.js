const setRateLimit = require("express-rate-limit");
require('dotenv').config();

const rateLimitMiddleware = setRateLimit({
    windowMs: 60 * 1000,
    limit: process.env.RATE_LIMIT_PER_MIN,
    message: {
        status: "429 Too Many Requests",
        timestamp: new Date().toISOString(),
        msg: `You have exceeded the limit of ${perMin} requests per minute.`
    },
    headers: true,
});

module.exports = rateLimitMiddleware;