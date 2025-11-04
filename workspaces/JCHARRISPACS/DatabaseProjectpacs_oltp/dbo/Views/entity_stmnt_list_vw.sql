




CREATE VIEW dbo.entity_stmnt_list_vw
AS
SELECT entity.entity_id, transfer_tax_stmnt.levy_group_id, 
    transfer_tax_stmnt.levy_group_yr, 
    transfer_tax_stmnt.levy_run_id, 
    transfer_tax_stmnt.stmnt_id
FROM entity, transfer_tax_stmnt

GO

