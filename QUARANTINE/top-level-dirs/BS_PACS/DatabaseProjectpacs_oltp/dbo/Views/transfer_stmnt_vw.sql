









CREATE VIEW dbo.transfer_stmnt_vw
AS
SELECT DISTINCT 
    prop_id, owner_id, sup_tax_yr, sup_num, stmnt_id, 
    levy_group_id, levy_run_id
FROM bill

GO

