const logger = require("../utils/Logging/logger");

module.exports = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
    next();
};
