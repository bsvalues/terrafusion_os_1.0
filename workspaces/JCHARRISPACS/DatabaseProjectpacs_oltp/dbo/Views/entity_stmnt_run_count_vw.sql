






CREATE VIEW dbo.entity_stmnt_run_count_vw
AS
SELECT levy_group_id, levy_group_yr, levy_run_id, 
    sup_tax_yr, COUNT(stmnt_id) AS stmnt_count
FROM transfer_tax_stmnt
GROUP BY levy_group_id, levy_group_yr, levy_run_id, 
    sup_tax_yr

GO

