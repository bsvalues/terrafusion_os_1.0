-- Minimal seeds to unlock end-to-end validation (safe placeholders)

-- Example: TA_AppSvr operator and job profile
USE [TA_AppSvr];
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tb_ta_operator') BEGIN RAISERROR('TA_AppSvr schema not published yet.', 10, 1) WITH NOWAIT; END
IF NOT EXISTS (SELECT 1 FROM dbo.tb_ta_operator WHERE operator_name = 'admin')
INSERT INTO dbo.tb_ta_operator (operator_name, active)
VALUES ('admin', 1);

-- Example: PACS_Training reference entries
USE [PACS_Training];
-- Add minimal reference insert statements here as needed by critical views/SPs

-- Example: Web_Internet_Benton required unique id seed
USE [Web_Internet_Benton];
-- Add minimal rows or sequences if required by GetUniqueID stored procedures

