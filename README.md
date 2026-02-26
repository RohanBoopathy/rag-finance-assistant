# 💰 RAG Finance Assistant

- A full-stack personal finance web application powered by a **Retrieval-Augmented Generation (RAG)** AI chatbot built with modern web technologies. The platform enables users to manage and analyze their personal financial data through an intuitive dashboard, detailed transaction views, and an intelligent AI assistant.
- Users can sign up, securely authenticate via **JWT-based authentication**, and interact with their financial records in real time. Every transaction stored in **MongoDB Atlas** is embedded into a **768-dimensional vector** using the **nomic-embed-text** model running locally on **Ollama**. These vectors are indexed and stored in a **Qdrant vector database**, enabling high-performance semantic similarity search across all user transactions.
- When a user asks the AI assistant a question, the system detects intent — distinguishing between temporal queries (e.g., "last 5 transactions") and semantic queries (e.g., "spending at Amazon"). For semantic queries, the user's question is embedded and matched against stored vectors using cosine similarity, retrieving the most relevant transactions as context.
- A comprehensive financial summary (total credits, debits, balance, category breakdowns) is dynamically generated and combined with retrieved context to build a rich prompt for the LLM.
- The prompt is sent to a locally hosted **qwen2.5:7b** language model via Ollama, which streams the response token-by-token back to the frontend using **Server-Sent Events (SSE)**.
- The frontend, built with **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**, renders the AI responses in real time, delivering a seamless and responsive conversational experience.

---

## 🏗️ Architecture Diagram

```mermaid
graph TB
    subgraph Client["CLIENT LAYER"]
        Browser["Web Browser"]
    end

    subgraph Frontend["FRONTEND<br/>"]

        Auth["Authentication"]
        Dashboard["Dashboard"]
        Transactions["Transactions"]
        Assistant["AI Assistant"]
    end

    subgraph Backend["BACKEND<br/>"]
        APIGateway["API Gateway"]
        
        subgraph Controllers["Controllers"]
            AuthCtrl["Auth Controller"]
            ChatCtrl["Chat Controller"]
            ConvCtrl["Conv Controller"]
            TxnCtrl["Txn Controller"]
        end

        subgraph RAG["RAG Pipeline"]
            IntentDetect["Intent Detection"]
            Embedding["Embedding Service"]
            VectorSearch["Vector Search"]
            Summary["Financial Summary"]
            Prompt["Prompt Builder"]
            LLMStream["LLM Streaming"]
        end

        Middleware["JWT Middleware"]
    end

    subgraph Databases["DATA LAYER"]
        MongoDB[("MongoDB<br/>Users<br/>Transactions<br/>Conversations")]
        Qdrant[("Qdrant<br/>Vector Store<br/>768-dim")]
        Ollama[("Ollama<br/>qwen2.5:7b<br/>nomic-embed")]
    end

    Browser -->|HTTP/SSE| Frontend
    
    Auth --> APIGateway
    Dashboard --> APIGateway
    Transactions --> APIGateway
    Assistant --> APIGateway

    APIGateway --> Middleware
    APIGateway --> AuthCtrl
    APIGateway --> ChatCtrl
    APIGateway --> ConvCtrl
    APIGateway --> TxnCtrl

    ChatCtrl --> IntentDetect
    IntentDetect --> Embedding
    Embedding --> VectorSearch
    VectorSearch --> Summary
    Summary --> Prompt
    Prompt --> LLMStream
    LLMStream --> ChatCtrl

    AuthCtrl --> MongoDB
    ChatCtrl --> MongoDB
    ConvCtrl --> MongoDB
    TxnCtrl --> MongoDB

    Embedding --> Ollama
    LLMStream --> Ollama
    VectorSearch --> Qdrant

    classDef client fill:#3498db,stroke:#2980b9,color:#fff,stroke-width:2px
    classDef frontend fill:#e74c3c,stroke:#c0392b,color:#fff,stroke-width:2px
    classDef backend fill:#27ae60,stroke:#229954,color:#fff,stroke-width:2px
    classDef controllers fill:#16a085,stroke:#117a65,color:#fff,stroke-width:2px
    classDef rag fill:#f39c12,stroke:#d68910,color:#fff,stroke-width:2px
    classDef db fill:#2c3e50,stroke:#1a252f,color:#fff,stroke-width:2px

    class Client client
    class Frontend frontend
    class Backend backend
    class Controllers controllers
    class RAG rag
    class Databases db
    class MongoDB,Qdrant,Ollama db
```
---


