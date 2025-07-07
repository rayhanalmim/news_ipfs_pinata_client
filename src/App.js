import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AuthorPanel from "./components/AuthorPanel";
import AdminPanel from "./components/AdminPanel";
import UserView from "./components/UserView";
import "./App.css";

function App() {
  const [account, setAccount] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (err) {
        console.error("User rejected connection", err);
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
      <div className="App">
        <header className="App-header">
          <h1>📰 DeNews</h1>
          {account ? (
            <>
              ✅ Connected: <code>{account}</code>
              <br />
              <nav>
                <Link to="/">Home</Link> |{" "}
                <Link to="/admin">Admin Panel</Link> |{" "}
                <Link to="/author">Author Panel</Link> |{" "}
                <Link to="/user">User View</Link>
              </nav>
            </>
          ) : (
            <button onClick={connectWallet}>Connect MetaMask</button>
          )}
        </header>

        <main>
          <Routes>
            <Route path="/admin" element={<AdminPanel account={account} />} />
            <Route path="/author" element={<AuthorPanel account={account} />} />
            <Route path="/user" element={<UserView />} />
            <Route path="/" element={<h2>Welcome to DeNews DApp!</h2>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
