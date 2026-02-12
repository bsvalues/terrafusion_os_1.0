




CREATE VIEW dbo.entity_stmnt_test_vw
AS
SELECT entity_id, levy_group_id, levy_group_yr, levy_run_id, 
    stmnt_id
FROM entity_stmnt_list_vw

GO