## 📁 Folder Structure

```
rag-finance-assistant/
│
├── backend-node/
│   ├── .env                             # Backend environment variables
│   ├── package.json                     # Node.js dependencies
│   ├── server.js                        # Entry point — Express app, route registration
│   └── src/
│       ├── config/
│       │   ├── db.js                    # MongoDB connection (Mongoose)
│       │   └── qdrant.js               # Qdrant client + collection setup
│       ├── controllers/
│       │   ├── authController.js        # Register / Login logic
│       │   ├── chatController.js        # AI chat handler (RAG pipeline)
│       │   └── conversationController.js # CRUD for conversations
│       ├── middleware/
│       │   └── authMiddleware.js        # JWT verification middleware
│       ├── models/
│       │   ├── User.js                  # User schema (name, email, password)
│       │   ├── Transactions.js          # Transaction schema
│       │   └── Conversations.js         # Conversation + messages schema
│       ├── routes/
│       │   ├── authRoutes.js            # /api/auth/*
│       │   ├── chatRoutes.js            # /api/chat
│       │   ├── conversationRoutes.js    # /api/conversations/*
│       │   └── transactionRoutes.js     # /api/transactions/*
│       ├── scripts/
│       │   └── ingest.js               # Batch embed & upsert transactions into Qdrant
│       └── utils/
│           ├── aiService.js             # Prompt builder + Ollama LLM streaming
│           ├── embedService.js          # Text → 768-dim vector (nomic-embed-text)
│           ├── financialSummary.js      # Aggregate transactions → financial summary
│           ├── ingestTransactions.js    # Embed & upsert a single transaction to Qdrant
│           ├── intentDetector.js        # Temporal query detection (last/first N txns)
│           └── retrieveContext.js       # Semantic search in Qdrant (filtered by userId)
│
├── frontend/
│   ├── .env                             # Frontend environment variables
│   ├── package.json                     # Next.js dependencies
│   ├── next.config.ts                   # Next.js configuration
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── postcss.config.mjs               # PostCSS (Tailwind)
│   ├── components.json                  # shadcn/ui configuration
│   ├── app/
│   │   ├── (auth)/                      # Login / Register pages
│   │   └── (root)/
│   │       ├── layout.tsx               # Root layout with Sidebar
│   │       ├── dashboard/               # Dashboard page (KPIs + charts)
│   │       ├── transactions/            # Transaction list page
│   │       ├── ai-assistant/            # AI Chatbot page
│   │       ├── fraud-detection/         # Fraud Detection page (stub)
│   │       └── app-settings/            # Settings page (stub)
│   ├── components/
│   │   ├── Sidebar.tsx                  # Collapsible nav sidebar + chat history
│   │   ├── ChatHistory.tsx              # Past AI conversations in sidebar
│   │   ├── CustomHeader.tsx             # Page header bar
│   │   ├── CustomStats.tsx              # KPI stat cards
│   │   └── assistant/
│   │       ├── MessageList.tsx          # Renders chat messages
│   │       └── ChatInput.tsx            # Chat text input
│   ├── contexts/
│   │   └── SidebarContext.tsx           # Global sidebar state (collapsed/expanded)
│   ├── constants/                       # Static/mock data constants
│   ├── lib/                             # Utility functions
│   ├── types/
│   │   └── chat.ts                      # TypeScript types for messages & conversations
│   └── public/                          # Static assets
│
├── PROJECT_SUMMARY.md                   # Detailed project documentation
└── README.md                            # This file
```

---

## 🧰 Tech Stack & Dependencies

### Backend

| Technology | Purpose | Version |
|---|---|---|
| **Node.js** | Runtime | v18+ |
| **Express** | HTTP framework | 5.x |
| **Mongoose** | MongoDB ODM | 9.x |
| **@qdrant/js-client-rest** | Qdrant vector DB client | 1.x |
| **Axios** | HTTP client (→ Ollama API) | 1.x |
| **jsonwebtoken** | JWT auth tokens | 9.x |
| **bcryptjs** | Password hashing | 3.x |
| **cors** | Cross-origin requests | 2.x |
| **dotenv** | Environment variables | 17.x |

