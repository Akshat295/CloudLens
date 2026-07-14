const healthService = require("../services/health.service");

const checkHealth = (req, res) => {
    const data = healthService();

    res.status(200).json({
        success: true,
        data
    });
};

module.exports = {
    checkHealth
};