# 📄 Document Processing Application

## 🌟 Overview
A full-stack application for processing PDF documents with:
- **Frontend**: React, HTML, JavaScript, Python (for PDF processing)
- **Backend**: Node.js
- **Database**: PostgreSQL

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- PostgreSQL (running)
- npm (v8+)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/your-username/document-processing-application.git
cd document-processing-application
```

### Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5009
DATABASE_URL=postgres://user:password@localhost:5432/document_processor
JWT_SECRET=your_jwt_secret_here
```

Start backend:
```bash
cd server
npm install
node server.js
```

### Frontend Setup
```bash
cd client
npm install
npm start
```



---

💡 The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5009`
