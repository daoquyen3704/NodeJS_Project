const logger = require("../utils/Logging/logger");

module.exports = (err, req, res, next) => {
    logger.error(`Error: ${err.message} | URL: ${req.originalUrl}`);
    res.status(500).json({ message: "Internal Server Error" });
};
