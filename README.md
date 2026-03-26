# 🎬 Reddit Reel AI

<div align="center">

**AI-powered infinite scroll video feed from Reddit — like Instagram Reels, but smarter.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Auth.js](https://img.shields.io/badge/Auth.js-5-green?style=flat-square)](https://authjs.dev)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Security](#-security) • [Support](#-support)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Search** | Natural language queries with Ollama + smart fallback |
| 📱 **Vertical Feed** | Full-screen scroll-snap UI (TikTok/Reels style) |
| 🔐 **Secure Auth** | Auth.js + bcrypt password hashing |
| 💾 **Persistent Data** | SQLite database with Prisma ORM |
| 🎬 **Video Playback** | HLS streaming with audio support |
| 📌 **Save & Organize** | Bookmark reels into custom boards |
| 📝 **Notepad** | Take notes while browsing |
| 👨‍💼 **Admin Panel** | User & content management |
| 🔞 **NSFW Toggle** | Filter adult content on/off |
| ⚡ **Smart Preload** | Next reel loads while you watch |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([download](https://nodejs.org))
- **npm** or **yarn**

### 1️⃣ Clone & Install

```bash
git clone https://github.com/tarunkumar-sys/next_llm.git
cd next_llm
npm install
```

### 2️⃣ Setup Database

```bash
npx prisma generate
npx prisma db push
```

### 3️⃣ Environment Variables

Create `.env.local`:

```env
AUTH_SECRET=your-secret-here
DATABASE_URL=file:./prisma/dev.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Generate `AUTH_SECRET`:
```bash
npx auth secret
```

### 4️⃣ Start Development

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> 💡 First user to register becomes admin and gains access to `/admin` dashboard.

---

## 📖 Usage

### 🔍 Search & Discover
1. **Register** with email/password
2. **Type a query** in the chat panel:
   - `"funny car crashes"`
   - `"lion videos"`
   - `"coding tutorials"`
3. **Scroll** through the infinite feed
4. **Tap to play/pause**, **double-tap to like**

### 💾 Save & Organize
- **Bookmark** reels with the save button
- **Create boards** to organize by category
- **Drag & drop** reels between boards

### 📝 Notes
- Take quick notes while browsing
- Notes sync to your account
- Access from any device

### 🎛️ Admin Panel
Access `/admin` to:
- View all users
- Manage content
- Monitor activity

---

## 🏗️ Architecture

```
reddit-reel-ai/
├── 📁 app/
│   ├── admin/              # Admin dashboard
│   ├── actions/            # Server actions
│   ├── api/                # API routes
│   ├── dashboard/          # User dashboard
│   └── layout.tsx          # Root layout
├── 📁 components/          # React components
├── 📁 lib/                 # Utilities
├── 📁 prisma/              # Database
└── 📁 public/              # Static assets
```

---

## 🔒 Security

All sensitive information is protected:

- ✅ **API Authentication** — All endpoints require login
- ✅ **Console Disabled** — Production console disabled
- ✅ **DevTools Blocked** — F12 and shortcuts blocked
- ✅ **Data Isolation** — Users access only their data
- ✅ **SQL Injection Prevention** — Parameterized queries
- ✅ **XSS Protection** — Input sanitization

See [SECURITY.md](./SECURITY.md) for details.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | Prisma ORM + SQLite |
| **Auth** | Auth.js v5 + bcryptjs |
| **AI** | Ollama (local LLM) |
| **Styling** | CSS-in-JS + Design Tokens |

---

## 📦 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📞 Support

- 📖 [Documentation](./README.md)
- 🔒 [Security Guide](./SECURITY.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 🤝 [Contributing Guide](./CONTRIBUTING.md)

---

<div align="center">

**Made with ❤️ using Next.js, Auth.js, Prisma, and Ollama**

[⭐ Star us on GitHub](https://github.com/yourusername/reddit-reel-ai) • [🐛 Report Bug](https://github.com/yourusername/reddit-reel-ai/issues) • [💡 Request Feature](https://github.com/yourusername/reddit-reel-ai/issues)

</div>
