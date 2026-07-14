const { scanInfrastructure } = require("../services/scanner/scanner.service");

const scan = async (req, res) => {
  try {
    const result = await scanInfrastructure();

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  scan,
};