### Frontend

| Technology | Purpose | Version |
|---|---|---|
| **Next.js** | React framework | 16.x |
| **React** | UI library | 19.x |
| **TypeScript** | Type safety | 5.x |
| **Tailwind CSS** | Styling | 4.x |
| **shadcn/ui + Radix UI** | Component library | — |
| **Recharts** | Charts (dashboard) | 3.x |
| **NextAuth** | Authentication (JWT) | 4.x |
| **Lucide React** | Icons | — |

### Infrastructure (External Services)

| Service | Purpose | Default URL |
|---|---|---|
| **MongoDB** | Primary database | `Your_MongoDB_Atlas_URL` |
| **Qdrant** | Vector database | `http://localhost:6333` |
| **Ollama** | Local LLM + embeddings | `http://localhost:11434` |

---

## 📋 Prerequisites

Install these before running the project:

### 1. Node.js (v18+)
```bash
# Download from https://nodejs.org/
node --version    # verify: v18.x or higher
npm --version     # verify: 9.x or higher
```

### 2. MongoDB Atlas (Cloud Database)
```bash
# 1. Create a free account at https://www.mongodb.com/cloud/atlas
# 2. Create a new cluster (free M0 tier is sufficient)
# 3. Under "Database Access", create a database user with read/write permissions
# 4. Under "Network Access", add your IP address (or allow access from anywhere: 0.0.0.0/0)
# 5. Click "Connect" → "Drivers" → copy the connection string

# Your connection string will look like:
# mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# Paste it into backend-node/.env as MONGODB_URL
```

### 3. Qdrant (Vector Database)
```bash
# Using Docker (recommended)
docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest

# Verify
curl http://localhost:6333/dashboard
```

### 4. Ollama (Local LLM)
```bash
# Download from https://ollama.com/download

# Pull required models
ollama pull qwen2.5:7b          # LLM for chat responses
ollama pull nomic-embed-text     # Embedding model (768-dim)

# Verify
ollama list
```

---

## ⚙️ Environment Variables

### Backend — `backend-node/.env`

```env
# Server
PORT=5000

# MongoDB connection string
MONGODB_URL="Your_MONGODB_ATLAS_URL"

# JWT secret key (use a strong random string)
JWT_SECRET=your_jwt_secret_key_here

# Ollama API base URL
OLLAMA_URL=http://localhost:11434

# Backend URL (self-reference)
BACKEND_URL=http://localhost:5000
```

### Frontend — `frontend/.env`

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# NextAuth configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here
```

---

## 🚀 Getting Started

### Step 1: Start External Services

```bash

# Terminal 1 — Qdrant
docker start qdrant

# Terminal 2 — Ollama (with performance tuning)
set OLLAMA_KEEP_ALIVE=-1
set OLLAMA_NUM_THREADS=8
set OLLAMA_MAX_LOADED_MODELS=2
ollama serve
```

### Step 2: Setup & Run Backend

```bash
# Terminal 4
cd backend-node

# Install dependencies
npm install

# Create .env file (see template above)
# Then start the server
node server.js  ||  npm run dev (install Nodemon)
```

You should see:
```
MongoDB Connected
Collection exists already.
Server running
```

### Step 3: Ingest Transactions into Qdrant

> **Run this once** after adding transactions to MongoDB. This embeds all transactions and upserts them into Qdrant for vector search.

```bash
# Terminal 5 (one-time operation)
cd backend-node
node src/scripts/ingest.js
```

You should see:
```
Found X transactions to ingest.
Ingestion Complete.
```

### Step 4: Setup & Run Frontend

```bash
# Terminal 6
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

You should see:
```
▲ Next.js 16.x
- Local: http://localhost:3000
```

### Step 5: Open the App

Navigate to **http://localhost:3000** in your browser.

1. **Sign up** a new account at `/sign-up`
2. **Sign in** at `/sign-in`
3. Go to **AI Assistant** and start chatting with your financial data

---

## 🖥️ Execution Commands Reference

