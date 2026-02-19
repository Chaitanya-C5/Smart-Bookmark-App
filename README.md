# Smart Bookmark App

A simple full-stack bookmark manager built with Next.js (App Router), Supabase, and Tailwind CSS.

Live Demo: [https://smart-bookmark-app-ten-blond.vercel.app/](https://smart-bookmark-app-ten-blond.vercel.app/)

GitHub Repo: [https://github.com/Chaitanya-C5/Smart-Bookmark-App/](https://github.com/Chaitanya-C5/Smart-Bookmark-App/)

---

## 🚀 Features

- Google OAuth authentication (Supabase Auth)
- Add bookmarks (title + URL)
- Delete bookmarks
- Bookmarks are private per user (Row Level Security enforced)
- Real-time updates across tabs using Supabase Realtime
- Deployed on Vercel

---

## 🏗 Tech Stack

Frontend:
- Next.js (App Router)
- React (Client Components)
- Tailwind CSS

Backend (BaaS):
- Supabase
  - Authentication (Google OAuth)
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Realtime subscriptions

Deployment:
- Vercel

---

## 🔐 How Bookmark Privacy Is Enforced

Bookmarks are private to each user using **Row Level Security (RLS)** at the database level.

Each bookmark row contains:

- `user_id` (UUID referencing authenticated user)

RLS Policies:

- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

This ensures:

- Users can only view their own bookmarks.
- Even if a malicious user manually calls the API with another bookmark ID, the database rejects the request.
- Security is enforced at the database level, not just the UI.

---

## 🔄 Realtime Implementation

Supabase Realtime is used to subscribe to `postgres_changes` on the `bookmarks` table.

Flow:
1. User inserts or deletes a bookmark.
2. PostgreSQL emits change event.
3. Supabase Realtime streams the event via WebSocket.
4. UI updates automatically without page refresh.

This allows real-time sync across multiple browser tabs.

---

## 🧠 Architecture Overview

User → Next.js (Vercel) → Supabase  
- Auth handled by Supabase OAuth
- Data stored in PostgreSQL
- RLS enforces data isolation
- Realtime handles live updates

No custom backend server was used.

---

## ⚙️ Environment Variables

The following environment variables are required:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

These are configured in:
- `.env.local` (development)
- Vercel Project Settings (production)

---

## 🧪 Challenges Faced & Solutions

### 1. Realtime Not Triggering
Issue:
Bookmarks were not updating in real-time.

Cause:
The `bookmarks` table was not added to the `supabase_realtime` publication.

Solution:
Added `public.bookmarks` to the Supabase realtime publication to enable change broadcasting.

---

### 2. Subscription Before Authentication
Issue:
Realtime events were not received.

Cause:
Subscription was initialized before user session was fully established.

Solution:
Delayed subscription setup until session was confirmed.

---

### 3. OAuth Redirect Configuration in Production

**Issue:**  
Google login worked in local development but failed or caused redirect inconsistencies in production.

**Cause:**  
OAuth flows depend on correctly configured redirect URLs and Site URL in Supabase.  
A mismatch between the Vercel deployment domain and the configured Site URL or allowed redirect URLs caused session cookies to not attach properly.

**Solution:**  
Updated Supabase → Authentication → URL Configuration to include:

- Production Vercel URL as the **Site URL**
- Both `http://localhost:3000` and the production domain under **Redirect URLs**

This ensured that OAuth callbacks correctly redirected to the deployed domain and authentication cookies were properly set.

---

## 📌 Security Considerations

- RLS enabled on `bookmarks` table.
- Policies restrict access based on `auth.uid()`.
- No sensitive keys exposed to frontend.
- Environment variables managed securely via Vercel.

---

## 🧭 Possible Improvements

- Add URL validation
- Add edit functionality
- Convert auth to fully server-side session validation
- Improve UI/UX
- Add loading skeletons
- Add pagination for scalability

---

## ⏱ Time Taken

Approximately 5 hours (including debugging OAuth and realtime configuration).

---

## 📚 Learnings

- Deep understanding of Supabase RLS
- OAuth flow debugging in production
- Realtime architecture with PostgreSQL replication
- Handling session persistence in Next.js App Router
- Production deployment considerations

---

## 📬 Author

Gella Chaitanya Venkata Sai
