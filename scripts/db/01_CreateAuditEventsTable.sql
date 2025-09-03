CREATE TABLE IF NOT EXISTS "AuditEvents" (
    "Id" SERIAL PRIMARY KEY,
    "Timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
    "User" VARCHAR(255),
    "Action" VARCHAR(255),
    "Details" TEXT
);
