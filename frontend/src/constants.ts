export const CONTRACT_ADDRESS = "0x25535A6d53459c5AF12299D44273f4da2184553D";
export const EXPLORER_URL = "https://testnet.monadvision.com/address";
export const RPC_URL = "https://testnet-rpc.monad.xyz";
export const CHAIN_ID = 10143;
export const FILE_NAME = "package-lock.json";

export const ABI = [
  {
    type: "function",
    name: "latestHash",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verify",
    inputs: [
      { name: "fileId", type: "bytes32" },
      { name: "currentContentHash", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Checkpointed",
    inputs: [
      { name: "fileId", type: "bytes32", indexed: true },
      { name: "contentHash", type: "bytes32", indexed: false },
      { name: "prevHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint64", indexed: false },
      { name: "agent", type: "address", indexed: true },
      { name: "index", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
];
