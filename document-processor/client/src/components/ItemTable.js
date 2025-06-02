import React, { useState, useEffect } from 'react';
import { useTable } from 'react-table';
import axios from 'axios';

const ItemTable = ({ documentId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [matching, setMatching] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const columns = React.useMemo(
    () => [
      { Header: 'Line', accessor: 'line_number' },
      { Header: 'Description', accessor: 'description' },
      { Header: 'Quantity', accessor: 'quantity' },
      { Header: 'Unit Price', accessor: 'unit_price' },
      { Header: 'Total', accessor: 'total_price' },
      { Header: 'Matched Product', accessor: 'matched_product_id' }
    ],
    []
  );
  
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: items });
  
  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5009/api/items/${documentId}`);
      setItems(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
      alert(`Error loading items: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleExtract = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    
    if (selectedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(
        'http://localhost:5009/api/extract',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setItems(response.data.items);
    } catch (error) {
      console.error('Extract error:', {
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
      alert(`Extraction failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setExtracting(false);
    }
  };
  
  const handleMatch = async () => {
    if (items.length === 0) {
      alert('No items to match');
      return;
    }

    setMatching(true);
    try {
      const response = await axios.post(
        'http://localhost:5009/api/match',
        {
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity
          }))
        }
      );

      setItems(prevItems => 
        prevItems.map((item, index) => ({
          ...item,
          matched_product_id: response.data.matches[index]?.product_id || 'no_match'
        }))
      );
    } catch (error) {
      console.error('Match error:', error);
      alert(`Matching failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setMatching(false);
    }
  };
  
  const handleSave = async () => {
    if (items.length === 0) {
      alert('No items to save');
      return;
    }

    try {
      await axios.post('http://localhost:5009/api/save', {
        documentId,
        items
      });
      alert('Data saved successfully!');
      fetchItems();
    } catch (error) {
      console.error('Save error:', error);
      alert(`Save failed: ${error.response?.data?.error || error.message}`);
    }
  };
  
  useEffect(() => {
    if (documentId) {
      fetchItems();
    }
  }, [documentId]);
  
  if (loading) return <div className="loading">Loading items...</div>;
  
  return (
    <div className="item-table">
      <div className="actions">
        <div className="file-upload">
          <label className="file-upload-label">
            {selectedFile ? selectedFile.name : 'Choose PDF file'}
            <input 
              type="file" 
              onChange={handleFileChange} 
              accept="application/pdf" 
              style={{ display: 'none' }}
            />
          </label>
          <button 
            onClick={handleExtract} 
            disabled={extracting || !selectedFile}
          >
            {extracting ? 'Extracting...' : 'Extract Data'}
          </button>
        </div>
        <button 
          onClick={handleMatch} 
          disabled={matching || items.length === 0}
        >
          {matching ? 'Matching...' : 'Match Products'}
        </button>
        <button 
          onClick={handleSave} 
          disabled={items.length === 0}
        >
          Save to Database
        </button>
      </div>
      
      <div className="table-container">
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map((headerGroup, hgIdx) => (
              <tr 
                key={`header-group-${hgIdx}`}
                {...headerGroup.getHeaderGroupProps()}
              >
                {headerGroup.headers.map((column, colIdx) => (
                  <th
                    key={`column-${colIdx}`}
                    {...column.getHeaderProps()}
                  >
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, rowIdx) => {
              prepareRow(row);
              return (
                <tr
                  key={`row-${rowIdx}`}
                  {...row.getRowProps()}
                >
                  {row.cells.map((cell, cellIdx) => (
                    <td
                      key={`cell-${rowIdx}-${cellIdx}`}
                      {...cell.getCellProps()}
                    >
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemTable;