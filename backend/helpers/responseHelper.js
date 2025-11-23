const handleError = (res, error, message, statusCode = 500) => {
  console.error(`${message}:`, error);
  res.status(statusCode).json({ error: message });
};

const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json(data);
};

const sendNotFound = (res, message = 'Resource not found') => {
  res.status(404).json({ error: message });
};

const sendBadRequest = (res, message) => {
  res.status(400).json({ error: message });
};

module.exports = {
  handleError,
  sendSuccess,
  sendNotFound,
  sendBadRequest
};
