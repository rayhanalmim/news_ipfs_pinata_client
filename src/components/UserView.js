import React, { useEffect, useState } from "react";
import { getContract } from "../utils/getContract";

function UserView() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError("");
      const contract = getContract();
      const count = await contract.getArticleCount();
      const loadedArticles = [];

      for (let i = 0; i < count; i++) {
        const article = await contract.getArticle(i);
        // Only include Public articles
        if (article.access === 0) {
          loadedArticles.push({ ...article, id: i });
        }
      }

      setArticles(loadedArticles.reverse()); // Show newest first
    } catch (error) {
      console.error("Error loading articles:", error);
      setError("Failed to load articles. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const LoadingSkeleton = () => (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-8">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="skeleton h-8 w-3/4 rounded-lg"></div>
              <div className="skeleton h-6 w-24 rounded-full"></div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="skeleton h-4 w-full rounded"></div>
              <div className="skeleton h-4 w-2/3 rounded"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="skeleton h-5 w-32 rounded"></div>
              <div className="skeleton h-10 w-28 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-32 h-32 bg-primary-500/5 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-accent-500/5 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="container-narrow pt-12 pb-20 relative z-10">
          <div className="mb-12 text-center animate-fade-in-up">
            <h1 className="text-4xl font-bold text-white mb-4">
              📰 <span className="gradient-text">Latest News</span>
            </h1>
            <p className="text-xl text-gray-300">Discover the latest decentralized news articles</p>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-mesh relative overflow-hidden">
        <div className="container-narrow pt-20 pb-20 relative z-10">
          <div className="text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/30">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">Error Loading Articles</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto">{error}</p>
            <button
              onClick={fetchArticles}
              className="btn-primary text-lg px-8 py-4"
            >
              <span className="mr-2">🔄</span>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-primary-500/5 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-1/3 left-10 w-32 h-32 bg-accent-500/5 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-primary-400/5 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-accent-400/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '6s' }}></div>
      </div>

      <div className="container-narrow pt-12 pb-20 relative z-10">
        {/* Header Section */}
        <div className="mb-12 text-center animate-fade-in-up">
          <h1 className="text-5xl font-bold text-white mb-6">
            📰 <span className="gradient-text glow-text">Latest News</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover the latest decentralized news articles from verified authors around the world
          </p>
          <div className="flex items-center justify-center">
            <button
              onClick={fetchArticles}
              className="btn-secondary group"
            >
              <span className="mr-2 group-hover:animate-spin">🔄</span>
              <span>Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-24 h-24 bg-dark-800 border border-dark-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl">📄</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Articles Found</h2>
            <p className="text-gray-300 mb-8 max-w-md mx-auto">
              Be the first to publish an article on the platform and start the decentralized news revolution!
            </p>
            <a href="/author" className="btn-primary">
              <span className="mr-2">✍️</span>
              Become an Author
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {articles.map((article, index) => (
              <article
                key={index}
                className="card card-hover card-glow group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-8">
                  {/* Article Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white group-hover:text-primary-300 transition-colors duration-300 mb-3 line-clamp-2">
                        {article.title}
                      </h2>
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-xs">👤</span>
                          </div>
                          <span className="font-mono text-primary-300">{truncateAddress(article.author)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">📅</span>
                          <span>{formatDate(article.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-6">
                      <div className="status-online">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span>Public</span>
                      </div>
                      <div className="glass px-3 py-1 rounded-full border border-primary-500/30">
                        <span className="text-xs text-primary-300 font-mono">⛓️ Blockchain</span>
                      </div>
                    </div>
                  </div>

                  {/* Article Preview */}
                  <div className="glass rounded-xl p-6 mb-6 border border-primary-500/20">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📄</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm mb-2">
                          This article is stored on IPFS with hash:
                        </p>
                        <code className="text-primary-300 text-xs font-mono bg-dark-800 px-3 py-2 rounded-lg block break-all">
                          {article.hash}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <a
                        href={`https://ipfs.io/ipfs/${article.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary group"
                      >
                        <span className="mr-2 group-hover:scale-110 transition-transform">📖</span>
                        <span>Read Article</span>
                      </a>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${article.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline group"
                      >
                        <span className="mr-2 group-hover:rotate-12 transition-transform">🔗</span>
                        <span>Alt Gateway</span>
                      </a>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span>💾</span>
                        <span>IPFS</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                      <div className="flex items-center space-x-1">
                        <span>⛓️</span>
                        <span>Verified</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                      <div className="flex items-center space-x-1">
                        <span>🛡️</span>
                        <span>Immutable</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Statistics Footer */}
        {articles.length > 0 && (
          <div className="mt-20 animate-fade-in-up">
            <div className="card p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-8">
                Platform <span className="gradient-text">Statistics</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="group">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <span className="text-2xl font-bold text-white">{articles.length}</span>
                  </div>
                  <div className="text-sm text-gray-400 font-medium">Public Articles</div>
                </div>
                <div className="group">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <span className="text-2xl font-bold text-white">100%</span>
                  </div>
                  <div className="text-sm text-gray-400 font-medium">Decentralized</div>
                </div>
                <div className="group">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <span className="text-2xl font-bold text-white">∞</span>
                  </div>
                  <div className="text-sm text-gray-400 font-medium">Uncensorable</div>
                </div>
                <div className="group">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="text-sm text-gray-400 font-medium">Lightning Fast</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserView;
