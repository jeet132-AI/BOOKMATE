-- Migration: category activation flag + default book categories.
-- Safe to run multiple times.
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

INSERT INTO categories (name, description) VALUES
  ('Engineering', 'Engineering subjects and reference books'),
  ('Computer Science', 'Programming, software and coding books'),
  ('Mathematics', 'Math and calculation books'),
  ('Physics', 'Physics theory and numerical books'),
  ('Medical', 'Medical studies and reference books'),
  ('Competitive Exams', 'NEET, JEE and other exam preparation'),
  ('Notes', 'Study notes and learning materials'),
  ('Other', 'All other books')
ON CONFLICT (name) DO NOTHING;
