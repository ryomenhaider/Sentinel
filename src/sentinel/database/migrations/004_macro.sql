CREATE TABLE IF NOT EXISTS macro_data (
  date TIMESTAMPTZ NOT NULL,
  value DOUBLE PRECISION,
  series_id TEXT NOT NULL,
  unit TEXT NOT NULL,
  PRIMARY KEY (date, series_id)
);