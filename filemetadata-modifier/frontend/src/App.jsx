import React, { useState } from 'react';
import './App.css';

function App() {
  const [filePath, setFilePath] = useState('');
  const [comments, setComments] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath, comments }),
      });
      const data = await response.json();
      setMessage(data.message);
      if (response.ok) {
        setFilePath('');
        setComments('');
      }
    } catch (error) {
      setMessage('Error: Could not connect to the server');
    }
  };

  return (
    <div className="container">
      <h1>File Metadata Modifier</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="filePath">File Path:</label>
          <input
            type="text"
            id="filePath"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Enter the full path to your PDF or image file"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="comments">Comments:</label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Enter your comments"
            required
          />
        </div>
        <button type="submit">Add Comments</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default App; 