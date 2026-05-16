# Daily Planner

A personal daily planner and productivity tracking web app with Google Calendar integration.

**Stack:** React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Zustand · date-fns · Recharts · Framer Motion

---

## Features

- **Dashboard** — Today's tasks with productivity score, 14-day upcoming summary, category time donut chart, and AI assistant placeholder
- **Monthly view** — Full calendar grid with category dots; click any day to view/add/edit tasks
- **Weekly view** — Seven-column layout with recurring task support (set tasks to repeat on chosen days of the week)
- **Daily view** — Timeline of the selected day, sortable by priority, with date picker
- **Reflection** — Per-task time logging, mood tracker (1–5), daily overview, streak counter, history with filter, export to Markdown
- **Quick add** — Press `N` anywhere to open the new task modal; press `K` to open search
- **Google Calendar sync** — Two-way sync via OAuth 2.0 (optional; app works fully offline without it)
- **LocalStorage persistence** — All data survives page refreshes without a backend

---

## Getting Started

```bash
git clone <repo>
cd daily-planner
npm install
cp .env.example .env
# Add your Google credentials to .env (optional — see below)
npm run dev
```

Open `http://localhost:5173`.

---

## Google Calendar Integration (Optional)

If you skip this step the app works fully without Google Calendar. Tasks stay in localStorage only.

### 1 — Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the **Google Calendar API**:
   - Navigate to **APIs & Services → Library**
   - Search for "Google Calendar API" and click **Enable**

### 2 — Create OAuth credentials

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Set **Application type** to **Web application**
3. Add your dev URL to **Authorised JavaScript origins**: `http://localhost:5173`
4. For production add your deployed URL (e.g. `https://your-app.vercel.app`)
5. Copy the **Client ID**

### 3 — Create an API key

1. **Credentials → Create Credentials → API key**
2. Restrict it to the Google Calendar API under **API restrictions**
3. Copy the **API key**

### 4 — Configure .env

```
VITE_GOOGLE_CLIENT_ID=<your client id>.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=<your api key>
```

### 5 — OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. Set **User type** to **External** (for personal use, stay in Testing mode)
3. Add your Google account as a test user

### How sync works

| Action | What happens |
|--------|-------------|
| Add task | Creates a Google Calendar all-day event |
| Edit task | Updates the event |
| Delete task | Deletes the event |
| Click Sync (sidebar) | Pulls new Google Calendar events as tasks |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Open new task modal |
| `K` | Open search |

---

## Deploying

### Vercel

```bash
npm i -g vercel
vercel
```

Add your environment variables in the Vercel project settings.

### Netlify

```bash
npm run build
# drag-and-drop dist/ to netlify.com, or use netlify CLI
```

Add `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` as environment variables, then add your Netlify URL to Google Cloud OAuth origins.

---

## Project Structure

```
src/
  components/
    ui/          # Primitive components (Button, Input, Dialog, etc.)
    layout/      # Sidebar, Layout wrapper, SearchModal
    tasks/       # TaskCard, TaskModal, RecurringTaskModal
    charts/      # CategoryDonut (Recharts)
    reflection/  # (reserved for future components)
  pages/
    HomePage.tsx
    MonthlyPage.tsx
    WeeklyPage.tsx
    DailyPage.tsx
    ReflectionPage.tsx
  hooks/
    useGoogleCalendar.ts
    useKeyboard.ts
  lib/
    utils.ts
    dateUtils.ts
    productivityUtils.ts
    exportUtils.ts
  store/
    index.ts     # Zustand store with localStorage persistence
  types/
    index.ts
```

---

## Phase 2 — AI Assistant

The AI Assistant card is already stubbed in the Dashboard. To activate it in a future phase:

1. Add a `POST /api/chat` route (e.g. via Vercel Edge Functions)
2. Wire the input in `HomePage.tsx` to the API
3. Pass context: today's tasks, reflection data, productivity score
