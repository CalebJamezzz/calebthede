-- Optional companion link shown on a book's page (set per book in the Scriptorium).
alter table books add column if not exists companion_label text;
alter table books add column if not exists companion_url text;

-- Optional: turn it on for Blue Ember now.
-- update books set companion_label = 'Explore the World of Blue Ember', companion_url = '/blue-ember' where title = 'Blue Ember';
