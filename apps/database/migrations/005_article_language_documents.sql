-- Languages master + documents + article_language link
-- Run against the Wings PostgreSQL database.

CREATE TABLE IF NOT EXISTS languages (
  id   SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

INSERT INTO languages (code, name) VALUES
  ('en', 'English'),
  ('zh', '中文'),
  ('ms', 'Bahasa Melayu'),
  ('hi', 'हिंदी'),
  ('ta', 'தமிழ்')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

CREATE TABLE IF NOT EXISTS documents (
  id            SERIAL PRIMARY KEY,
  original_name TEXT NOT NULL DEFAULT '',
  file_name     TEXT,
  file_path     TEXT,
  mime_type     TEXT,
  html_content  TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS article_language (
  id          SERIAL PRIMARY KEY,
  article_id  INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  language_id INT NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
  document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_article_language UNIQUE (article_id, language_id)
);

CREATE INDEX IF NOT EXISTS idx_article_language_article ON article_language(article_id);
CREATE INDEX IF NOT EXISTS idx_article_language_language ON article_language(language_id);
CREATE INDEX IF NOT EXISTS idx_article_language_document ON article_language(document_id);
