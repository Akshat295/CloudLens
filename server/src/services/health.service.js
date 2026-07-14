const healthService = () => {
    return {
        message: "Server is running",
        timestamp: new Date()
    };
};

module.exports = healthService;