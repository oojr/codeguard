const crypto = require("crypto");
const fs = require("fs");

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return "0x" + hashSum.digest("hex");
}

module.exports = { hashFile };
