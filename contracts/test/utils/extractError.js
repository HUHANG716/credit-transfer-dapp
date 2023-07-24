function extractError(msg) {
  const regex = /___(.*?)___/;
  const result = msg.match(regex);
  return result ? result[1] : msg;
}

module.exports = extractError;
