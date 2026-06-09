-- Run once on existing databases (skip if column already exists)
ALTER TABLE appointments
  ADD COLUMN sub_counselling_types TEXT NULL
  AFTER counselling_type;
