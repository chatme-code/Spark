# Spark — Dating App

A Tinder-style dating mobile app built with Expo / React Native (frontend) and Node.js/Express + PostgreSQL (backend).

## Tech Stack

### Frontend
- **Framework**: Expo SDK 54 + React Native
- **Router**: expo-router (file-based routing)
- **Language**: TypeScript
- **State**: React Context (Auth, App, Wallet, Chat)
- **Fonts**: Nunito via @expo-google-fonts/nunito
- **Icons**: @expo/vector-icons (Ionicons)
- **Animations**: React Native Animated API (standard, not reanimated)
- **HTTP Client**: @tanstack/react-query

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL via Neon (serverless)
- **Auth**: JWT (access token 7d) + refresh tokens (30d)
- **Password Hashing**: bcryptjs (12 rounds)
- **File Upload**: Multer (KYC documents)
- **Validation**: express-validator
- **Port**: 3001

## Running the App
- Workflow: **Start Backend** — `cd backend && npm run dev` (port 3001)
- Workflow: **Start Frontend** — `npm start`
- Mobile tunnel: `expo start --tunnel --port 5000` so Expo Go uses an ngrok URL instead of a local IP address
- Web preview: `npm run web`

## Key Config Notes
- `babel.config.js`: uses `babel-preset-expo` with `reanimated: false` to avoid the
  `react-native-worklets/plugin` error from react-native-reanimated v4
- `babel-preset-expo` pinned to `~54.0.10` to match Expo SDK 54
- `@expo/ngrok` is installed so phones can connect through Expo tunnel/ngrok instead of LAN IP

## App Features
| Feature | Route |
|---|---|
| Login | `/(auth)/login` |
| Register | `/(auth)/register` |
| KYC (4-step wizard) | `/(auth)/kyc` |
| Discover / Swipe | `/(tabs)/` |
| Matches | `/(tabs)/matches` |
| Chat list | `/(tabs)/chat` |
| Wallet | `/(tabs)/wallet` |
| Profile | `/(tabs)/profile` |
| Chatroom | `/chat/[id]` |
| Top-up coins | `/topup` |
| Withdraw | `/withdraw` |
| Notifications | `/notifications` |
| Connection debug | `/connection-debug` |

## Coin Economy
- 200 coins on signup
- 5 coins per message sent
- 10 coins per super-like
- 100 coins = $0.50 USD
- Min 100 coins to withdraw

## Backend API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Health check |
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns JWT |
| POST | `/api/auth/kyc` | Bearer | Submit KYC documents (multipart) |
| GET | `/api/auth/kyc/status` | Bearer | Check KYC verification status |
| POST | `/api/auth/refresh` | None | Refresh access token |
| POST | `/api/auth/logout` | Bearer | Logout, revoke refresh token |
| GET | `/api/auth/me` | Bearer | Get current user profile |

### KYC Flow — Face Liveness Only (no ID card required)
1. User registers → gets JWT with `kyc_status: "pending"`
2. User calls `POST /api/auth/kyc` with multipart form (3 wajah foto):
   - `face_tongue` (required) — foto sambil lihat lidah
   - `face_head_right` (required) — foto kepala menghadap kanan
   - `face_head_left` (required) — foto kepala menghadap kiri
3. System generates `liveness_score` (0–100)
4. Status changes to `"submitted"` → admin reviews → `"verified"` or `"rejected"`

### Database Tables
- `users` — core account info + kyc_status
- `kyc_submissions` — face liveness photos + liveness_score
- `refresh_tokens` — JWT refresh token store
- `user_profiles` — extended dating profile data

## Mock Data
- 12 profiles in `data/mockProfiles.ts` (picsum.photos seed images)
- Auto-reply chat simulation in ChatContext
- Persistent via AsyncStorage keys: `@spark_auth_user`, `@spark_matches`,
  `@spark_notifications`, `@spark_swiped`, `@spark_wallet`, `@spark_transactions`, `@spark_chat`
- Registered accounts are stored locally in AsyncStorage key `@spark_auth_users`; registration validates email uniqueness, password strength, confirmation, and terms agreement

## Design System
- Primary: `#FF4458` (coral/red)
- Background: `#0D0D0D`
- Card/Surface: `#1A1A1A`, `#2C2C2E`
- Text: white primary, `#8E8E93` secondary
- Font: Nunito (400, 600, 700, 800)

## Project Structure
```
app/
  _layout.tsx         # Root layout with all providers + auth guard
  (auth)/
    login.tsx
    register.tsx
    kyc.tsx           # 4-step KYC wizard
  (tabs)/
    _layout.tsx       # Bottom tab bar
    index.tsx         # Discover / swipe screen
    matches.tsx
    chat.tsx
    wallet.tsx
    profile.tsx
  chat/[id].tsx       # Chatroom
  topup.tsx
  withdraw.tsx
  notifications.tsx
  connection-debug.tsx # Tunnel/runtime diagnostics for Expo Go
components/
  SwipeCard.tsx       # PanResponder swipe gesture card
  MatchPopup.tsx      # Animated match celebration popup
  ErrorBoundary.tsx
context/
  AuthContext.tsx
  AppContext.tsx
  WalletContext.tsx
  ChatContext.tsx
data/
  mockProfiles.ts     # 12 mock user profiles
constants/
  colors.ts
lib/
  query-client.ts
utils/
  time.ts
```
