ALTER TABLE revenue_events
ADD COLUMN IF NOT EXISTS iamai_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS iamai_checks JSONB DEFAULT '{}'::jsonb;

SELECT SUM(value_usd) as total_verified_usd, COUNT(*) as txs
FROM revenue_events
WHERE type = 'inflow' AND iamai_verified = true;
