require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { hashFile } = require("./utils");

const artifactPath = path.join(
  __dirname,
  "../out/AgentIntegrityLog.sol/AgentIntegrityLog.json",
);
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

async function main() {
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || "http://127.0.0.1:8545",
  );
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS environment variable is missing.");
  }

  // Read-only view requires provider but no wallet signer
  const contract = new ethers.Contract(contractAddress, artifact.abi, provider);

  const targetFilePath = path.join(__dirname, "../package-lock.json");
  const fileId = ethers.id("package-lock.json");
  const localHash = hashFile(targetFilePath);

  console.log(`\n--- RUNNING ON-CHAIN INTEGRITY VERIFICATION ---`);
  const isValid = await contract.verify(fileId, localHash);

  if (isValid) {
    console.log(
      "✅ INTEGRITY PASSED: Local file matches verified blockchain state.\n",
    );
    process.exit(0);
  } else {
    console.error(
      "❌ INTEGRITY ALERT: Local hash does not match blockchain record! Blocked execution.\n",
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
