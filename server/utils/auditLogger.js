const logPasswordEvent = async ({ userId, email, event, ip }) => {
  const timestamp = new Date().toISOString();
  console.log(`[PASSWORD-AUDIT] ${timestamp} | user=${userId || 'unknown'} | email=${email || 'unknown'} | event=${event} | ip=${ip || 'unknown'}`);
};

module.exports = { logPasswordEvent };
