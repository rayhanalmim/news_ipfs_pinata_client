import React, { useState, useEffect } from "react";
import { getContract } from "../utils/getContract";
import { CONTRACT_ADDRESS, ADMIN_ADDRESS } from "../utils/config";
import { ethers } from "ethers"; // Add this if not already imported

const AdminPanel = ({ account }) => {
  const [newAuthor, setNewAuthor] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (account && account.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    console.log("🛡️ Connected Wallet:", account);
    console.log("👑 Admin Address Expected:", ADMIN_ADDRESS);
  }, [account]);

  const handleAddAuthor = async () => {
    if (!ethers.isAddress(newAuthor)) {
      setStatusMsg("❌ Invalid Ethereum address.");
      return;
    }

    try {
      const contract = await getContract();
      console.log("📡 Calling addAuthor with:", newAuthor);

      const tx = await contract.addAuthor(newAuthor);
      setStatusMsg("⏳ Waiting for transaction...");
      await tx.wait();

      setStatusMsg("✅ Author added successfully.");
      setNewAuthor("");
    } catch (err) {
      console.error("❌ Error adding author:", err);
      setStatusMsg(`❌ Failed to add author: ${err.reason || err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: "20px", color: "orange" }}>
        <h3>⚠️ You are not the admin. Access denied.</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", border: "2px solid white", marginTop: "20px" }}>
      <h2>🛠️ Admin Panel</h2>
      <input
        type="text"
        placeholder="Enter author address (0x...)"
        value={newAuthor}
        onChange={(e) => setNewAuthor(e.target.value)}
        style={{ padding: "10px", width: "300px" }}
      />
      <button onClick={handleAddAuthor} style={{ padding: "10px", marginLeft: "10px" }}>
        Add Author
      </button>
      <p>{statusMsg}</p>
    </div>
  );
};

export default AdminPanel;
