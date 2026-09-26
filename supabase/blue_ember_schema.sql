-- Blue Ember content: characters, world entries, and future "Beyond the Book"
-- deep dives, all in one table. Run this once in the Supabase SQL editor.
--
-- Spoiler model: entry_tier gates whether the ENTRY appears in lists at all.
-- Within an approved entry, each block in `sections` carries its own tier —
-- the page hides sections above the reader's self-declared progress. Only
-- `status = 'approved'` rows are ever readable by a signed-out visitor;
-- drafts are visible only to the authenticated admin session, so unreleased
-- or unapproved material never reaches an anonymous client at all.

create table if not exists be_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('character','world','beyond')),
  slug text not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft','approved')),
  entry_tier int not null default 0,
  first_appearance int not null default 1,
  summary text,
  role text,           -- character's role, or a "beyond" entry's format (essay, timeline, etc.)
  about text[],        -- "beyond" entries only: slugs of related characters/world entries
  relationships jsonb not null default '[]',  -- [{ with, tier, label, note }]
  quotes jsonb not null default '[]',         -- [{ text, source, tier }]
  sections jsonb not null default '[]',       -- [{ tier, heading, body }] body is HTML
  source_notes text,   -- internal only, never rendered to visitors
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, slug)
);

alter table be_entries enable row level security;

drop policy if exists "be_entries public read approved" on be_entries;
create policy "be_entries public read approved"
  on be_entries for select
  using (status = 'approved' or auth.role() = 'authenticated');

drop policy if exists "be_entries admin write" on be_entries;
create policy "be_entries admin insert"
  on be_entries for insert
  with check (auth.role() = 'authenticated');

create policy "be_entries admin update"
  on be_entries for update
  using (auth.role() = 'authenticated');

create policy "be_entries admin delete"
  on be_entries for delete
  using (auth.role() = 'authenticated');
