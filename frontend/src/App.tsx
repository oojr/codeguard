import { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  RPC_URL,
  ABI,
  FILE_NAME,
  EXPLORER_URL,
} from "./constants";

// Modes for local hash acquisition
type Mode = "manual" | "live";

export default function App() {
  const [localHash, setLocalHash] = useState<string>("");
  const [onChainHash, setOnChainHash] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode] = useState<Mode>(
    (import.meta.env.VITE_LOCAL_HASH_MODE as Mode) || "manual",
  );

  const fileId = useMemo(() => ethers.id(FILE_NAME), []);
  const provider = useMemo(() => new ethers.JsonRpcProvider(RPC_URL), []);
  const contract = useMemo(
    () => new ethers.Contract(CONTRACT_ADDRESS, ABI, provider),
    [provider],
  );

  const fetchOnChainData = useCallback(async () => {
    try {
      const hash = await contract.latestHash(fileId);
      setOnChainHash(hash);
    } catch (error) {
      console.error("Error fetching on-chain hash:", error);
    }
  }, [contract, fileId]);

  const performVerification = useCallback(async () => {
    if (!localHash || !onChainHash) {
      setIsVerified(null);
      return;
    }
    // Simple comparison client-side for UX snappiness,
    // but we can also call the contract's verify() method.
    try {
      const valid = await contract.verify(fileId, localHash);
      setIsVerified(valid);
    } catch (error) {
      console.error("Verification call failed:", error);
      setIsVerified(localHash.toLowerCase() === onChainHash.toLowerCase());
    }
  }, [contract, fileId, localHash, onChainHash]);

  // Live Mode: Poll local helper
  useEffect(() => {
    if (mode !== "live") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:3001/hash");
        const data = await response.json();
        if (data.hash) setLocalHash(data.hash);
      } catch (err) {
        console.warn("Live mode helper not reached. Run the helper script.");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [mode]);

  // Poll On-Chain Data
  useEffect(() => {
    fetchOnChainData();
    const interval = setInterval(fetchOnChainData, 5000);
    setIsLoading(false);
    return () => clearInterval(interval);
  }, [fetchOnChainData]);

  // Update verification status when hashes change
  useEffect(() => {
    performVerification();
  }, [localHash, onChainHash, performVerification]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex =
      "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    setLocalHash(hashHex);
  };

  // const copyToClipboard = (text: string) => {
  //   navigator.clipboard.writeText(text);
  // };

  const statusColor =
    isVerified === null
      ? "text-gray-500"
      : isVerified
        ? "text-ui-success"
        : "text-ui-error";
  const statusAnimation = isVerified === true ? "animate-pulse-slow" : "";

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white uppercase">
              CodeGuard
            </h1>
            <p className="text-[11px] text-gray-500 font-medium tracking-wider uppercase">
              Security Infrastructure
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-ui-card border border-ui-border rounded-full px-3 py-1.5 flex items-center gap-2 text-[11px] font-semibold text-gray-400 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-ui-success"></span>
            MONAD TESTNET
          </div>
          <a
            href={`${EXPLORER_URL}/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ui-card border border-ui-border rounded-full px-3 py-1.5 text-[11px] font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer shadow-sm flex items-center group"
          >
            <span className="opacity-50 mr-1">CONTRACT:</span>
            <span className="font-mono">
              {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            </span>
            <svg
              className="w-3 h-3 ml-2 opacity-30 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Status Card */}
        <section
          className={`lg:col-span-7 bg-ui-card border border-ui-border rounded-2xl p-12 flex flex-col items-center justify-center relative overflow-hidden shadow-xl shadow-black/20 transition-all duration-500 ${isVerified === false ? "ring-1 ring-ui-error/20" : ""}`}
        >
          <div className="absolute top-6 left-8 text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase">
            Integrity Status
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                Analyzing...
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div
                className={`text-6xl md:text-8xl font-bold mb-6 tracking-tight ${statusColor} ${statusAnimation}`}
              >
                {isVerified === null
                  ? "IDLE"
                  : isVerified
                    ? "VERIFIED"
                    : "TAMPERED"}
              </div>
              <div className="flex items-center justify-center gap-2">
                {isVerified === true && (
                  <svg
                    className="w-5 h-5 text-ui-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {isVerified === false && (
                  <svg
                    className="w-5 h-5 text-ui-error"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <div className="text-sm font-medium text-gray-400">
                  {isVerified === null
                    ? "Awaiting comparison data"
                    : isVerified
                      ? "All security checks passed"
                      : "Hash mismatch detected"}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Data Grid */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* On-Chain Record */}
          <div className="bg-ui-card border border-ui-border rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                On-Chain Record
              </span>
              <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 text-[10px] font-bold uppercase">
                Live State
              </span>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-2">
                  Latest Verified Hash
                </label>
                <div className="bg-black/40 rounded-lg p-3 border border-ui-border">
                  <code className="font-mono text-xs text-blue-400 break-all">
                    {onChainHash ||
                      "0x0000000000000000000000000000000000000000000000000000000000000000"}
                  </code>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-1">
                    Signer Role
                  </label>
                  <div className="text-[11px] font-medium text-white">
                    System Administrator
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-1">
                    Resource ID
                  </label>
                  <div className="text-[11px] font-mono text-gray-400">
                    {fileId.slice(0, 12)}...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Local Hash Input */}
          <div className="bg-ui-card border border-ui-border rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Local Environment
              </span>
              <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] font-bold uppercase">
                {mode} Mode
              </span>
            </div>

            {mode === "manual" ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-2 text-center">
                    Validate Resource: {FILE_NAME}
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-ui-border rounded-lg p-4 text-center group-hover:border-brand-500/50 transition-colors bg-white/[0.02]">
                      <span className="text-xs text-gray-400">
                        Drop file or{" "}
                        <span className="text-brand-500">browse</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="text-[10px] text-gray-600 font-mono">
                      0x
                    </span>
                  </div>
                  <input
                    type="text"
                    value={localHash}
                    onChange={(e) => setLocalHash(e.target.value)}
                    placeholder="Manual hash entry..."
                    className="w-full bg-black/40 border border-ui-border rounded-lg py-2 pl-8 pr-3 text-xs font-mono text-white focus:border-brand-500/50 focus:outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-white/[0.02] rounded-lg border border-dashed border-ui-border">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="absolute w-8 h-8 bg-brand-500/20 rounded-full animate-ping"></div>
                  <div className="relative w-2 h-2 bg-brand-500 rounded-full"></div>
                </div>
                <div className="text-[11px] font-medium text-gray-400 mb-3 tracking-wide uppercase">
                  Monitoring Filesystem
                </div>
                <code className="text-[10px] font-mono text-brand-500 bg-brand-500/5 px-2 py-1 rounded">
                  {localHash ? `${localHash.slice(0, 24)}...` : "Connecting..."}
                </code>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="flex flex-col md:flex-row justify-between items-center gap-4 py-8 border-t border-ui-border">
        <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest">
          Secure Integrity Verification Protocol
        </p>
        <p className="text-[10px] text-gray-600 max-w-sm text-center md:text-right">
          Hashes are immutable once committed to the Monad network.
          Discrepancies indicate unauthorized local modifications.
        </p>
      </footer>
    </div>
  );
}
