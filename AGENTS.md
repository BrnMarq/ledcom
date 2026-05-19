# 🤖 Agents Guidelines for FinanceTracker

Welcome to the FinanceTracker monorepo! This document provides essential instructions, commands, and code style guidelines for AI agents operating in this codebase.

## 🏗 Repository Structure

This is a monorepo consisting of two main directories:

- `/api`: The backend server (Node.js, Express, TypeScript, Prisma).
- `/mobile`: The frontend application (React Native, Expo, NativeWind).

---

## 🛠 Build, Lint, and Test Commands

### Backend (`/api`)

- **Install Dependencies**: `pnpm install` (will automatically run `postinstall` to generate Prisma client).
- **Run Development Server**: `pnpm run dev` (starts `nodemon`).
- **Build**: `pnpm run build` (runs Prisma generation and compiles TypeScript via `tsc`).
- **Database Push**: `npx prisma db push` (syncs schema to database).
- **Generate Prisma Client**: `npx prisma generate` (required after schema changes).
- **Run All Tests**: `pnpm test` (executes Jest test suite).
- **Run a Single Test**: `npx jest src/path/to/test.ts` (e.g., `npx jest src/services/ContextService.test.ts`).
- _Note_: Before running tests after making schema changes, always delete the `dist/` directory to prevent duplicate test execution errors (`rm -rf dist && pnpm test`).

### Frontend (`/mobile`)

- **Install Dependencies**: `pnpm install` (pnpm automatically resolves workspaces).
- **Run Development Server**: `pnpm start` (starts Expo).
- **Run Server with Cleared Cache**: `npx expo start -c` (essential after installing new Babel plugins or NativeWind configuration changes).
- **Lint**: `pnpm run lint`.

---

## 🎨 Code Style Guidelines

### 1. General Typescript

- **Strict Mode**: Both the `api` and `mobile` projects use strict TypeScript (`"strict": true`). Always provide interfaces or types for objects. Do not use `any` unless absolutely necessary (like in catch blocks for generic errors).
- **Naming Conventions**:
  - Classes, React Components, and Interfaces: `PascalCase`.
  - Variables, functions, and methods: `camelCase`.
  - Constants and Environment Variables: `UPPER_SNAKE_CASE`.

### 2. Backend Style (`/api`)

- **Architecture**: The API strictly follows a Controller-Service-Route architecture.
  - **Routes**: Define HTTP methods and attach middleware.
  - **Controllers**: Handle Request/Response objects, parse inputs, handle try/catch blocks, and return HTTP status codes.
  - **Services**: Contain all business logic and Prisma database calls. Controllers delegate work to Services.
- **Error Handling**: Use `try/catch` in controllers. If a service throws an error, the controller should catch it and return `res.status(500).json({ error: error.message })`.
- **Database (Prisma)**: Treat the `schema.prisma` file as the source of truth. Always use strict Enums (e.g., `TransactionType`, `TransactionFlow`) instead of generic strings where applicable.

### 3. Frontend Style (`/mobile`)

- **Architecture**: We use **Expo Router** for file-based navigation (e.g., `app/index.tsx`, `app/account/[id].tsx`).
- **Styling**: We use **NativeWind (TailwindCSS)** for styling. Use the `className` prop strictly instead of `StyleSheet.create`.
- **State Management**: Use React Hooks (`useState`, `useEffect`). For authentication state, use the custom `useAuth()` hook from `src/context/AuthContext.tsx`.
- **API Communication**: Always use the central Axios client configured in `src/api/client.ts`. It automatically attaches JWT auth tokens. Do not import raw `axios` directly into screens.
- **Error Handling**: Catch API errors cleanly and display feedback to the user using `Alert.alert('Error', message)`. Always handle loading states using `ActivityIndicator`.

---

## 🔒 Security and Environment

- **Never** hardcode secrets or API keys. Always use `process.env`.
- For the mobile app, environment variables must be prefixed with `EXPO_PUBLIC_` (e.g., `EXPO_PUBLIC_API_URL`).
- Do not commit physical media files (images, audio) generated during tests. Always mock AI/File behaviors during Jest testing.

## 🤖 General Rules

- **CRITICAL**: Do NOT commit code unless the user explicitly tells you to commit.
- **CRITICAL**: Do NOT force push to the database without asking for permission.

