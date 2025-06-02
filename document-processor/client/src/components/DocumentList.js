import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DocumentList = ({ onSelectDocument }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('http://localhost:5009/api/documents');
        setDocuments(response.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);
  
  if (loading) return <p>Loading documents...</p>;
  
  return (
    <div className="document-list">
      <h3>Uploaded Documents</h3>
      <ul>
        {documents.map(doc => (
          <li key={doc.id} onClick={() => onSelectDocument(doc.id)}>
            {doc.filename} - {doc.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentList;