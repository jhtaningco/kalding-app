-- Add unique constraint on (word, language) to prevent duplicate dictionary entries
alter table public.words
  add constraint words_word_language_key unique (word, language);
