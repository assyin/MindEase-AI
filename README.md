# MindEase AI — راحة العقل

> AI-powered mental health companion with voice interaction, expert personas, and multilingual support for MENA communities.

## Overview

MindEase AI is a therapeutic support platform designed for Arabic-speaking and Moroccan users. It combines large language model capabilities (Gemini + OpenAI) with real-time voice synthesis and recognition to deliver culturally-aware mental health support in Darija, Arabic, French, and English.

## Features

- **Dual-engine AI** — Gemini and OpenAI backends with automatic failover and model selection
- **Voice interaction** — real-time STT (Web Speech API) + TTS (Google GenAI, Gemini, OpenAI) with Moroccan voice profiles
- **Expert persona system** — configurable therapeutic AI roles with role-consistency enforcement middleware
- **Moroccan avatar system** — culturally localized visual identities per expert
- **Multi-language support** — Arabic, Darija, French, English with RTL layout
- **Session memory** — inter-session context persistence via Supabase
- **Therapeutic programs** — structured session arcs with phase management and transition control
- **Mood tracking** — longitudinal emotional state monitoring
- **Expert matching** — intelligent routing based on user needs and expert profiles
- **Push notifications** — contextual session reminders and alerts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui, RTL support |
| AI (Text) | OpenAI GPT-4o, Google Gemini |
| AI (Voice) | Google GenAI TTS, Gemini TTS, OpenAI TTS, Web Speech API |
| Backend | Supabase (Auth, PostgreSQL, Realtime) |
| State | React Context + custom service layer |

## Architecture

```
src/
├── services/       # 30+ service classes — AI engines, TTS, session management
│   ├── TherapeuticAI.ts          # Core therapeutic response engine
│   ├── AIModelManager.ts         # Multi-provider model routing
│   ├── ConversationalSessionManager.ts
│   ├── GeminiTTSService.ts
│   ├── GoogleGenAITTSService.ts
│   ├── InterSessionMemoryService.ts
│   └── RoleConsistencyService.ts # Persona enforcement middleware
├── components/     # Feature components: Chat, Voice, Avatar, Therapy, Dashboard
├── hooks/          # useNotifications, useSpeechSynthesis
├── contexts/       # Auth, Language, Conversations
└── data/           # Expert profiles, therapy themes, avatar definitions
```

## Getting Started

```bash
bun install
cp .env.example .env
# Configure Supabase, OpenAI, and Google GenAI keys
bun run dev
```

## License

Private — All rights reserved © 2025
