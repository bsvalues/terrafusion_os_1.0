


CREATE VIEW dbo.entity_stmnt_run_vw
AS
SELECT entity_tax_statement_group.group_id, 
    entity_tax_statement_group.group_yr, 
    entity_tax_statement_group.group_desc, entity.entity_id, 
    entity.entity_cd, entity_tax_statement_run.levy_sup_num, 
    entity_tax_statement_run.levy_run, 
    entity_tax_statement_run.levy_stmnt_type, 
    entity_tax_statement_run.levy_sort_order, 
    entity_tax_statement_run.real_prop, 
    entity_tax_statement_run.personal_prop, 
    entity_tax_statement_run.mobile_prop, 
    entity_tax_statement_run.auto_prop, 
    entity_tax_statement_run.mineral_prop, 
    pacs_user.pacs_user_name, 
    entity_tax_statement_run.created_by, 
    entity_tax_statement_run.created_date, CONVERT(numeric(18, 
    0), entity_stmnt_run_count_vw.stmnt_count) AS stmnt_count, 
    entity_tax_statement_run.run_type
FROM entity_tax_statement_group INNER JOIN
    entity_tax_statement_group_assoc ON 
    entity_tax_statement_group.group_id = entity_tax_statement_group_assoc.group_id
     INNER JOIN
    entity_tax_statement_run ON 
    entity_tax_statement_group.group_id = entity_tax_statement_run.levy_group_id
     AND 
    entity_tax_statement_group.group_yr = entity_tax_statement_run.levy_year
     INNER JOIN
    entity ON 
    entity_tax_statement_group_assoc.entity_id = entity.entity_id INNER
     JOIN
    pacs_user ON 
    entity_tax_statement_run.created_by = pacs_user.pacs_user_id
     LEFT OUTER JOIN
    entity_stmnt_run_count_vw ON 
    entity_tax_statement_run.levy_group_id = entity_stmnt_run_count_vw.levy_group_id
     AND 
    entity_tax_statement_run.levy_year = entity_stmnt_run_count_vw.levy_group_yr
     AND 
    entity_tax_statement_run.levy_run = entity_stmnt_run_count_vw.levy_run_id
     AND 
    entity_tax_statement_run.levy_year = entity_stmnt_run_count_vw.sup_tax_yr

GO

