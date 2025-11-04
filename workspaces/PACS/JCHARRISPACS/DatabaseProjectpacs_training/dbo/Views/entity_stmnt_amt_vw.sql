




CREATE VIEW dbo.entity_stmnt_amt_vw
AS
SELECT entity_stmnt_list_vw.entity_id, 
    entity_stmnt_list_vw.levy_group_id, 
    entity_stmnt_list_vw.levy_group_yr, 
    entity_stmnt_list_vw.levy_run_id, 
    entity_stmnt_list_vw.stmnt_id, 
    SUM(entity_1_tax_amt_vw.entity_1_tax_amt + entity_2_tax_amt_vw.entity_2_tax_amt)
     AS tax_due
FROM entity_1_tax_amt_vw INNER JOIN
    entity_stmnt_list_vw ON 
    entity_1_tax_amt_vw.levy_group_id = entity_stmnt_list_vw.levy_group_id
     AND 
    entity_1_tax_amt_vw.sup_tax_yr = entity_stmnt_list_vw.levy_group_yr
     AND 
    entity_1_tax_amt_vw.levy_run_id = entity_stmnt_list_vw.levy_run_id
     AND 
    entity_1_tax_amt_vw.stmnt_id = entity_stmnt_list_vw.stmnt_id AND
     entity_1_tax_amt_vw.entity_1_id = entity_stmnt_list_vw.entity_id
     INNER JOIN
    entity_2_tax_amt_vw ON 
    entity_stmnt_list_vw.entity_id = entity_2_tax_amt_vw.entity_2_id
     AND 
    entity_stmnt_list_vw.levy_group_id = entity_2_tax_amt_vw.levy_group_id
     AND 
    entity_stmnt_list_vw.levy_group_yr = entity_2_tax_amt_vw.sup_tax_yr
     AND 
    entity_stmnt_list_vw.levy_run_id = entity_2_tax_amt_vw.levy_run_id
     AND 
    entity_stmnt_list_vw.stmnt_id = entity_2_tax_amt_vw.stmnt_id
GROUP BY entity_stmnt_list_vw.entity_id, 
    entity_stmnt_list_vw.levy_group_id, 
    entity_stmnt_list_vw.levy_group_yr, 
    entity_stmnt_list_vw.levy_run_id, entity_stmnt_list_vw.stmnt_id

GO

