
# 🤖 LumiX AI Chatbot Integration Guide

This document details the architecture, integration, and usage of the new **NOVA AI Chatbot** for the LumiX Landing Page.

## 1. Overview

The NOVA AI Chatbot is a multifunctional sales and support agent embedded directly into the landing page. It provides:
-   **24/7 Customer Support**: Answers questions about features, pricing, and technology.
-   **Voice Interaction**: Supports Speech-to-Text (Input) and Text-to-Speech (Output).
-   **Site Control**: Can navigate the user to specific sections (Pricing, Demo) or pages (Login).
-   **Multilingual Support**: Powered by Google Gemini Pro, it natively understands and speaks multiple languages.

## 2. Architecture

### Frontend (`components/LandingChatBot.tsx`)
-   **Tech Stack**: React, Lucide Icons, Web Speech API.
-   **State Management**: Handles message history, voice states, and UI toggles.
-   **Tool Execution**: Parses JSON responses from the backend to trigger client-side actions (e.g., scrolling, navigation).

### Backend (`backend/main.py` & `backend/ai_service.py`)
-   **Endpoint**: `POST /ai/landing-chat`
-   **Security**: Rate-limited (10 req/min) to prevent abuse. Basic origin/referer checks.
-   **AI Model**: OpenAI GPT-4 Turbo Preview (`gpt-4-turbo-preview`).
-   **Service**: Isolated `AIService` class for clean separation of concerns.
-   **System Prompt**: Configured as "NOVA", a futuristic sales agent with specific knowledge of LumiX features and pricing.

## 3. Integration Details

### API Contract
**Request:**
```json
{
  "prompt": "How much does the God Mode plan cost?",
  "history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Greetings. I am NOVA..."}
  ]
}
```

**Response (Text):**
```json
{
  "response": "The God Mode plan is $999/month and includes full AI Agent Grid access."
}
```

## 4. Maintenance & Configuration

### Modifying AI Behavior
Edit `backend/ai_service.py` -> `generate_landing_chat_response` method.
Update the `system_prompt` variable to change the AI's personality, knowledge base, or available tools.

### Error Handling
The API handles various scenarios:
- **Rate Limit Exceeded**: Returns 429 status code via SlowAPI.
- **OpenAI Failures**: Returns a friendly "neural link unstable" message and logs the specific error.
- **Invalid Requests**: Handled by FastAPI's Pydantic validation.

### Monitoring
Logs are available via the standard Python logging system in the `ai_service` logger. Every request is also logged to the `ai_request_logs` table in the database for usage tracking.

### Voice Settings
Edit `components/LandingChatBot.tsx` -> `speak` function.
You can adjust `pitch`, `rate`, and preferred `voice` (currently defaults to "Google US English" or "Samantha").

## 5. Troubleshooting

-   **"Neural Link Unstable"**: The backend cannot connect to the Gemini API. Check your `API_KEY` environment variable.
-   **Microphone Icon Missing**: The browser does not support `webkitSpeechRecognition`. Try using Google Chrome or Microsoft Edge.
-   **No Audio Output**: Ensure system volume is up and the browser has permission to play audio. Click the speaker icon in the chat header to toggle mute.
