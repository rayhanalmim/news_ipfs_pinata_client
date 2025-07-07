import React, { useState, useEffect } from "react";
import { getContract } from "../utils/getContract";
import { CONTRACT_ADDRESS, ADMIN_ADDRESS } from "../utils/config";
import { ethers } from "ethers";

function AdminPanel({ account }) {
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [stats, setStats] = useState({
    totalArticles: 0,
    publicArticles: 0,
    privateArticles: 0,
    totalAuthors: 0
  });
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Check if current account is admin
  const checkAdminStatus = async () => {
    if (!account) {
      setCheckingAdmin(false);
      return;
    }

    try {
      setCheckingAdmin(true);
      const contract = getContract();
      const adminStatus = await contract.admins(account);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  // Fetch platform statistics
  const fetchStats = async () => {
    try {
      const contract = getContract();
      const count = await contract.getArticleCount();
      let publicCount = 0;
      let privateCount = 0;
      const authors = new Set();

      for (let i = 0; i < count; i++) {
        const article = await contract.getArticle(i);
        if (article.access === 0) {
          publicCount++;
        } else {
          privateCount++;
        }
        authors.add(article.author.toLowerCase());
      }

      setStats({
        totalArticles: Number(count),
        publicArticles: publicCount,
        privateArticles: privateCount,
        totalAuthors: authors.size
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    checkAdminStatus();
    fetchStats();
  }, [account]);

  // Validate Ethereum address
  const validateAddress = (address) => {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
    setIsValidAddress(isValid);
    return isValid;
  };

  const handleAddressChange = (e) => {
    const address = e.target.value;
    setNewAdminAddress(address);
    validateAddress(address);
    setMessage({ type: "", text: "" });
  };

  const addAdmin = async (e) => {
    e.preventDefault();

    if (!account) {
      setMessage({ type: "error", text: "Please connect your wallet first." });
      return;
    }

    if (!isAdmin) {
      setMessage({ type: "error", text: "You don't have admin privileges." });
      return;
    }

    if (!newAdminAddress.trim()) {
      setMessage({ type: "error", text: "Please enter an address." });
      return;
    }

    if (!validateAddress(newAdminAddress)) {
      setMessage({ type: "error", text: "Please enter a valid Ethereum address." });
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: "", text: "" });

      const contract = getContract();

      // Check if address is already an admin
      const isAlreadyAdmin = await contract.admins(newAdminAddress);
      if (isAlreadyAdmin) {
        setMessage({ type: "warning", text: "This address is already an admin." });
        setIsLoading(false);
        return;
      }

      const tx = await contract.addAdmin(newAdminAddress);
      setMessage({ type: "success", text: "🔄 Transaction submitted! Waiting for confirmation..." });

      await tx.wait();

      setMessage({
        type: "success",
        text: "🎉 Admin added successfully! The new admin can now manage the platform."
      });

      setNewAdminAddress("");
      setIsValidAddress(false);

    } catch (error) {
      console.error("Error adding admin:", error);
      setMessage({
        type: "error",
        text: error.message.includes("user rejected")
          ? "Transaction was cancelled by user."
          : "Failed to add admin. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-mesh relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-accent-500/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-primary-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="container-narrow pt-20 pb-20 relative z-10">
          <div className="text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/30">
              <span className="text-4xl">🔗</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-6">Connect Your Wallet</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
              You need to connect your MetaMask wallet to access the Admin Panel.
            </p>
            <div className="glass border border-yellow-500/30 rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-yellow-300 text-sm">
                👑 Admin access is required to manage platform administrators and view detailed statistics.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-mesh relative overflow-hidden">
        <div className="container-narrow pt-20 pb-20 relative z-10">
          <div className="text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary-500/30">
              <div className="loader"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Checking Admin Status</h2>
            <p className="text-gray-300">Verifying your administrative privileges...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-mesh relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-32 h-32 bg-red-500/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-red-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="container-narrow pt-20 pb-20 relative z-10">
          <div className="text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/30">
              <span className="text-4xl">🚫</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-6">Access Denied</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
              You don't have administrator privileges to access this panel.
            </p>
            <div className="glass border border-red-500/30 rounded-2xl p-6 max-w-lg mx-auto mb-8">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🔐</span>
                <div className="text-left">
                  <p className="text-red-300 font-medium mb-2">Admin access required</p>
                  <p className="text-red-400/70 text-sm">
                    This panel is restricted to platform administrators. If you believe you should have access,
                    contact an existing administrator to grant you permissions.
                  </p>
                </div>
              </div>
            </div>
            <div className="glass px-6 py-3 rounded-xl border border-gray-500/30 inline-flex items-center space-x-3">
              <span className="text-gray-400 text-sm">Your address:</span>
              <code className="text-gray-300 font-mono text-sm">
                {`${account.slice(0, 8)}...${account.slice(-6)}`}
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-accent-500/5 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-1/3 left-10 w-32 h-32 bg-primary-500/5 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-accent-400/5 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-primary-400/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '6s' }}></div>
      </div>

      <div className="container-narrow pt-12 pb-20 relative z-10">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in-up">
          <h1 className="text-5xl font-bold text-white mb-6">
            👑 <span className="gradient-text glow-text">Admin Panel</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Manage platform administrators and monitor system statistics
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="glass px-6 py-3 rounded-xl border border-green-500/30 flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-medium">Admin Access Granted</span>
            </div>
            <div className="glass px-6 py-3 rounded-xl border border-primary-500/30 flex items-center space-x-3">
              <span className="text-primary-300 font-mono text-sm">
                {`${account.slice(0, 8)}...${account.slice(-6)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Platform <span className="gradient-text">Overview</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                  <span className="text-2xl font-bold text-white">{stats.totalArticles}</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">Total Articles</div>
                  <div className="text-sm text-gray-400">Published on platform</div>
                </div>
              </div>

              <div className="group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                  <span className="text-2xl font-bold text-white">{stats.publicArticles}</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">Public</div>
                  <div className="text-sm text-gray-400">Accessible to all</div>
                </div>
              </div>

              <div className="group">
                <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                  <span className="text-2xl font-bold text-white">{stats.privateArticles}</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">Private</div>
                  <div className="text-sm text-gray-400">Restricted access</div>
                </div>
              </div>

              <div className="group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                  <span className="text-2xl font-bold text-white">{stats.totalAuthors}</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">Authors</div>
                  <div className="text-sm text-gray-400">Content creators</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Admin Form */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Add New Administrator</h2>
              <p className="text-gray-300">
                Grant administrator privileges to a new Ethereum address. Admins can manage other administrators and access platform controls.
              </p>
            </div>

            <form onSubmit={addAdmin} className="space-y-6">
              {/* Address Input */}
              <div>
                <label className="form-label">Administrator Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newAdminAddress}
                    onChange={handleAddressChange}
                    placeholder="0x1234567890abcdef1234567890abcdef12345678"
                    className={`form-input pr-12 ${newAdminAddress
                      ? isValidAddress
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                      }`}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    {newAdminAddress && (
                      <span className={`text-lg ${isValidAddress ? "text-green-400" : "text-red-400"}`}>
                        {isValidAddress ? "✅" : "❌"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Address Validation Feedback */}
                {newAdminAddress && (
                  <div className={`mt-2 p-3 rounded-lg border ${isValidAddress
                    ? "bg-green-500/20 border-green-500/30 text-green-300"
                    : "bg-red-500/20 border-red-500/30 text-red-300"
                    }`}>
                    <div className="flex items-center space-x-2">
                      <span>{isValidAddress ? "✅" : "❌"}</span>
                      <span className="text-sm">
                        {isValidAddress
                          ? "Valid Ethereum address format"
                          : "Invalid address format. Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)"
                        }
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-gray-400 text-sm mt-2">
                  Enter the Ethereum address (0x...) that should receive administrator privileges
                </p>
              </div>

              {/* Security Warning */}
              <div className="glass border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-yellow-300 font-semibold mb-2">Security Notice</h3>
                    <p className="text-yellow-400/80 text-sm">
                      Administrator privileges grant significant control over the platform. Only add trusted addresses as administrators.
                      Verify the address carefully before submitting the transaction.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !isValidAddress || !newAdminAddress}
                  className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loader"></div>
                      <span>Adding Administrator...</span>
                    </div>
                  ) : (
                    <span>
                      <span className="mr-2">👑</span>
                      Grant Admin Privileges
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Message Display */}
            {message.text && (
              <div className={`mt-6 p-4 rounded-xl border animate-fade-in ${message.type === "success"
                ? "bg-green-500/20 border-green-500/30 text-green-300"
                : message.type === "warning"
                  ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-300"
                  : "bg-red-500/20 border-red-500/30 text-red-300"
                }`}>
                <p>{message.text}</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Admin Info */}
        <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-white">🛡️</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Admin Capabilities</h3>
              </div>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Add new administrators</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>View platform statistics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Monitor content moderation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Access administrative controls</span>
                </li>
              </ul>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                  <span className="text-white">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Platform Health</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Blockchain Status</span>
                  <div className="status-online">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span>Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">IPFS Gateway</span>
                  <div className="status-online">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span>Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Smart Contract</span>
                  <div className="status-online">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span>Deployed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
