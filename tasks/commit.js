require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { hashFile } = require("./utils");

// Resolve Foundry ABI output
const artifactPath = path.join(
  __dirname,
  "../out/AgentIntegrityLog.sol/AgentIntegrityLog.json",
);
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

async function loadSigner(provider) {
  const keystorePath =
    process.env.MONAD_KEYSTORE_PATH ||
    path.join(process.env.HOME, ".foundry/keystores/monad-deployer");
  const passwordFile =
    process.env.MONAD_KEYSTORE_PASSWORD_FILE ||
    path.join(process.env.HOME, ".monad-keystore-password");

  if (fs.existsSync(keystorePath) && fs.existsSync(passwordFile)) {
    const password = fs.readFileSync(passwordFile, "utf8").trim();
    const json = fs.readFileSync(keystorePath, "utf8");
    console.log(`🔑 Using keystore: ${keystorePath}`);
    const wallet = await ethers.Wallet.fromEncryptedJson(json, password);
    return wallet.connect(provider);
  }

  if (process.env.PRIVATE_KEY) {
    console.log("⚠️  No keystore found — falling back to PRIVATE_KEY.");
    return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  }

  throw new Error(
    "No keystore (MONAD_KEYSTORE_PATH / MONAD_KEYSTORE_PASSWORD_FILE) or PRIVATE_KEY found for integrity:commit.",
  );
}

async function main() {
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || "http://127.0.0.1:8545",
  );
  const wallet = await loadSigner(provider);
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS environment variable is missing.");
  }

  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

  // Track package-lock.json as an example
  const targetFilePath = path.join(__dirname, "../package-lock.json");
  const fileId = ethers.id("package-lock.json");
  const fileHash = hashFile(targetFilePath);

  console.log(`\n--- COMMITTING INTEGRITY HASH ---`);
  console.log(`Signer: ${wallet.address}`);
  console.log(`Target: package-lock.json`);
  console.log(`File ID (Bytes32): ${fileId}`);
  console.log(`Generated Hash: ${fileHash}`);

  const tx = await contract.commit(fileId, fileHash);
  await tx.wait();
  console.log(`✅ Success! Tx Hash: ${tx.hash}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
