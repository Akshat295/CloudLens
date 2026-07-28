const sendSuccess = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
