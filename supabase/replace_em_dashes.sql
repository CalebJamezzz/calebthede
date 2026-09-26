-- Replace em dashes (—) in stored site text.
-- Run in the Supabase SQL editor. Step 1 is a read-only count; step 2 makes the change.
-- " — " (spaced) and "—" (unspaced) both become ", ". Read the result in the Scriptorium
-- afterwards: a comma is right most of the time, but a few sentences may want a period.

-- STEP 1: how many rows would change
select 'books' as tbl, count(*) from books where title like '%—%' or description like '%—%'
union all select 'articles', count(*) from articles where title like '%—%' or content like '%—%'
union all select 'projects', count(*) from projects where title like '%—%' or subtitle like '%—%' or description like '%—%'
union all select 'lab_entries', count(*) from lab_entries where title like '%—%' or description like '%—%';

-- STEP 2: apply
begin;
update books set
  title = regexp_replace(title, '\s*—\s*', ', ', 'g'),
  description = regexp_replace(description, '\s*—\s*', ', ', 'g')
where title like '%—%' or description like '%—%';

update articles set
  title = regexp_replace(title, '\s*—\s*', ', ', 'g'),
  content = regexp_replace(content, '\s*—\s*', ', ', 'g')
where title like '%—%' or content like '%—%';

update projects set
  title = regexp_replace(title, '\s*—\s*', ', ', 'g'),
  subtitle = regexp_replace(subtitle, '\s*—\s*', ', ', 'g'),
  description = regexp_replace(description, '\s*—\s*', ', ', 'g')
where title like '%—%' or subtitle like '%—%' or description like '%—%';

update lab_entries set
  title = regexp_replace(title, '\s*—\s*', ', ', 'g'),
  description = regexp_replace(description, '\s*—\s*', ', ', 'g')
where title like '%—%' or description like '%—%';
commit;
