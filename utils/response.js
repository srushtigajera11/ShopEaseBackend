const sendResponse = (
  res,
  statusCode,
  message,
  data = null,
  meta = null,
  success = true
) => {
  const response = {
    success,
    message,
  };

  if (data !== null) response.data = data;
  if (meta) response.meta = meta;

  return res.status(statusCode).json(response);
};

module.exports = sendResponse;