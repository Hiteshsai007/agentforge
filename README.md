# AI Agent Marketplace + Intent Router

## Prerequisites
- **Python 3.8+**
- **Node.js 18+ & npm**
- **Supabase Account**
- **Gemini API Key**

---

## Step 1: Database Setup (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Copy the entire content of [backend/db/schema.sql](backend/db/schema.sql) and run it.
   - *This will create all tables, enums, and properly set Row Level Security (RLS) for the prototype.*

---

## Step 2: Backend Configuration
1. Navigate to the `backend` folder: `cd backend`
2. Ensure you have a `.env` file with the following:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn supabase httpx python-dotenv google-generativeai
   ```

---

## Step 3: Seed the Database
From the root of the project, run the seeding script to populate agents and users:
```bash
python backend/db/seed.py
```
*You should see "✅" for several agents and a "Created company" message.*

---

## Step 4: Run the Application

### A. Start the Backend
Open a terminal and run:
```bash
cd backend
python main.py
```
*The server will be live at `http://localhost:8000`.*

### B. Start the Frontend
Open a **new** terminal and run:
```bash
cd frontend
npm install  # (First time only)
npm run dev
```
*The UI will be available at `http://localhost:5173`.*

---

## Step 5: Log In
Use the demo credentials created during seeding:
- **Admin**: `admin@acme.com`
- **End User**: `user@acme.com`
- **Developer**: `dev@agentco.com`
