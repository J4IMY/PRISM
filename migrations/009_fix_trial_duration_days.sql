UPDATE pricing_packages
SET trial_duration_days = NULL
WHERE trial_duration_days IS NOT NULL
  AND trial_duration_days NOT IN (7, 14, 30, 60, 90);
