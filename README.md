# Geo Clock In

A web application that allows learners to clock in to a venue using geolocation. The system verifies that the learner is physically within an acceptable radius of the venue before allowing the clock-in.

## Live Demo

- **Frontend:** (add Vercel URL after deployment)
- **Backend:** (add Railway URL after deployment)

## Tech Stack

- **Frontend:** React + TypeScript, Vite, Axios, Supabase Auth
- **Backend:** Node.js + TypeScript, Express, Supabase
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel (frontend), Railway (backend)

## Features

- 🔐 Authentication via Supabase — learners must be logged in to clock in
- 📍 Geolocation validation — clock-ins are rejected if the learner is outside the venue's allowed radius
- 👩‍🏫 Facilitator dashboard — view today's clock-ins, active venues, and unique learner count
- 📋 Learner history — learners can see their own past clock-ins
- 🌍 Haversine formula — accurate distance calculation accounting for Earth's curvature

## Project Structure
```
geo-clock-in/
├── backend/          # Node.js + TypeScript API
│   └── src/
│       ├── index.ts          # Entry point
│       ├── supabase.ts       # Supabase client
│       ├── types/            # Shared TypeScript types
│       ├── middleware/       # JWT auth middleware
│       ├── services/         # Haversine geolocation logic
│       └── routes/           # API route handlers
└── frontend/         # React + TypeScript
    └── src/
        ├── App.tsx           # Auth gate + role-based routing
        ├── api.ts            # Axios instance + API calls
        ├── supabase.ts       # Supabase client (auth only)
        ├── hooks/            # useGeolocation hook
        ├── types/            # Shared TypeScript types
        └── pages/            # LoginPage, LearnerPage, FacilitatorPage
```

## Setup Instructions

### Prerequisites

- Node.js 18+ or Bun
- A Supabase account
- A GitHub account

---

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/geoLocationClockIn.git
cd geoLocationClockIn
```

---

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the **SQL Editor** and run the following in order:

**Create tables:**
```sql
CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  radius_m int NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'learner'
    CHECK (role IN ('learner', 'facilitator')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE clock_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  clocked_in_at timestamptz DEFAULT now(),
  latitude float8 NOT NULL,
  longitude float8 NOT NULL
);
```

**Enable RLS:**
```sql
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venues_read" ON venues
  FOR SELECT USING (true);

CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "clockins_insert_own" ON clock_ins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "clockins_read_own" ON clock_ins
  FOR SELECT TO authenticated USING (auth.uid() = learner_id);

CREATE POLICY "clockins_read_facilitator" ON clock_ins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'facilitator'
    )
  );
```

**Seed venues:**
```sql
INSERT INTO venues (name, address, latitude, longitude, radius_m) VALUES
  ('Venue One', '123 Example Street', -33.9258, 18.4232, 100),
  ('Venue Two', '456 Example Avenue', -33.9049, 18.4217, 150);
```

3. Go to **Authentication → Settings** and disable **email confirmations** for testing
4. Create test users via **Authentication → Users → Add user**
5. Update their profiles:
```sql
UPDATE profiles SET role = 'facilitator', full_name = 'Your Name'
WHERE id = (SELECT id FROM auth.users WHERE email = 'facilitator@example.com');
```

---

### 3. Backend Setup
```bash
cd backend
bun install
```

Create a `.env` file in the `backend/` folder:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
```

Run the dev server:
```bash
bun run dev
```

The API will be available at `http://localhost:3000`

---

### 4. Frontend Setup
```bash
cd frontend
bun install
```

Create a `.env` file in the `frontend/` folder:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3000
```

Run the dev server:
```bash
bun run dev
```

The app will be available at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check |
| GET | `/api/venues` | Required | List all venues |
| POST | `/api/clock-ins` | Required | Clock in to a venue |
| GET | `/api/clock-ins` | Facilitator only | Today's clock-ins |
| GET | `/api/clock-ins/me` | Required | Current learner's history |

### POST `/api/clock-ins`

Request body:
```json
{
  "venue_id": "uuid",
  "latitude": -33.9258,
  "longitude": 18.4232
}
```

Success response `201`:
```json
{
  "message": "Clocked in successfully!",
  "clock_in": { ... }
}
```

Rejection response `403`:
```json
{
  "error": "You are too far from the venue to clock in",
  "venue": "Venue Name",
  "allowed_radius_m": 100
}
```

---

## How Geolocation Validation Works

The backend uses the **Haversine formula** to calculate the straight-line distance between the learner's GPS coordinates and the venue's coordinates. If the distance exceeds the venue's `radius_m`, the clock-in is rejected.
```
distance = 2R × arctan(√a / √(1−a))
where a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
```

This accounts for the curvature of the Earth, making it accurate over geographic distances unlike a flat Pythagorean calculation.

---

## User Management

There is no self-registration in this app. Users are created and managed by an administrator directly in the Supabase dashboard under **Authentication → Users**. After creating a user, their profile role can be set via SQL:
```sql
UPDATE profiles SET role = 'facilitator', full_name = 'Name Here'
WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

This is intentional — a training provider controls who has access and what role they are assigned.

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Facilitator | facilitator@example.com | (set during setup) |
| Learner | learner@example.com | (set during setup) |
