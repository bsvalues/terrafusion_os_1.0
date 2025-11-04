-- SQL placeholder migration for Experiments table
-- Apply this manually or convert into EF Core migration in the main solution.

CREATE TABLE IF NOT EXISTS Experiments (
    Id uuid PRIMARY KEY,
    Name text NOT NULL,
    Description text,
    Manifest jsonb NOT NULL,
    Owner text,
    CreatedAt timestamptz NOT NULL DEFAULT now()
);
