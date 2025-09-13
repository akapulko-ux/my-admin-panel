const crypto = require('crypto');

function uuidFromString(input) {
  const hash = crypto.createHash('sha1').update(String(input)).digest();
  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = bytes.toString('hex');
  return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`;
}

module.exports = { uuidFromString };


