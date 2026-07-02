# PrepAI 🚀

**PrepAI** is an AI-powered, full-stack interview preparation platform designed to simulate real-world voice interviews, analyze resumes, and generate targeted career assets. Built with modern web technologies and a self-healing Retrieval-Augmented Generation (RAG) pipeline, PrepAI empowers candidates to perfect their interviewing skills.

## ✨ Features

- **Voice-to-Text Interview Pipeline**: End-to-end voice interview simulation utilizing the browser's `MediaRecorder API` and **Groq Whisper** for lightning-fast, real-time audio transcription.
- **AI-Powered Evaluation**: Structured 1-10 rubric grading and feedback generation powered by **LLaMA 3.3-70B**.
- **Self-Healing RAG Pipeline**: Intelligent resume parsing with custom chunking, embedded using **Cohere 384-dimensional embeddings**. Searches are executed via **PostgreSQL `pgvector`** semantic cosine distance queries. The pipeline automatically purges and regenerates vectors when new resumes are uploaded to prevent data staleness.
- **Career Asset Generation**: Automatically matches resumes against Job Descriptions (JD Matcher), and generates highly tailored Cover Letters and LinkedIn Bios.
- **High-Performance Caching**: Implements a two-layer **Redis** caching strategy (1hr TTL for rapid question lookups, 24hr TTL with MD5-hashed AI feedback deduplication) to drastically reduce LLM overhead and API costs.
- **Premium UI/UX**: A fully responsive, highly tactile glassmorphism interface built with React and Tailwind CSS, featuring subtle micro-interactions and smooth animations.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js (Vite)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS (Custom Glassmorphism theme)
- **Routing**: React Router

### Backend & Database
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (hosted on Supabase with Transaction Pooling)
- **ORM**: SQLAlchemy
- **Vector Search**: `pgvector` extension
- **Caching**: Redis
- **File Storage**: Cloudinary (for resume PDFs)

### AI & Integrations
- **Groq API**: High-speed Whisper transcription & LLaMA inference
- **Cohere API**: High-quality semantic embeddings

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL 
- Redis Server
- API Keys for Groq, Cohere, and Cloudinary

### 1. Clone the Repository
```bash
git clone https://github.com/Anshv9616/PrepAi.git
cd PrepAI
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://postgres.[YOUR_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
GROQ_API_KEY=your_groq_api_key
COHERE_API_KEY=your_cohere_api_key
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_jwt_secret
ALGORITHM=HS256
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

Run the backend server:
```bash
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:8000
```

Start the Vite development server:
```bash
npm run dev
```

## 🏗️ Architecture Highlights

- **Connection Pooling Optimization**: Load tested with **Locust** to identify connection bottlenecks. Tuned SQLAlchemy `max_overflow` and `pool_size`, and migrated to Supabase's transaction pooler (port 6543) to support 100,000+ simulated concurrent requests without exhausting DB connections.
- **Stateless RAG Updates**: The resume vector ingestion pipeline is idempotent. Uploading a new resume dynamically triggers a garbage collection of old `pgvector` chunks before regenerating new embeddings, eliminating LLM hallucinations from outdated context.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/PrepAI/issues).

## 📝 License
This project is [MIT](LICENSE) licensed.
