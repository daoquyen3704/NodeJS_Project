const logger = require("../utils/Logs/logger");

module.exports = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
    next();
};
