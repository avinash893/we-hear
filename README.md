# We Hear — Anonymous 1-to-1 Peer Support Video Calling Platform

> **"Sometimes, you just need someone to listen."**  
> A simple, secure, calm, and responsive web application for anonymous 1-to-1 peer support video calls.

---

## 1. Core Architecture & Product Summary

| Feature | Specification |
| :--- | :--- |
| **Speaker / Client** | Pays **₹20** per 30-minute anonymous conversation. |
| **Peer Listener** | Earns **₹15** per successfully completed eligible call (if client ends first). |
| **Platform Fee** | **₹5** per completed call. |
| **Media Calling** | Peer-to-peer **WebRTC** (STUN & TURN support) with SRTP encryption. |
| **Signaling** | Real-time WebSocket signaling via Socket.IO mounted on the unified server. |
| **Anonymity** | Generated nature pseudonyms (e.g. *Quiet Sparrow*, *Blue Leaf*). Google profile data is **never** shared. |
| **24-Hour Guarantee** | Automated auto-refund if no eligible listener is matched within 24 hours. |
| **Safety** | Peer companionship positioning, instant blocking/reporting, national emergency hotlines. Strictly **no audio/video recording**. |

---

## 2. Technology Stack

- **Frontend & App Framework**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend & Real-Time**: Node.js HTTP server, Next.js Server Handlers, Socket.IO.
- **Database & ORM**: PostgreSQL in production / SQLite locally (`dev.db`) via Prisma ORM.
- **Authentication**: NextAuth.js (Google OAuth + built-in dev sandbox authentication).
- **Payment Processor**: Isolated `PaymentService` supporting Razorpay + Sandbox Mock Driver.
- **Testing**: Vitest for automated test suites.

---

## 3. Prerequisites

- **Node.js**: v18+ (tested on Node.js v26.1)
- **npm**: v9+ (or pnpm/yarn)
- **Browser**: Chrome, Safari, Firefox, Edge, or mobile browsers (Android Chrome, iOS Safari) with camera/microphone permissions enabled.
- **Database**: SQLite (preconfigured for instant zero-dependency local dev) or PostgreSQL (for production).

---

## 4. Quick Start / Local Development

### Step 1: Clone and Install
```bash
git clone <your-repo-url>
cd "we Hear"
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(In local development, the pre-configured `.env` works out of the box with zero setup using local SQLite and mock sandbox payments).*

### Step 3: Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### Step 4: Run the Application
```bash
npm run dev
```
Open your browser at: **`http://localhost:3000`**

---

## 5. End-to-End Testing Walkthrough (Dual-Browser Simulation)

You can test the complete call and payment lifecycle locally without live credentials using the built-in sandbox:

1. **Window 1 (Speaker / Client)**:
   - Navigate to `http://localhost:3000/auth/signin`
   - Check the **18+ age certification**
   - Click **Login as Speaker** (signed in as *e.g. Quiet Sparrow*)
   - Go to **Talk** (`/talk`), review the ₹20 / 30-min fee, and click **Find Someone to Talk To**
   - In dev mode, the sandbox driver verifies payment instantly and places the session into `WAITING_FOR_LISTENER`.

2. **Window 2 (Peer Listener)** (Use an Incognito or second browser):
   - Navigate to `http://localhost:3000/auth/signin`
   - Check the **18+ age certification**
   - Click **Login as Listener** (signed in as *e.g. Blue Leaf*)
   - Go to **Listen** (`/listen`), and toggle status to **Available**
   - The matchmaker assigns the listener instantly. Both windows redirect to `/call/[sessionCode]`.

3. **Inside the Call Room**:
   - WebRTC initializes camera and microphone streams.
   - The 30:00 countdown timer syncs with server timestamps.
   - Toggle microphone mute, camera off/on.
   - Test **Client Ends Call First**: Listener earns **+₹15**.
   - Test **Listener Ends Call First**: Listener forfeits earnings (**₹0**).
   - Test **Report / Block**: Opens report modal without revealing identities.

---

## 6. Google OAuth Setup (Production)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and configure the **OAuth consent screen** (User Type: External).
3. Under **Credentials**, click **Create Credentials** -> **OAuth client ID** -> **Web application**.
4. Set **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `https://yourdomain.com` (for production)
5. Set **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`
6. Copy the **Client ID** and **Client Secret** into your `.env`:
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

---

## 7. Razorpay Payment Gateway Setup

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** -> **API Keys** -> **Generate Key**.
3. In **Test Mode**, retrieve `Key Id` and `Key Secret`.
4. Update `.env`:
   ```env
   RAZORPAY_KEY_ID="rzp_test_xxxx"
   RAZORPAY_KEY_SECRET="your_razorpay_secret"
   RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
   ```
5. Configure Webhook URL in Razorpay Dashboard:
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Active Events: `payment.captured`, `order.paid`, `refund.processed`
   - Webhook Secret: paste matching secret.

---

## 8. WebRTC STUN & TURN Configuration

WebRTC establishes peer-to-peer connections. For users behind restrictive firewalls, corporate networks, or symmetric NATs, a **TURN server** is required:
1. Obtain TURN credentials (e.g. from Twilio Network Traversal, Metered.ca, Xirsys, or self-hosted Coturn).
2. Configure `.env`:
   ```env
   TURN_SERVER_URL="turn:turn.example.com:3478"
   TURN_USERNAME="turn_user"
   TURN_PASSWORD="turn_password"
   ```

---

## 9. Switching to PostgreSQL for Production

The codebase supports switching between SQLite and PostgreSQL in 1 second:
```bash
# Switch schema to PostgreSQL:
node scripts/switch-db-provider.js postgresql

# Update DATABASE_URL in .env:
# DATABASE_URL="postgresql://user:pass@host:5432/wehear?schema=public"

# Run Prisma Push / Migrations:
npx prisma db push
```

---

## 10. Automated Tests

Run the test suite using Vitest:
```bash
npm test
```
Tests cover:
- Anonymous nickname generation & anonymity guarantees.
- Matchmaking single-assignment lock & block filtering.
- Call ending rule (Client ends first -> ₹15, Listener ends first -> ₹0).
- Payment signature verification & webhook idempotency.
- 24-hour match expiration auto-refund logic.

---

## 11. Security Checklist Before Production Launch

- [ ] Ensure `NEXTAUTH_SECRET` is a secure 32+ character random string.
- [ ] Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- [ ] Ensure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` are set.
- [ ] Ensure `NODE_ENV=production`.
- [ ] Connect production PostgreSQL database with connection pooling enabled.
- [ ] Verify SSL/HTTPS certificate on your domain (WebRTC requires HTTPS in all modern browsers).
- [ ] Setup cron job for 24-hr refund worker: `POST /api/cron/expire-matches` with `Authorization: Bearer <CRON_SECRET>`.
- [ ] **Have legal documents (Terms, Privacy, Refund Policy) reviewed by a qualified attorney.**
