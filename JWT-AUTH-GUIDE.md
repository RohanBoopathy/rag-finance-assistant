# JWT Authentication Guide for QueryFi

A step-by-step guide to implementing Sign Up and Sign In with JWT authentication in this project. This covers the **backend (Node/Express + MongoDB)** and the **frontend (Next.js + NextAuth)**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Backend: Setting Up the Auth System](#3-backend-setting-up-the-auth-system)
   - [3.1 Environment Variables](#31-environment-variables)
   - [3.2 MongoDB Connection (`src/config/db.js`)](#32-mongodb-connection)
   - [3.3 User Model (`src/models/User.js`)](#33-user-model)
   - [3.4 Auth Controller (`src/controllers/authController.js`)](#34-auth-controller)
   - [3.5 Auth Routes (`src/routes/authRoutes.js`)](#35-auth-routes)
   - [3.6 Auth Middleware (`src/middleware/authMiddleware.js`)](#36-auth-middleware)
   - [3.7 Wire It Up in `server.js`](#37-wire-it-up-in-serverjs)
4. [Frontend: Building the Auth Pages](#4-frontend-building-the-auth-pages)
   - [4.1 Environment Variables](#41-environment-variables)
   - [4.2 NextAuth API Route](#42-nextauth-api-route)
   - [4.3 Session Provider](#43-session-provider)
   - [4.4 Auth Layout](#44-auth-layout)
   - [4.5 Reusable Form Components](#45-reusable-form-components)
   - [4.6 Sign Up Page](#46-sign-up-page)
   - [4.7 Sign In Page](#47-sign-in-page)
   - [4.8 Protecting Routes (Root Layout)](#48-protecting-routes)
5. [How the Full Flow Works](#5-how-the-full-flow-works)
6. [Testing the Flow](#6-testing-the-flow)
7. [Common Pitfalls & Tips](#7-common-pitfalls--tips)

---

## 1. Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Next.js Frontend  │         │  Node/Express Backend    │
│   (Port 3000)       │         │  (Port 5000)             │
│                     │         │                          │
│  Sign Up Page ──────┼──POST──►│  /api/auth/register      │
│                     │         │    → hash password       │
│                     │         │    → save to MongoDB     │
│                     │         │    → return user object  │
│                     │         │                          │
│  Sign In Page ──────┼──POST──►│  /api/auth/signin        │
│  (via NextAuth      │         │    → find user           │
│   CredentialsProvider)        │    → compare password    │
│                     │         │    → return JWT token    │
│                     │         │                          │
│  NextAuth manages   │         │  Protected routes use    │
│  session cookies    │         │  authMiddleware to verify│
│  client-side        │         │  JWT from Authorization  │
│                     │         │  header                  │
└─────────────────────┘         └──────────────────────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │     MongoDB      │
                                │(Users collection)│
                                └──────────────────┘
```

**Key concepts:**
- **bcryptjs** hashes passwords before storing them in the database.
- **jsonwebtoken (JWT)** creates a signed token on login — sent back to the client.
- **NextAuth** (on the frontend) uses a `CredentialsProvider` to call your backend's login endpoint, then manages the session/token via cookies.
- **authMiddleware** on the backend verifies the JWT on protected API routes.

---

## 2. Prerequisites

**Backend dependencies** (already in `backend-node/package.json`):
```bash
cd backend-node
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
npm install -D nodemon
```

**Frontend dependencies** (already in `frontend/package.json`):
```bash
cd frontend
npm install next-auth
```

**You also need:**
- A running MongoDB instance (local or Atlas). Get your connection string ready.
- Node.js 18+ installed.

---

## 3. Backend: Setting Up the Auth System

### 3.1 Environment Variables

Create a `.env` file in `backend-node/`:

**If using MongoDB Atlas (Cloud):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
JWT_SECRET=your_super_secret_key_here
```

**If using MongoDB Local:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/<dbname>
JWT_SECRET=your_super_secret_key_here
```

> The `db.js` connection code works identically for both — it simply reads whatever URI you provide. The only difference is the connection string format.

> **Important:** `JWT_SECRET` should be a long, random string. You can generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### 3.2 MongoDB Connection

**File: `backend-node/src/config/db.js`**

```js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
```

**What's happening:**
- Loads `MONGODB_URI` from `.env`.
- `mongoose.connect()` opens a connection pool to your MongoDB.
- If it fails, the process exits immediately — you don't want a server running without a database.

---

### 3.3 User Model

**File: `backend-node/src/models/User.js`**

```js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
```

**What's happening:**
- Defines a `User` collection with `name`, `email`, and `password` fields.
- `unique: true` on `email` ensures no two users can register with the same email (MongoDB creates a unique index).
- `timestamps: true` automatically adds `createdAt` and `updatedAt` fields.

---

### 3.4 Auth Controller

**File: `backend-node/src/controllers/authController.js`**

This is where the core logic lives — register and login.

```js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─── REGISTER ────────────────────────────────────────────
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Hash the password (10 salt rounds)
  const hashed = await bcrypt.hash(password, 10);

  // 2. Create the user in MongoDB
  const user = await User.create({
    name,
    email,
    password: hashed,
  });

  // 3. Return the created user
  res.json(user);
};

// ─── LOGIN ───────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  // 2. Compare provided password with stored hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  // 3. Generate a JWT (payload = user ID, expires in 7 days)
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 4. Send the token back to the client
  res.json({ token });
};
```

**Step-by-step explanation:**

| Step | Register | Login |
|------|----------|-------|
| 1 | Hash the plain-text password with `bcrypt.hash(password, 10)`. The `10` is the salt rounds — higher = more secure but slower. | Look up the user by email with `User.findOne({ email })`. |
| 2 | Save the user to MongoDB. The password stored is the **hash**, never the plain text. | Compare the submitted password against the stored hash using `bcrypt.compare()`. It returns `true`/`false`. |
| 3 | Return the user object (you may want to exclude the password in production). | If the password matches, create a JWT with `jwt.sign()`. The payload `{ id: user._id }` is embedded in the token. |
| 4 | — | Send the token to the client. The client stores this and sends it on future requests. |

**How `jwt.sign()` works:**
```
jwt.sign(payload, secretKey, options)
         │         │          │
         │         │          └─ { expiresIn: "7d" } = token valid for 7 days
         │         └─ Your JWT_SECRET from .env — used to sign/verify
         └─ Data embedded in the token (user ID)
```

The resulting token looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1Yj...`

---

### 3.5 Auth Routes

**File: `backend-node/src/routes/authRoutes.js`**

```js
import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);   // POST /api/auth/register
router.post("/signin", login);        // POST /api/auth/signin

export default router;
```

**What's happening:**
- Creates an Express Router.
- Maps `POST /register` → `register` controller.
- Maps `POST /signin` → `login` controller.
- These are mounted at `/api/auth` in `server.js`, so the full paths are `/api/auth/register` and `/api/auth/signin`.

---

### 3.6 Auth Middleware

**File: `backend-node/src/middleware/authMiddleware.js`**

```js
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // 1. Extract token from "Authorization: Bearer <token>"
  const token = req.headers.authorization?.split(" ")[1];

  // 2. No token = not authorized
  if (!token) return res.status(401).json({ message: "Not authorized" });

  // 3. Verify the token and attach user data to the request
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;

  // 4. Proceed to the next middleware/route handler
  next();
};
```

**How to use it on protected routes:**
```js
import { protect } from "../middleware/authMiddleware.js";

router.get("/profile", protect, (req, res) => {
  // req.user.id is available here (from the JWT payload)
  res.json({ userId: req.user.id });
});
```

**The flow:**
```
Client sends request with header:
  Authorization: Bearer eyJhbGciOiJIUzI1N...

  → middleware splits "Bearer eyJhb..." to get the token
  → jwt.verify() checks if the token is valid and not expired
  → If valid: decoded = { id: "user_id_here", iat: ..., exp: ... }
  → req.user = decoded → next() proceeds to route handler
  → If invalid/expired: throws an error → 401 response
```

---

### 3.7 Wire It Up in `server.js`

**File: `backend-node/server.js`**

```js
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import express from 'express';
import cors from 'cors';

import authRoutes from './src/routes/authRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';

dotenv.config();       // Load .env variables
connectDB();           // Connect to MongoDB

const app = express();
app.use(cors());       // Allow cross-origin requests (frontend on :3000 → backend on :5000)
app.use(express.json()); // Parse JSON request bodies

app.use('/api/auth', authRoutes);   // Mount auth routes
app.use('/api/chat', chatRoutes);   // Mount chat routes

app.listen(process.env.PORT, () => {
  console.log("Server running");
});
```

**Startup order matters:**
1. `dotenv.config()` — loads environment variables first.
2. `connectDB()` — connects to MongoDB.
3. Middleware setup — `cors()` and `express.json()`.
4. Route mounting — `/api/auth` and `/api/chat`.
5. `app.listen()` — starts the server.

---

## 4. Frontend: Building the Auth Pages

### 4.1 Environment Variables

**File: `frontend/.env`**

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

- `NEXTAUTH_URL` — the URL of your Next.js app.
- `NEXTAUTH_SECRET` — used by NextAuth to encrypt session tokens. Generate one with:
  ```bash
  openssl rand -base64 32
  ```
- `NEXT_PUBLIC_BACKEND_URL` — your Express backend URL. The `NEXT_PUBLIC_` prefix makes it available in client-side code.

---

### 4.2 NextAuth API Route

You need to create a NextAuth API route. This is the **bridge** between your frontend and your backend's login endpoint.

**File: `frontend/app/api/auth/[...nextauth]/route.ts`**

```ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Call your backend login endpoint
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signin`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          }
        );

        const data = await res.json();

        // 2. If we got a token back, return a user object
        if (res.ok && data.token) {
          return {
            id: data.token, // store token as the user id for simplicity
            email: credentials?.email,
            token: data.token,
          };
        }

        // 3. If login failed, return null (NextAuth shows error)
        return null;
      },
    }),
  ],

  // Store the JWT token in the session
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },

  pages: {
    signIn: "/sign-in", // Custom sign-in page (instead of NextAuth default)
  },

  session: {
    strategy: "jwt", // Use JWT strategy, not database sessions
  },
});

export { handler as GET, handler as POST };
```

**What's happening:**
1. **CredentialsProvider** — tells NextAuth we're using email/password (not OAuth).
2. **`authorize()`** — called when the user submits the sign-in form. It sends a POST to your backend and checks if a token is returned.
3. **`jwt` callback** — runs when a JWT is created. We attach the backend token to it.
4. **`session` callback** — runs when the session is read. We expose the token so the frontend can use it for API calls.
5. **`pages.signIn`** — redirects to your custom `/sign-in` page instead of NextAuth's built-in one.

---

### 4.3 Session Provider

**File: `frontend/app/Provider.tsx`**

```tsx
'use client'

import { SessionProvider } from "next-auth/react";
import React from "react";

export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}
```

**What this does:** Wraps your entire app so that any component can use `useSession()` to check if the user is logged in and access the session data.

**File: `frontend/app/layout.tsx`** — uses the Provider:

```tsx
import { Provider } from "./Provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
```

---

### 4.4 Auth Layout

**File: `frontend/app/(auth)/layout.tsx`**

```tsx
import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex justify-evenly items-center h-screen">
      <section className="flex flex-col">
        <h1 className="text-8xl">
          <span className="text-title">Q</span>UERY <br />
          <span className="text-title">Fi</span>
        </h1>
        <p className="mt-5">
          The best finance app powered by{" "}
          <span className="text-rag">Retrieval Augment Generation</span>
        </p>
      </section>

      <section>{children}</section>
    </main>
  );
};

export default AuthLayout;
```

**What this does:** Both `/sign-in` and `/sign-up` pages share this layout — the brand name on the left, the form on the right. Next.js route groups `(auth)` let you apply a layout without affecting the URL.

---

### 4.5 Reusable Form Components

**File: `frontend/components/form/InputField.tsx`**

```tsx
const InputField = ({
  name,
  label,
  value,
  placeholder,
  type = "text",
  disabled,
}: FormInputProps) => {
  return (
    <>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input
        className="h-12 w-full px-3 py-3 bg-white placeholder:text-gray-400 rounded-lg focus:border-yellow-500! focus:ring-0"
        id={name}
        name={name}          // ← IMPORTANT: this must match the name attribute
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        disabled={disabled}
      />
    </>
  );
};

export default InputField;
```

> **Critical detail:** The `name` attribute on the `<input>` is what lets you read the value from the form via `(e.target as HTMLFormElement).email.value`. Make sure the `InputField` component sets `name={name}` on the `<input>` element.

**File: `frontend/components/form/FooterLink.tsx`**

```tsx
import Link from "next/link";

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
  return (
    <div className="text-center pt-4">
      <p>
        {text}{" "}
        <Link className="text-yellow-300 underline" href={href}>
          {linkText}
        </Link>
      </p>
    </div>
  );
};

export default FooterLink;
```

---

### 4.6 Sign Up Page

**File: `frontend/app/(auth)/sign-up/page.tsx`**

```tsx
'use client'

import FooterLink from "@/components/form/FooterLink";
import InputField from "@/components/form/InputField";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Send registration data to backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: (e.target as HTMLFormElement).fullname.value,
            email: (e.target as HTMLFormElement).email.value,
            password: (e.target as HTMLFormElement).password.value,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to Sign Up");
      }

      // 2. On success, redirect to sign-in page
      router.push("/sign-in");
    } catch (error) {
      console.error("Unable to Sign Up", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-xl text-center mb-10">
        Welcome to <span className="text-title">Query-Fi</span>
      </h1>

      <form className="w-75 flex flex-col space-y-5" onSubmit={handleSubmit}>
        <InputField name="fullname" label="Full Name" placeholder="Enter your full name" value="" />
        <InputField name="email" label="Email" placeholder="Enter your email address" value="" />
        <InputField name="password" label="Password" placeholder="Enter your password" value="" type="password" />

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-lg border-2 border-yellow-300 bg-yellow-400 px-3 text-black hover:bg-black hover:text-yellow-300 hover:font-semibold cursor-pointer"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <FooterLink text="Already have an account?" linkText="Sign In" href="/sign-in" />
      </form>
    </>
  );
};

export default SignUp;
```

**Key things to note:**
- The fetch URL must use `NEXT_PUBLIC_BACKEND_URL` (not a hardcoded `localhost:3000` — that was a bug in the original code).
- The endpoint is `/api/auth/register` (not `/signin`).
- The body field is `name` (matching the backend model), not `fullname`.
- On success, redirect to `/sign-in` so the user can log in.

---

### 4.7 Sign In Page

**File: `frontend/app/(auth)/sign-in/page.tsx`**

```tsx
'use client'

import FooterLink from "@/components/form/FooterLink";
import InputField from "@/components/form/InputField";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SignIn = () => {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Use NextAuth's signIn() with the "credentials" provider
    const result = await signIn("credentials", {
      redirect: false,   // Don't auto-redirect, we handle it manually
      email: (e.target as HTMLFormElement).email.value,
      password: (e.target as HTMLFormElement).password.value,
    });

    // 2. Check for errors
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    // 3. On success, redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <>
      <h1 className="text-xl text-center mb-10">Welcome Back..!</h1>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <form className="w-75 flex flex-col space-y-5" onSubmit={handleSubmit}>
        <InputField name="email" label="Email" placeholder="Enter your email address" value="" />
        <InputField name="password" label="Password" placeholder="Enter your password" value="" type="password" />

        <button
          type="submit"
          className="h-12 rounded-lg border-2 border-yellow-300 bg-yellow-400 px-3 text-black hover:bg-black hover:text-yellow-300 hover:font-semibold cursor-pointer"
        >
          Sign In
        </button>

        <FooterLink text="Don't have an account?" linkText="Sign Up" href="/sign-up" />
      </form>
    </>
  );
};

export default SignIn;
```

**How `signIn()` from NextAuth works:**
```
signIn("credentials", { redirect: false, email, password })
   │          │                │
   │          │                └─ Don't auto-redirect — we check the result ourselves
   │          └─ Matches the CredentialsProvider name
   └─ NextAuth function from "next-auth/react"

Internally it:
  1. POSTs to /api/auth/callback/credentials
  2. NextAuth calls your authorize() function
  3. authorize() calls your backend POST /api/auth/signin
  4. If backend returns a token → user object is created → session is set
  5. Returns { ok: true, error: null } on success
  6. Returns { ok: false, error: "..." } on failure
```

---

### 4.8 Protecting Routes

To protect pages that require authentication, check the session on the client side.

**Example — in any protected page or layout:**

```tsx
'use client'
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  if (status === "loading") return <p>Loading...</p>;

  return <div>Welcome, {session?.user?.email}</div>;
}
```

**To send the JWT token on API requests to your backend:**

```tsx
const { data: session } = useSession();

const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${(session as any).accessToken}`,
  },
  body: JSON.stringify({ message: "Hello" }),
});
```

---

## 5. How the Full Flow Works

### Sign Up Flow
```
1. User fills out name, email, password on /sign-up
2. Frontend POSTs to backend: POST /api/auth/register
   Body: { name, email, password }
3. Backend hashes password with bcrypt
4. Backend saves user to MongoDB
5. Backend returns user object
6. Frontend redirects to /sign-in
```

### Sign In Flow
```
1. User fills out email, password on /sign-in
2. Frontend calls signIn("credentials", { email, password })
3. NextAuth calls authorize() in [...nextauth]/route.ts
4. authorize() POSTs to backend: POST /api/auth/signin
   Body: { email, password }
5. Backend finds user, compares password hash
6. Backend returns: { token: "eyJhbG..." }
7. authorize() returns user object with token
8. NextAuth stores the token in a session cookie (httpOnly)
9. Frontend redirects to /dashboard
```

### Authenticated API Call Flow
```
1. Frontend reads session: const { data: session } = useSession()
2. Frontend sends request with header:
   Authorization: Bearer eyJhbG...
3. Backend authMiddleware extracts and verifies the token
4. If valid: req.user = { id: "..." } → route handler runs
5. If invalid: 401 Unauthorized response
```

---

## 6. Testing the Flow

### Test the backend with curl/Postman:

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@test.com", "password": "password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "john@test.com", "password": "password123"}'
```

You should get back: `{ "token": "eyJhbGciOiJIUzI1NiIs..." }`

**Test a protected route:**
```bash
curl http://localhost:5000/api/some-protected-route \
  -H "Authorization: Bearer <paste-token-here>"
