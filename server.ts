import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

// Simple in-memory store for demonstration purposes
// In a real app, use a database like MongoDB or PostgreSQL
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Gemini Configuration ---
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// --- Routes ---

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Chat Endpoint (Backend Proxy for Security)
app.post('/api/chat', async (req, res) => {
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfiguration: API Key missing' });
    return;
  }

  const { message } = req.body;
  
  if (!message) {
     res.status(400).json({ error: 'Message is required' });
     return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
    });
    
    res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// --- Mock Data Endpoints ---

app.get('/api/user', (req, res) => {
    // Return mock user profile
    res.json({
        id: 999,
        name: "Ben (Demo User)",
        title: "Full Stack Geliştirici",
        tokens: 150
    });
});

app.get('/api/requests', (req, res) => {
    // Return mock requests
    res.json([
        { id: 101, title: "Spring Boot REST API", category: "yazilim" },
        { id: 102, title: "React State Management", category: "yazilim" }
    ]);
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Gemini API Key configured: ${!!apiKey}`);
});
