import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import AuthorPanel from "./components/AuthorPanel";
import AdminPanel from "./components/AdminPanel";
import UserView from "./components/UserView";
import "./App.css";

// Navigation component
function Navigation({ account, connectWallet }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/user", label: "News Feed", icon: "📰" },
    { path: "/author", label: "Author Panel", icon: "✍️" },
    { path: "/admin", label: "Admin Panel", icon: "👑" },
  ];

  return (
    <header className="glass-intense border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container-wide">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-glow group-hover:shadow-glow-lg transition-all duration-300 group-hover:scale-105">
                  📰
                </div>
                <div className="absolute inset-0 bg-gradient-primary rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse-glow"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold gradient-text glow-text">
                  DeNews
                </span>
                <span className="text-xs text-gray-400 font-normal">Decentralized News Platform</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item flex items-center space-x-2 ${isActive(item.path) ? 'active' : ''
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center">
            {account ? (
              <div className="flex items-center space-x-4">
                <div className="status-online">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span>Connected</span>
                </div>
                <div className="glass px-4 py-2 rounded-xl border border-primary-500/30">
                  <code className="text-sm text-primary-300 font-mono">
                    {`${account.slice(0, 6)}...${account.slice(-4)}`}
                  </code>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="btn-primary shadow-glow hover:shadow-glow-lg transform hover:scale-105 active:scale-95"
              >
                <span className="mr-2">🔗</span>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/10 glass-intense">
        <div className="container-fluid py-3">
          <nav className="flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.path)
                  ? "bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-300"
                  : "text-gray-400 hover:text-primary-300 hover:bg-dark-800"
                  }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

// Home component
function Home({ account }) {
  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-accent-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary-400/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-accent-400/5 rounded-full blur-xl animate-float" style={{ animationDelay: '6s' }}></div>
      </div>

      <div className="container-wide pt-16 pb-20 relative z-10">
        <div className="text-center">
          {/* Hero Section */}
          <div className="mb-16 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Welcome to{" "}
              <span className="gradient-text glow-text block md:inline text-shadow-lg">
                DeNews
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed text-balance">
              The future of decentralized journalism. Powered by blockchain technology,
              ensuring transparency, authenticity, and absolute freedom of press.
            </p>

            {!account && (
              <div className="glass border border-yellow-500/30 rounded-2xl p-6 mb-12 max-w-md mx-auto animate-pulse-glow">
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-3xl">🔗</span>
                  <div>
                    <p className="text-yellow-300 font-medium">Connect your wallet to get started</p>
                    <p className="text-yellow-400/70 text-sm">Join the decentralized revolution</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="card card-hover card-glow p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary-300 transition-colors">Decentralized</h3>
              <p className="text-gray-300 leading-relaxed">
                No central authority controls the content. Articles are stored on IPFS and verified on blockchain, ensuring true decentralization.
              </p>
            </div>

            <div className="card card-hover card-glow p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">Transparent</h3>
              <p className="text-gray-300 leading-relaxed">
                Every article is cryptographically signed and timestamped, ensuring authenticity and preventing tampering through immutable records.
              </p>
            </div>

            <div className="card card-hover card-glow p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-accent-300 transition-colors">Global Access</h3>
              <p className="text-gray-300 leading-relaxed">
                Access news from anywhere in the world without censorship or geographical restrictions. True freedom of information.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          {account && (
            <div className="glass-intense rounded-3xl p-10 text-center animate-fade-in-up border border-primary-500/20" style={{ animationDelay: '0.4s' }}>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Ready to explore the future?</h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Start reading the latest decentralized news or become an author and share your voice with the world
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  to="/user"
                  className="btn-primary text-lg px-8 py-4 shadow-glow-lg"
                >
                  <span className="mr-3">📖</span>
                  Explore News Feed
                </Link>
                <Link
                  to="/author"
                  className="btn-outline text-lg px-8 py-4"
                >
                  <span className="mr-3">✍️</span>
                  Become Author
                </Link>
              </div>
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="card p-6 text-center group hover:border-primary-500/50">
              <div className="text-3xl font-bold gradient-text mb-2">100%</div>
              <div className="text-gray-400 text-sm font-medium">Decentralized</div>
            </div>
            <div className="card p-6 text-center group hover:border-green-500/50">
              <div className="text-3xl font-bold text-green-400 mb-2">∞</div>
              <div className="text-gray-400 text-sm font-medium">Uncensorable</div>
            </div>
            <div className="card p-6 text-center group hover:border-accent-500/50">
              <div className="text-3xl font-bold text-accent-400 mb-2">🛡️</div>
              <div className="text-gray-400 text-sm font-medium">Secure</div>
            </div>
            <div className="card p-6 text-center group hover:border-blue-500/50">
              <div className="text-3xl font-bold text-blue-400 mb-2">⚡</div>
              <div className="text-gray-400 text-sm font-medium">Lightning Fast</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [account, setAccount] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Set dark mode on app load
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (err) {
        console.error("User rejected connection", err);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Please install MetaMask to use this dApp.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-dark scrollbar-dark">
        <Navigation account={account} connectWallet={connectWallet} />

        <main className="page-enter">
          <Routes>
            <Route path="/admin" element={<AdminPanel account={account} />} />
            <Route path="/author" element={<AuthorPanel account={account} />} />
            <Route path="/user" element={<UserView />} />
            <Route path="/" element={<Home account={account} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
