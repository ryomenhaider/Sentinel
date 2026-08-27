CREATE TABLE IF NOT EXISTS baseline_results (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  baseline_name TEXT NOT NULL,
  target_column TEXT NOT NULL,
  horizon INTEGER NOT NULL,
  window_size INTEGER,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baseline_results_symbol ON baseline_results(symbol);
CREATE INDEX IF NOT EXISTS idx_baseline_results_baseline_name ON baseline_results(baseline_name);
CREATE INDEX IF NOT EXISTS idx_baseline_results_target_column ON baseline_results(target_column);
