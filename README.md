# Pulse Air · Live Air Quality Intelligence

A self-contained, full-stack air quality dashboard built with **Next.js 16**, **React 19**, **PostgreSQL**, and **Drizzle ORM**. It delivers real-time AQI summaries, interactive maps, historical trends, 5-day forecasts, threshold alerts, and city comparisons — with zero external API keys or third-party data subscriptions.

![stack](https://img.shields.io/badge/stack-Next.js%2016%20%7C%20React%2019%20%7C%20PostgreSQL%20%7C%20Drizzle-blue)
![license](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [AQI Calculation](#aqi-calculation)
11. [Synthetic Data Engine](#synthetic-data-engine)
12. [Deployment](#deployment)
13. [Roadmap](#roadmap)
14. [License](#license)

---

## Overview

Air quality data is only useful when it can be read, understood, and acted upon. Pulse Air solves the "data exists but nobody can see it" problem by:

- Aggregating multi-pollutant readings into a single, color-coded **US AQI** score.
- Rendering live conditions on an interactive map.
- Surfacing historical trends and forecasts so users can plan outdoor activities.
- Alerting users when conditions cross health-relevant thresholds.

The entire application runs locally: data ingestion, storage, computation, and visualization all happen inside the Next.js runtime and PostgreSQL instance. No external weather service, map provider account, or API key is required.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Dashboard │  │   Alerts    │  │      Compare        │  │
│  │  (React 19) │  │   Panel     │  │      Panel          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │             │
│         └────────────────┴────────────────────┘             │
│                          │                                  │
│                   SWR Client Cache                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────▼──────────────────────────────────┐
│                   API Routes (Edge/Node)                    │
│  /api/locations  /api/readings  /api/forecast               │
│  /api/alerts     /api/compare   /api/ingest   /api/stats    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Drizzle ORM + node-postgres (pg)               │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL
┌──────────────────────────▼──────────────────────────────────┐
│                       PostgreSQL                            │
│     locations · readings · alert_configs · alert_logs       │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

- **Single runtime**: API routes and UI share the same Next.js process, eliminating cross-origin complexity.
- **Zero API keys**: A built-in synthetic data engine removes dependency on paid weather or map providers.
- **Type safety end-to-end**: Drizzle schema types flow from the database through server actions to React props.
- **Mobile-first**: The dashboard is usable on a phone before it is on a desktop.

---

## Features

### Dashboard

- **Location cards** sorted by worst AQI first, with trend indicators (rising / falling / stable).
- **Interactive Leaflet map** with AQI-colored markers and popups. Basemap uses free OpenStreetMap tiles with a dark-mode CSS filter.
- **Hero reading panel** showing current conditions, dominant pollutant, category, and health advice.
- **Historical trend chart** (Recharts area chart) with 24H / 7D / 30D / 90D time ranges.
- **Pollutant grid** with per-pollutant AQI sub-scores and WHO guideline context.
- **5-day forecast outlook** with daily peak AQI.

### Alerts

- Create threshold rules by metric (`aqi`, `pm25`, `pm10`, `o3`, `no2`, `so2`, `co`) and operator (`>`, `>=`, `<`, `<=`).
- Immediate evaluation against the latest reading on creation.
- Alert log history with timestamps and messages.
- Per-rule cooldown period to avoid notification spam.

### Compare

- Side-by-side comparison of two cities.
- Delta analysis for latest and average AQI.
- Combined trend chart overlay.

### Extras

- Auto-refreshing data via SWR.
- One-click **Refresh Data** button that re-runs the synthetic ingestion pipeline.
- Stats header showing monitored locations, total readings, and active alerts.
- Fully responsive navigation with mobile bottom-sheet-style tabs.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM | Drizzle ORM 0.45 + Drizzle Kit |
| Charts | Recharts |
| Map | Leaflet + react-leaflet |
| Date utils | date-fns |
| Data fetching | SWR |
| Validation | Zod |
| Icons | lucide-react |

---

## Project Structure

```text
.
├── src/
│   ├── app/                    # Next.js app routes
│   │   ├── api/                # API route handlers
│   │   │   ├── alerts/route.ts
│   │   │   ├── compare/route.ts
│   │   │   ├── forecast/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── ingest/route.ts
│   │   │   ├── locations/route.ts
│   │   │   ├── readings/route.ts
│   │   │   └── stats/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx            # Main dashboard shell
│   ├── components/             # React components
│   │   ├── AQIBadge.tsx
│   │   ├── AQICard.tsx
│   │   ├── AlertsPanel.tsx
│   │   ├── ComparePanel.tsx
│   │   ├── ForecastStrip.tsx
│   │   ├── Header.tsx
│   │   ├── MapView.tsx
│   │   ├── PollutantGrid.tsx
│   │   ├── StatCards.tsx
│   │   └── TrendChart.tsx
│   ├── db/
│   │   ├── index.ts            # PostgreSQL pool + Drizzle client
│   │   └── schema.ts           # Drizzle table definitions
│   └── lib/
│       ├── aqi.ts              # AQI calculation engine
│       ├── constants.ts        # AQI bands, pollutants, default locations
│       ├── data.ts             # Database query helpers
│       ├── ingest.ts           # Ingestion orchestrator
│       ├── seed.ts             # Location seeding
│       ├── synthetic.ts        # Synthetic data generator
│       ├── types.ts            # Shared TypeScript types
│       └── utils.ts            # Formatting utilities
├── .env
├── drizzle.config.json
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local or Docker)
- npm or pnpm

### 1. Clone and install

```bash
git clone <repo-url>
cd pulse-air
npm install
```

### 2. Configure the database

Create a PostgreSQL database and update `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/pulse_air
```

### 3. Push the schema

```bash
npx drizzle-kit push --config=drizzle.config.json
```

### 4. Seed initial data

```bash
curl http://localhost:3000/api/ingest
```

Or visit `/api/ingest` in your browser after starting the dev server.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |

No other environment variables are required. There are no API keys for map tiles, weather data, or alert providers.

---

## Database Schema

### `locations`

Monitored cities or sensor sites.

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `slug` | varchar(64) unique | URL-safe identifier |
| `name` | varchar(128) | Display name |
| `country` | varchar(64) | |
| `latitude` | real | |
| `longitude` | real | |
| `timezone` | varchar(64) | Default `UTC` |
| `is_active` | boolean | |
| `meta` | jsonb | Optional metadata |
| `created_at` | timestamptz | |

### `readings`

Hourly air quality readings (historical and forecast).

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `location_id` | int FK | |
| `measured_at` | timestamptz | |
| `pm25`, `pm10`, `o3`, `no2`, `so2`, `co` | real | µg/m³ except CO in mg/m³ |
| `aqi` | int | Computed overall US AQI |
| `dominant_pollutant` | varchar(16) | Pollutant driving the AQI |
| `category` | varchar(32) | e.g. `Good`, `Moderate` |
| `health_advice` | text | Human-readable guidance |
| `forecast` | boolean | `true` for forecast rows |

### `alert_configs`

User-defined threshold rules.

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `location_id` | int FK nullable | `null` = all locations |
| `name` | varchar(128) | |
| `email` | varchar(256) | Optional notification address |
| `metric` | varchar(16) | `aqi`, `pm25`, ... |
| `operator` | varchar(4) | `gt`, `gte`, `lt`, `lte` |
| `threshold` | real | |
| `is_active` | boolean | |
| `cooldown_minutes` | int | |
| `last_triggered_at` | timestamptz | |

### `alert_logs`

History of triggered alerts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial PK | |
| `alert_id` | int FK | |
| `location_id` | int FK nullable | |
| `metric` | varchar(16) | |
| `threshold` | real | |
| `observed_value` | real | Value that triggered the alert |
| `message` | text | |
| `acknowledged` | boolean | |
| `created_at` | timestamptz | |

---

## API Reference

### `GET /api/health`

Health check including database connectivity.

```json
{ "ok": true }
```

### `GET /api/locations`

Returns all active locations with their latest non-forecast reading and trend.

### `GET /api/readings?slug={slug}&hours={hours}&forecast=true|false`

Returns a location, its latest reading, and historical series.

| Param | Default | Description |
|-------|---------|-------------|
| `slug` | required | Location slug |
| `hours` | `168` | How many hours of history to return (max 2160) |
| `forecast` | `false` | Include forecast rows in history |

### `GET /api/forecast?slug={slug}`

Returns the 5-day forecast for a location.

### `GET /api/stats`

Dashboard summary counts.

```json
{ "stats": { "locations": 5, "readings": 11730, "alerts": 0 } }
```

### `POST /api/alerts`

Create a new alert rule.

```json
{
  "locationId": 1,
  "name": "Unhealthy AQI",
  "email": "user@example.com",
  "metric": "aqi",
  "operator": "gt",
  "threshold": 150,
  "cooldownMinutes": 60
}
```

### `DELETE /api/alerts?id={id}`

Delete an alert rule.

### `GET /api/compare?a={slug}&b={slug}&hours={hours}`

Compare two cities.

### `GET /api/ingest`

Re-run the synthetic data ingestion pipeline.

---

## AQI Calculation

Pulse Air uses **EPA-style breakpoints** with linear interpolation between concentration bands. Each pollutant is converted to a sub-AQI, and the overall AQI is the maximum sub-AQI.

```text
AQI = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
```

### Breakpoint table (selected pollutants)

| Pollutant | Good | Moderate | Unhealthy for Sensitive | Unhealthy | Very Unhealthy | Hazardous |
|-----------|------|----------|------------------------|-----------|----------------|-----------|
| PM2.5 (µg/m³) | 0–12.0 | 12.1–35.4 | 35.5–55.4 | 55.5–150.4 | 150.5–250.4 | 250.5–500.4 |
| PM10 (µg/m³) | 0–54 | 55–154 | 155–254 | 255–354 | 355–424 | 425–604 |
| O₃ (µg/m³) | 0–54 | 55–70 | 71–85 | 86–105 | 106–200 | 201–600 |
| NO₂ (µg/m³) | 0–53 | 54–100 | 101–360 | 361–649 | 650–1249 | 1250–2049 |
| SO₂ (µg/m³) | 0–35 | 36–75 | 76–185 | 186–304 | 305–604 | 605–1004 |
| CO (mg/m³) | 0–4.4 | 4.5–9.4 | 9.5–12.4 | 12.5–15.4 | 15.5–30.4 | 30.5–50.4 |

The pollutant responsible for the highest sub-AQI is flagged as the **dominant pollutant**.

---

## Synthetic Data Engine

Because real-time air quality APIs often require keys, rate-limit heavily, or have geographic gaps, Pulse Air includes a deterministic synthetic generator. It produces realistic hourly readings using:

- A per-city **base AQI** and daily amplitude.
- **Rush-hour spikes** for morning and evening traffic.
- **Diurnal ozone curves** driven by solar intensity.
- Per-city **pollutant bias** so each location has a characteristic dominant pollutant.
- A slight upward drift in forecast rows to simulate increasing uncertainty over time.

The generator is seeded by date, so re-running ingestion produces stable, believable patterns while still allowing the dashboard to refresh with new hours.

---

## Deployment

### Vercel

1. Push to GitHub.
2. Connect the repo to Vercel.
3. Add `DATABASE_URL` to Environment Variables.
4. Run `npx drizzle-kit push` against your production database once.
5. Hit `/api/ingest` to seed data.

### Docker

A `docker-compose.yml` example:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pulse_air
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/pulse_air
    depends_on:
      - db

volumes:
  pgdata:
```

---

## Roadmap

- [ ] Add CSV export for readings and alert logs.
- [ ] Add user-defined custom locations via UI.
- [ ] Add push / email notification dispatcher for alerts.
- [ ] Add air quality health index for sensitive groups (children, athletes, elderly).
- [ ] Add wind-aware pollution dispersion visualization.
- [ ] Add multi-language support.

---

## License

MIT © Pulse Air Contributors
