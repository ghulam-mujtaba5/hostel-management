# Hostel Management System

A mobile-first, multi-tenant duties management system for hostels and flats.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    cd hostel-management
    npm install
    ```

2.  **Setup Supabase:**
    - Create a new project on [Supabase](https://supabase.com).
    - Go to the SQL Editor and run the contents of `supabase/schema.sql`.
    - Copy your Project URL and Anon Key from Project Settings > API.
    - Update `.env.local` with your keys:
        ```env
        NEXT_PUBLIC_SUPABASE_URL=your-project-url
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
        ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

4.  **Open the App:**
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- **Task Management:** Create, assign, and track tasks.
- **Fairness Algorithm:** Smart shuffling and recommendations.
- **Proof System:** Upload photos to verify task completion.
- **Gamification:** Earn points and climb the leaderboard.
- **Mobile First:** Designed for easy use on phones.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Database, Storage)
