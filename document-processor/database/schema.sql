CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE line_items (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    line_number INTEGER,
    product_code VARCHAR(100),
    manufacturer_code VARCHAR(100),
    description TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    unit_type VARCHAR(50),
    total_price DECIMAL(10,2),
    matched_product_id VARCHAR(100)
);
