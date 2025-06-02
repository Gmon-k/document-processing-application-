import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: 'application/pdf',
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      setUploading(true);
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      
      try {
        const response = await axios.post('http://localhost:5009/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        onUploadSuccess(response.data.document);
      } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading file');
      } finally {
        setUploading(false);
      }
    }
  });

  return (
    <div {...getRootProps()} className="dropzone">
      <input {...getInputProps()} />
      {uploading ? (
        <p>Uploading...</p>
      ) : (
        <p>Drag & drop a PDF file here, or click to select</p>
      )}
    </div>
  );
};

export default FileUpload;