| Action | Command | Directory |
|---|---|---|
| **Install backend deps** | `npm install` | `backend-node/` |
| **Start backend** | `node server.js` | `backend-node/` |
| **Ingest transactions** | `node src/scripts/ingest.js` | `backend-node/` |
| **Install frontend deps** | `npm install` | `frontend/` |
| **Start frontend (dev)** | `npm run dev` | `frontend/` |
| **Build frontend** | `npm run build` | `frontend/` |
| **Start frontend (prod)** | `npm run start` | `frontend/` |
| **Start Qdrant (Docker)** | `docker start qdrant` | anywhere |
| **Start Ollama** | `ollama serve` | anywhere |
| **Pull LLM model** | `ollama pull qwen2.5:7b` | anywhere |
| **Pull embedding model** | `ollama pull nomic-embed-text` | anywhere |
| **List Ollama models** | `ollama list` | anywhere |
| **Check loaded models** | `ollama ps` | anywhere |

---

## 🔧 Ollama Performance Tuning (CPU-only)

If running without a GPU, set these environment variables **before** starting Ollama:

```bash
set OLLAMA_KEEP_ALIVE=-1            # Keep model loaded in RAM permanently
set OLLAMA_NUM_THREADS=8            # Match your CPU core count
set OLLAMA_MAX_LOADED_MODELS=2      # Keep LLM + embedding model both loaded
ollama serve
```

### Recommended Models by Hardware

| Hardware | LLM Model | Expected Response Time |
|---|---|---|
| GPU (6GB+ VRAM) | `qwen2.5:7b` | ~3-8s |
| CPU (16GB+ RAM) | `qwen2.5:7b` | ~15-25s |
| CPU (8GB RAM) | `qwen2.5:3b` | ~10-15s |
| CPU (low-end) | `phi3:mini` | ~10-18s |

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/sign-up` | Register a new user | Creates a New User in MongoDB
| `POST` | `/api/auth/sign-in` | Login, returns JWT token | Sign in the User with JWT
| `POST` | `/api/chat` | ✅ JWT | Send message to AI (SSE streaming response) |
| `GET` | `/api/conversations?userId=` | ✅ JWT | Get all conversations for a user |
| `GET` | `/api/conversations/:id` | ✅ JWT | Get a single conversation |
| `POST` | `/api/conversations` | ✅ JWT | Create a new conversation |
| `DELETE` | `/api/conversations/:id` | ✅ JWT | Delete a conversation |
| `GET` | `/api/transactions` | ✅ JWT | Get user transactions |

---

## 🧠 How RAG Works in This Project

```
User: "give me my last 5 transactions"
  │
  ├── Intent Detection → Temporal query detected (last 5)
  │     └── MongoDB: find().sort({ timestamp: -1 }).limit(5)
  │
  ├── Financial Summary built from last 100 transactions
  │     └── { totalCredit, totalDebit, balance, categoryMap, merchants }
  │
  ├── Prompt assembled: System Role + History + Financial Context + Instructions + Question
  │
  └── Ollama streams response token-by-token via SSE → Frontend renders live


User: "how much did I spend at Amazon?"
  │
  ├── Intent Detection → Not temporal, use semantic search
  │     └── embedText() → 768-dim vector
  │     └── Qdrant: cosine similarity search → top 8 relevant transactions
  │
  ├── Financial Summary built from last 100 transactions
  │
  ├── Prompt assembled with retrieved Amazon-related transactions
  │
  └── Ollama streams response via SSE → Frontend renders live
```

---

## 🔒 Security and Limitations

### Security
- **JWT Authentication** — All protected routes require a valid JWT token. Tokens are signed with a secret key and verified on each request.
- **Password Hashing** — User passwords are hashed with bcrypt before being stored in MongoDB Atlas.
- **Environment Variables** — Sensitive credentials (database URI, JWT secret, NextAuth secret) are stored in `.env` files and should **never** be committed to version control.
- **CORS** — Cross-origin requests are restricted via the `cors` middleware configuration.

### Limitations
- **Local LLM Only** — The AI assistant relies on Ollama running locally; there is no cloud LLM fallback. Response quality and speed depend on your hardware.
- **Single-User Focused** — While multi-user auth is supported, there is no role-based access control or admin panel.

---

## 🤝 Contributions

Contributions are welcome! To contribute:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -m "Add your feature"`)
4. **Push** to your branch (`git push origin feature/your-feature`)
5. **Open** a Pull Request

Please ensure your code follows the existing project structure and conventions. For major changes, open an issue first to discuss the proposed changes.

---

## 📄 License

This project is for educational and personal use.