```

### Test the frontend:
1. Start the backend: `cd backend-node && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Go to `http://localhost:3000` → should redirect to `/sign-in`
4. Click "Sign Up" → fill the form → submit
5. You should be redirected to `/sign-in`
6. Enter the same credentials → submit
7. You should be redirected to `/dashboard`

---

## 7. Common Pitfalls & Tips

| Pitfall | Solution |
|---------|----------|
| Sign-up page sends to wrong URL (`localhost:3000/signin`) | Use `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register` |
| `InputField` doesn't set `name` attribute on `<input>` | Ensure `name={name}` is passed to the `<input>` element |
| Backend body expects `name` but frontend sends `fullname` | Map `fullname` → `name` in the fetch body |
| JWT token not available in session | Implement `jwt` and `session` callbacks in NextAuth config |
| CORS errors in the browser | Make sure `app.use(cors())` is in `server.js` |
| `jwt.verify()` throws on expired tokens | Wrap it in a try/catch in the middleware |
| Passwords stored in plain text | Always use `bcrypt.hash()` before saving |
| `.env` committed to git | Add `.env` to `.gitignore` |
| NextAuth shows default sign-in page | Set `pages: { signIn: "/sign-in" }` in NextAuth config |
| Token not sent with API requests | Read it from the session: `(session as any).accessToken` and add it to the `Authorization` header |

---

**You now have a complete JWT auth system!** The backend handles registration and token generation, while NextAuth on the frontend manages sessions and provides a clean API (`signIn()`, `useSession()`, `signOut()`) for your React components.
