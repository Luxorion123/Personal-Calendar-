/*
  Supabase SQL — run this in your Supabase SQL editor once:

  create table tasks (
    id text primary key,
    user_id uuid references auth.users not null,
    title text not null,
    date text not null,
    estimated_minutes integer not null default 30,
    category text not null default 'work',
    priority text not null default 'medium',
    notes text default '',
    completed boolean default false,
    google_event_id text,
    is_recurring boolean default false,
    recurring_id text,
    created_at timestamptz default now()
  );
  alter table tasks enable row level security;
  create policy "own tasks" on tasks for all using (auth.uid() = user_id);

  create table recurring_tasks (
    id text primary key,
    user_id uuid references auth.users not null,
    title text not null,
    estimated_minutes integer not null default 30,
    category text not null default 'work',
    priority text not null default 'medium',
    notes text default '',
    days_of_week integer[] not null default '{}',
    created_at timestamptz default now()
  );
  alter table recurring_tasks enable row level security;
  create policy "own recurring" on recurring_tasks for all using (auth.uid() = user_id);

  create table reflections (
    user_id uuid references auth.users not null,
    date text not null,
    task_reflections jsonb default '[]',
    mood integer default 0,
    overview text default '',
    primary key (user_id, date)
  );
  alter table reflections enable row level security;
  create policy "own reflections" on reflections for all using (auth.uid() = user_id);
*/

import { supabase } from './supabase'
import type { Task, RecurringTask, DayReflection } from '../types'

// ── helpers ──────────────────────────────────────────────────────────────────

function taskToRow(t: Task, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    title: t.title,
    date: t.date,
    estimated_minutes: t.estimatedMinutes,
    category: t.category,
    priority: t.priority,
    notes: t.notes,
    completed: t.completed,
    google_event_id: t.googleEventId ?? null,
    is_recurring: t.isRecurring ?? false,
    recurring_id: t.recurringId ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    estimatedMinutes: r.estimated_minutes,
    category: r.category,
    priority: r.priority,
    notes: r.notes ?? '',
    completed: r.completed,
    googleEventId: r.google_event_id ?? undefined,
    isRecurring: r.is_recurring ?? false,
    recurringId: r.recurring_id ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRecurring(r: any): RecurringTask {
  return {
    id: r.id,
    title: r.title,
    estimatedMinutes: r.estimated_minutes,
    category: r.category,
    priority: r.priority,
    notes: r.notes ?? '',
    daysOfWeek: r.days_of_week ?? [],
  }
}

// ── tasks ─────────────────────────────────────────────────────────────────────

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data } = await supabase.from('tasks').select('*').eq('user_id', userId)
  return (data ?? []).map(rowToTask)
}

export async function upsertTask(task: Task, userId: string) {
  await supabase.from('tasks').upsert(taskToRow(task, userId))
}

export async function dbDeleteTask(id: string) {
  await supabase.from('tasks').delete().eq('id', id)
}

export async function upsertManyTasks(tasks: Task[], userId: string) {
  if (tasks.length === 0) return
  await supabase.from('tasks').upsert(tasks.map((t) => taskToRow(t, userId)))
}

// ── recurring tasks ───────────────────────────────────────────────────────────

export async function fetchRecurringTasks(userId: string): Promise<RecurringTask[]> {
  const { data } = await supabase.from('recurring_tasks').select('*').eq('user_id', userId)
  return (data ?? []).map(rowToRecurring)
}

export async function upsertRecurringTask(rt: RecurringTask, userId: string) {
  await supabase.from('recurring_tasks').upsert({
    id: rt.id,
    user_id: userId,
    title: rt.title,
    estimated_minutes: rt.estimatedMinutes,
    category: rt.category,
    priority: rt.priority,
    notes: rt.notes,
    days_of_week: rt.daysOfWeek,
  })
}

export async function dbDeleteRecurringTask(id: string) {
  await supabase.from('recurring_tasks').delete().eq('id', id)
}

// ── reflections ───────────────────────────────────────────────────────────────

export async function fetchReflections(userId: string): Promise<Record<string, DayReflection>> {
  const { data } = await supabase.from('reflections').select('*').eq('user_id', userId)
  const map: Record<string, DayReflection> = {}
  for (const r of data ?? []) {
    map[r.date] = {
      date: r.date,
      taskReflections: r.task_reflections ?? [],
      mood: r.mood ?? 0,
      overview: r.overview ?? '',
    }
  }
  return map
}

export async function upsertReflection(ref: DayReflection, userId: string) {
  await supabase.from('reflections').upsert({
    user_id: userId,
    date: ref.date,
    task_reflections: ref.taskReflections,
    mood: ref.mood,
    overview: ref.overview,
  })
}

// ── bulk load ─────────────────────────────────────────────────────────────────

export async function fetchAllData(userId: string) {
  const [tasks, recurringTasks, reflections] = await Promise.all([
    fetchTasks(userId),
    fetchRecurringTasks(userId),
    fetchReflections(userId),
  ])
  return { tasks, recurringTasks, reflections }
}
