import React, { useEffect, useState } from 'react';
import { getContract } from '../utils/contract';

function ViewArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadArticles = async () => {
    try {
      const contract = getContract();
      const count = await contract.getArticleCount();
      const articlesArray = [];

      for (let i = 0; i < count; i++) {
        try {
          const article = await contract.getArticle(i);
          articlesArray.push({
            id: article.id.toString(),
            title: article.title,
            author: article.author,
            hash: article.hash,
            timestamp: new Date(article.timestamp * 1000).toLocaleString(),
            access: article.access === 0 ? 'Public' : 'Restricted',
          });
        } catch (err) {
          console.warn(`Skipping restricted article ${i}`);
        }
      }

      setArticles(articlesArray);
    } catch (error) {
      console.error("Error loading articles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'left' }}>
      <h2>📜 Articles</h2>
      {loading ? (
        <p>Loading...</p>
      ) : articles.length === 0 ? (
        <p>No articles found.</p>
      ) : (
        articles.map(article => (
          <div
            key={article.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '10px'
            }}
          >
            <h3>{article.title}</h3>
            <p><strong>Author:</strong> {article.author}</p>
            <p><strong>Posted:</strong> {article.timestamp}</p>
            <p><strong>Access:</strong> {article.access}</p>
            <a
              href={`https://ipfs.io/ipfs/${article.hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 View Summary on IPFS
            </a>
          </div>
        ))
      )}
    </div>
  );
}

export default ViewArticles;
