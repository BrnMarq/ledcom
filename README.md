# FinanceTracker 📈

FinanceTracker is a full-stack, AI-powered personal finance management application. It allows users to track their portfolios, record manual transactions, fetch daily asset prices, and—most importantly—use artificial intelligence to automatically parse receipts (images) and voice notes (audio) into structured financial transactions.

## 🏗 Repository Structure

This project is a monorepo consisting of two main directories:

- **`/api`**: The backend server.
- **`/mobile`**: The frontend mobile application.

---

## 🚀 The Backend (`/api`)

The backend is built with **Node.js**, **Express**, and **TypeScript**, utilizing **Prisma** as the ORM to interact with a **PostgreSQL** database.

### Key Features
- **User Authentication**: Secure JWT-based registration and login system (`bcryptjs`).
- **Account Management**: Users can create and manage multiple portfolios/accounts.
- **Transaction Ledger**: Records transactions (`IN` or `OUT`) categorized as `NEEDS`, `WANTS`, or `SAVINGS`. Supports bulk imports and detailed line items.
- **AI Processing Engine**: Integrates with **Google Gemini API** (`gemini-flash-latest`) to asynchronously parse uploaded audio (voice notes) and images (receipts). It automatically extracts items, calculates totals, and infers categories in Spanish.
- **Asset Price Tracking**: Fetches real-time prices for assets from multiple providers (CoinGecko, Binance P2P, BCV Web Scraper).
- **Automated Cron Jobs**: Uses Vercel Cron to trigger daily price fetches.

### Tech Stack
- Express.js & TypeScript
- Prisma ORM & PostgreSQL
- Google Gen AI SDK
- Multer (for media uploads)
- Jest & Supertest (for TDD/Testing)

---

## 📱 The Frontend (`/mobile`)

The mobile application is built with **React Native** and **Expo**, providing a seamless cross-platform experience for iOS and Android.

### Key Features
- **Auth Flow**: Secure login and registration with token persistence via `expo-secure-store`.
- **Smart Navigation**: Built with **Expo Router** for file-based routing.
- **Portfolio & Ledger Views**: Clean, modern UI to view accounts and detailed transaction histories.
- **AI Scanner**: A dedicated screen utilizing `expo-camera` and `expo-av` to capture receipts or record voice notes. The media is sent to the backend, where the AI extracts the structured financial data.
- **Modern Styling**: Styled entirely with **NativeWind** (TailwindCSS for React Native).

### Tech Stack
- React Native & Expo SDK
- Expo Router
- NativeWind (TailwindCSS)
- Axios
- Lucide React Native (Icons)

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL database
- Google Gemini API Key
- Expo Go (for mobile testing)

### Running the API
1. Navigate to `/api`: `cd api`
2. Install dependencies: `npm install`
3. Configure your `.env` file with `DATABASE_URL`, `JWT_SECRET`, and `GEMINI_API_KEY`.
4. Push the schema: `npx prisma db push`
5. Start the server: `npm run dev`

### Running the Mobile App
1. Navigate to `/mobile`: `cd mobile`
2. Install dependencies: `npm install`
3. Configure your `.env` file with your local API URL: `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000`
4. Start the Expo server: `npm start`
5. Scan the QR code with the Expo Go app on your phone.

---

## 🤖 AI Coding Assistants
If you are an AI agent working in this repository, please review the `AGENTS.md` file for strict coding guidelines, commands, and project conventions.

**CRITICAL**: Do NOT commit changes unless explicitly told to commit by the user.
