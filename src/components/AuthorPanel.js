import React, { useState, useEffect, useCallback } from 'react';
import { getContract, ensureSepoliaNetwork } from '../utils/getContract';
import { PinataSDK } from 'pinata';
import { CID } from 'multiformats/cid';
import * as base58 from 'multiformats/bases/base58';
import { storeCidMapping, getIpfsGatewayUrl, convertCidV1toV0, fetchMetadata, getIpfsGatewayUrls } from '../utils/ipfsHelper';

// Verify our hardcoded CIDs are the correct length
let FALLBACK_CID = "QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r581Vz";
// Check and correct the fallback CID if needed
if (FALLBACK_CID.length !== 46) {
  console.error(`FALLBACK_CID has incorrect length: ${FALLBACK_CID.length}, fixing...`);
  if (FALLBACK_CID.length > 46) {
    FALLBACK_CID = FALLBACK_CID.substring(0, 46);
  } else {
    FALLBACK_CID = FALLBACK_CID.padEnd(46, 'X');
  }
}
console.log("Fallback CID length check:", FALLBACK_CID.length === 46, FALLBACK_CID, FALLBACK_CID.length);

// Initialize Pinata SDK with JWT from environment variable
const pinata = new PinataSDK({
  pinataJwt: process.env.REACT_APP_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkMDUzMmM1NC0xODk2LTQ1MzQtODBmOS05MGI0ZGJlMjNhYzQiLCJlbWFpbCI6ImRldnJheWhhbmFsbWltQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI2ZmZmN2UwMzcxZDhhMjMwZWUzZSIsInNjb3BlZEtleVNlY3JldCI6Ijc4N2Q4ZTNlNWU0MzU5MzY2Mzc3ZWY1YTYwZjBhZDAwNjg3MTU4OThiZGZiZjExMTIzM2FlOTFlNDI3Zjc4ZDIiLCJleHAiOjE3ODM0MTQ4Njd9.eLM_LjI0UZbkuVkf4kiM4e9PWexseTcACK2Lr-AzWW4",
  pinataGateway: "jade-electronic-puma-736.mypinata.cloud"
});

// IPFS Gateway Links component
const GatewayLinks = ({ cid }) => {
  const urls = getIpfsGatewayUrls(cid);

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <h5 className="text-sm font-medium text-gray-700 mb-2">Alternative IPFS Gateways:</h5>
      <div className="flex flex-wrap gap-2">
        {Object.entries(urls).map(([name, url]) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </a>
        ))}
      </div>
    </div>
  );
};

