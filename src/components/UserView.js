import React, { useEffect, useState } from "react";
import { getContract } from "../utils/getContract";

function UserView() {
  const [articles, setArticles] = useState([]);

  const fetchArticles = async () => {
    try {
      const contract = getContract();
      const count = await contract.getArticleCount();
      const loadedArticles = [];

      for (let i = 0; i < count; i++) {
        const article = await contract.getArticle(i);
        // Only include Public articles
        if (article.access === 0) {
          loadedArticles.push(article);
        }
      }

      setArticles(loadedArticles);
    } catch (error) {
      console.error("Error loading articles:", error);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📰 Public News Articles</h2>
      {articles.length === 0 ? (
        <p>No public articles found.</p>
      ) : (
        <ul>
          {articles.map((article, index) => (
            <li key={index} style={{ marginBottom: "20px", borderBottom: "1px solid #ccc" }}>
              <h3>{article.title}</h3>
              <p><strong>Author:</strong> {article.author}</p>
              <p><strong>Date:</strong> {new Date(Number(article.timestamp) * 1000).toLocaleString()}</p>
              <a
                href={`https://ipfs.io/ipfs/${article.hash}`}
                target="_blank"
                rel="noreferrer"
              >
                View Full Article
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserView;
