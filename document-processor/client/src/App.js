import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import ItemTable from './components/ItemTable';

function App() {
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  return (
    <div className="App">
      <header>
        <h1>Document Processor</h1>
      </header>
      
      <div className="container">
        <div className="upload-section">
          <h2>Upload PDF</h2>
          <FileUpload onUploadSuccess={doc => setSelectedDocument(doc.id)} />
        </div>
        
        <div className="content">
          <div className="document-list">
            <DocumentList onSelectDocument={setSelectedDocument} />
          </div>
          
          <div className="item-details">
            {selectedDocument ? (
              <>
                <h2>Document Items</h2>
                <ItemTable documentId={selectedDocument} />
              </>
            ) : (
              <p>Select a document to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;