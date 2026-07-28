const { scanInfrastructure } = require("../services/scanner/scanner.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const scan = asyncHandler(async (req, res) => {
  const result = await scanInfrastructure();

  sendSuccess(res, result);
});

module.exports = {
  scan,
};
