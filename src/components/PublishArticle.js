import React, { useState } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { getContract } from "../utils/contract";

// 🔐 IPFS Infura credentials (use .env in real projects)
const projectId = "231f2f6ccd5649d09e53377f4cf89e01";
const projectSecret = "58RpoCmmxPCE8gGcBY+qlPYzjbAvt5rZn9KrSjTXvhq9D8/1sey2/A";

const auth = "Basic " + btoa(projectId + ":" + projectSecret);

// ✅ Authenticated IPFS client
const ipfs = ipfsHttpClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

const PublishArticle = () => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [access, setAccess] = useState("0"); // 0 = Public, 1 = Restricted
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      // 1. Upload summary to IPFS
      console.log("📤 Uploading to IPFS...");
      const result = await ipfs.add(summary);
      const ipfsHash = result.path;
      console.log("✅ IPFS Hash:", ipfsHash);

      // 2. Publish via smart contract
      const contract = await getContract(); // Ensure it's awaited
      const tx = await contract.publishArticle(title, ipfsHash, parseInt(access));
      await tx.wait();

      setStatus("✅ Article published successfully!");
      setTitle("");
      setSummary("");
    } catch (err) {
      console.error("❌ Error:", err);
      setStatus("❌ Failed to publish article.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>📰 Publish Article</h2>
      <form onSubmit={handlePublish}>
        <input
          type="text"
          placeholder="Article title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <br />
        <textarea
          placeholder="Article summary or content"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        />
        <br />
        <label>
          Access:
          <select value={access} onChange={(e) => setAccess(e.target.value)}>
            <option value="0">Public</option>
            <option value="1">Restricted</option>
          </select>
        </label>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Publishing..." : "Publish"}
        </button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
};

export default PublishArticle;