export default function AuthorPanel({ account }) {
  const [activeTab, setActiveTab] = useState("publish");
  const [formData, setFormData] = useState({
    title: "",
    hash: "",
    access: "0"
  });
  const [file, setFile] = useState(null);
  const [myArticles, setMyArticles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [articlesInitialized, setArticlesInitialized] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const tabs = [
    { id: "publish", label: "Publish Article", icon: "✍️" },
    { id: "manage", label: "My Articles", icon: "📚" }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setUploadStatus(`Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`);

    // Create preview for image files
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const uploadToPinata = async (file) => {
    try {
      setIsUploading(true);
      setUploadStatus("🔄 Uploading to IPFS...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload to Pinata");
      }

      const result = await response.json();
      setUploadStatus(`✅ Upload successful! IPFS Hash: ${result.IpfsHash}`);
      return result.IpfsHash;
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      setUploadStatus("❌ Upload failed. Please try again.");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!account) {
      setMessage({ type: "error", text: "Please connect your wallet first." });
      return;
    }

    if (!formData.title.trim()) {
      setMessage({ type: "error", text: "Please enter a title for your article." });
      return;
    }

    let hashToUse = formData.hash.trim();

    // If file is selected, upload it first
    if (file) {
      try {
        hashToUse = await uploadToPinata(file);
        setFormData(prev => ({ ...prev, hash: hashToUse }));
      } catch (error) {
        setMessage({ type: "error", text: "Failed to upload file. Please try again." });
        return;
      }
    }

    if (!hashToUse) {
      setMessage({ type: "error", text: "Please provide an IPFS hash or upload a file." });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({ type: "", text: "" });

      const contract = await getContract();
      const tx = await contract.publishArticle(
        formData.title,
        hashToUse,
        parseInt(formData.access)
      );

      setMessage({ type: "success", text: "🔄 Transaction submitted! Waiting for confirmation..." });
      await tx.wait();

      setMessage({ type: "success", text: "🎉 Article published successfully! Your article is now on the blockchain." });

      // Reset form
      setFormData({ title: "", hash: "", access: "0" });
      setFile(null);
      setPreviewUrl(null);
      setUploadStatus("");

      // Refresh articles if on manage tab
      if (activeTab === "manage") {
        fetchMyArticles();
      }

    } catch (error) {
      console.error("Error publishing article:", error);
      setMessage({
        type: "error",
        text: error.message.includes("user rejected")
          ? "Transaction was cancelled by user."
          : "Failed to publish article. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchMyArticles = useCallback(async () => {
    if (!account) return;

    try {
      setIsLoadingArticles(true);
      const contract = await getContract();
      const count = await contract.getArticleCount();
      console.log("Article count:", count.toString());

      const authorArticles = [];
      for (let i = 0; i < count; i++) {
        const article = await contract.getArticle(i);
        console.log(`Article ${i}:`, article);
        if (article[2].toLowerCase() === account.toLowerCase()) { // article[2] is author address
          // Map the array response to an object
          const mappedArticle = {
            id: Number(article[0]),
            title: article[1],
            author: article[2],
            hash: article[3],
            timestamp: Number(article[4]),
            access: Number(article[5])
          };
          authorArticles.push(mappedArticle);
        }
      }

      console.log("Found articles:", authorArticles.length);
      setMyArticles(authorArticles.reverse());
      setArticlesInitialized(true);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setArticlesInitialized(true);
    } finally {
      setIsLoadingArticles(false);
    }
  }, [account]);

  useEffect(() => {
    if (activeTab === "manage" && account) {
      fetchMyArticles();
    }
  }, [activeTab, account, fetchMyArticles]);

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccessLabel = (access) => {
    return access === 0 ? "Public" : "Private";
  };

  if (!account) {
    return (
      <div className="h-screen bg-mesh relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-accent-500/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-primary-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="text-center animate-fade-in-up relative z-10">
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-yellow-500/30">
            <span className="text-4xl">🔗</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-6">Connect Your Wallet</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
            You need to connect your MetaMask wallet to access the Author Panel and publish articles.
          </p>
          <div className="glass border border-yellow-500/30 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-yellow-300 text-sm">
              📝 As an author, you'll be able to publish articles to IPFS and store them permanently on the blockchain.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-mesh relative overflow-hidden flex flex-col">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-accent-500/5 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-1/3 left-10 w-32 h-32 bg-primary-500/5 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-accent-400/5 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-primary-400/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '6s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 lg:px-12 xl:px-16 pt-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-2xl">✍️</span>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                <span className="gradient-text glow-text">Author Panel</span>
              </h1>
              <p className="text-gray-300 text-sm lg:text-base">Share your voice with the decentralized world</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="glass px-4 py-2 rounded-xl border border-green-500/30 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-mono text-sm">
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </span>
            </div>
            {/* Tabs */}
            <div className="glass-intense rounded-xl p-1 flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-sm ${activeTab === tab.id
                    ? "bg-gradient-primary text-white shadow-glow"
                    : "text-gray-400 hover:text-white hover:bg-dark-800"
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 lg:px-12 xl:px-16 pb-6 overflow-hidden">
        <div className="h-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {activeTab === "publish" && (
            <div className="h-full flex flex-col lg:flex-row gap-6">
              {/* Left Column - Form */}
              <div className="lg:w-2/3 xl:w-3/4">
                <div className="card h-full flex flex-col">
                  <div className="p-6 border-b border-dark-700">
                    <h2 className="text-xl font-bold text-white mb-2">Publish New Article</h2>
                    <p className="text-gray-300 text-sm">
                      Create and publish your article to the decentralized web. Your content will be stored permanently on IPFS.
                    </p>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Title Input */}
                      <div>
                        <label className="form-label">Article Title</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter your article title..."
                          className="form-input"
                          required
                        />
                      </div>

                      {/* Two Column Layout for File Upload and IPFS Hash */}
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* File Upload */}
                        <div>
                          <label className="form-label">Upload Article File</label>
                          <div
                            className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 ${isDragOver
                              ? "border-primary-400 bg-primary-500/10"
                              : file
                                ? "border-green-400 bg-green-500/10"
                                : "border-dark-600 hover:border-primary-500 hover:bg-primary-500/5"
                              }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            {!file ? (
                              <div>
                                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <span className="text-lg">📁</span>
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-2">
                                  {isDragOver ? "Drop your file here" : "Upload your article"}
                                </h3>
                                <p className="text-gray-400 text-xs mb-4">
                                  Drag and drop or click to select
                                </p>
                                <label className="btn-primary text-sm cursor-pointer">
                                  <span className="mr-1">📎</span>
                                  Choose File
                                  <input
                                    type="file"
                                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                                    className="hidden"
                                    accept=".txt,.md,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.svg"
                                  />
                                </label>
                              </div>
                            ) : (
                              <div>
                                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <span className="text-lg text-white">✅</span>
                                </div>
                                <h3 className="text-sm font-semibold text-green-400 mb-2">File Selected</h3>
                                {previewUrl ? (
                                  <div className="mb-3">
                                    <div className="w-full h-32 mb-2 flex items-center justify-center overflow-hidden rounded-lg bg-dark-900">
                                      <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="object-contain max-h-full max-w-full"
                                      />
                                    </div>
                                    <p className="text-gray-300 text-xs mb-1">{file.name}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-300 text-xs mb-3">{file.name}</p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFile(null);
                                    setPreviewUrl(null);
                                    setUploadStatus("");
                                  }}
                                  className="btn-outline text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>

                          {uploadStatus && (
                            <div className={`mt-3 p-3 rounded-lg text-xs ${uploadStatus.includes("✅") ? "bg-green-500/20 border border-green-500/30" :
                              uploadStatus.includes("❌") ? "bg-red-500/20 border border-red-500/30" :
                                "bg-blue-500/20 border border-blue-500/30"
                              }`}>
                              <p>{uploadStatus}</p>
                            </div>
                          )}
                        </div>

                        {/* IPFS Hash Input */}
                        <div>
                          <label className="form-label">
                            IPFS Hash <span className="text-gray-500 text-xs">(Optional)</span>
                          </label>
                          <textarea
                            name="hash"
                            value={formData.hash}
                            onChange={handleInputChange}
                            placeholder="Enter IPFS hash if you have one..."
                            className="form-input font-mono text-sm resize-none h-32"
                            rows="4"
                          />
                          <p className="text-gray-400 text-xs mt-2">
                            If you already have content on IPFS, enter the hash here
                          </p>
                        </div>
                      </div>

                      {/* Access Level */}
                      <div>
                        <label className="form-label">Access Level</label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={`card cursor-pointer p-4 transition-all duration-200 ${formData.access === "0" ? "border-primary-500 bg-primary-500/10" : "hover:border-dark-600"
                            }`}>
                            <input
                              type="radio"
                              name="access"
                              value="0"
                              checked={formData.access === "0"}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">🌍</span>
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">Public</div>
                                <div className="text-xs text-gray-400">Visible to everyone</div>
                              </div>
                            </div>
                          </label>

                          <label className={`card cursor-pointer p-4 transition-all duration-200 ${formData.access === "1" ? "border-accent-500 bg-accent-500/10" : "hover:border-dark-600"
                            }`}>
                            <input
                              type="radio"
                              name="access"
                              value="1"
                              checked={formData.access === "1"}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">🔒</span>
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">Private</div>
                                <div className="text-xs text-gray-400">Only you can see</div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting || isUploading}
                          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="loader"></div>
                              <span>Publishing...</span>
                            </div>
                          ) : isUploading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="loader"></div>
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <span>
                              <span className="mr-2">🚀</span>
                              Publish Article
                            </span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column - Info & Status */}
              <div className="lg:w-1/3 xl:w-1/4 space-y-4">
                {/* Publishing Guide */}
                <div className="card p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="mr-2">📋</span>
                    Quick Guide
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-primary-400 text-sm">1.</span>
                      <span className="text-gray-300 text-sm">Enter your article title</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-primary-400 text-sm">2.</span>
                      <span className="text-gray-300 text-sm">Upload file or provide IPFS hash</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-primary-400 text-sm">3.</span>
                      <span className="text-gray-300 text-sm">Choose access level</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-primary-400 text-sm">4.</span>
                      <span className="text-gray-300 text-sm">Publish to blockchain</span>
                    </div>
                  </div>
                </div>

                {/* Platform Features */}
                <div className="card p-4">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="mr-2">⚡</span>
                    Features
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="text-gray-300 text-sm">Decentralized Storage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="text-gray-300 text-sm">Immutable Records</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="text-gray-300 text-sm">Cryptographic Proof</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="text-gray-300 text-sm">Global Access</span>
                    </div>
                  </div>
                </div>

                {/* Message Display */}
                {message.text && (
                  <div className={`p-4 rounded-xl border animate-fade-in ${message.type === "success"
                    ? "bg-green-500/20 border-green-500/30 text-green-300"
                    : "bg-red-500/20 border-red-500/30 text-red-300"
                    }`}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "manage" && (
            <div className="h-full flex flex-col">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">My Published Articles</h2>
                  <p className="text-gray-300 text-sm">
                    Manage and view all articles you've published to the platform
                  </p>
                </div>
                <button
                  onClick={fetchMyArticles}
                  disabled={isLoadingArticles}
                  className="btn-secondary text-sm flex items-center"
                >
                  {isLoadingArticles ? (
                    <>
                      <div className="loader w-4 h-4 mr-2"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔄</span>
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {isLoadingArticles && !articlesInitialized ? (
                  <div className="card p-8 text-center">
                    <div className="loader mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your articles...</p>
                  </div>
                ) : myArticles.length === 0 ? (
                  <div className="card p-12 text-center h-full flex items-center justify-center">
                    <div>
                      <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl">📝</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-4">No Articles Yet</h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        You haven't published any articles yet. Start sharing your thoughts with the world!
                      </p>
                      <button
                        onClick={() => setActiveTab("publish")}
                        className="btn-primary"
                      >
                        <span className="mr-2">✍️</span>
                        Write Your First Article
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {myArticles.map((article, index) => (
                      <div key={index} className="card card-hover p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-white line-clamp-2 flex-1 mr-2">
                            {article.title}
                          </h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${article.access === 0
                            ? "bg-green-500/20 text-green-400"
                            : "bg-accent-500/20 text-accent-400"
                            }`}>
                            {getAccessLabel(article.access)}
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 mb-3">
                          📅 {formatDate(article.timestamp)}
                        </div>

                        <div className="glass rounded-lg p-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
                              <span className="text-xs">📄</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-300 text-xs">IPFS Hash:</p>
                              <code className="text-primary-300 text-xs font-mono block truncate">
                                {article.hash}
                              </code>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <a
                            href={`https://ipfs.io/ipfs/${article.hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary text-xs flex-1 justify-center"
                          >
                            📖 View
                          </a>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${article.hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-outline text-xs flex-1 justify-center"
                          >
                            🔗 Alt
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
