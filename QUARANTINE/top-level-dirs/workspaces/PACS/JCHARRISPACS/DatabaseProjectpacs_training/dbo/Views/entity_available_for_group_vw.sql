




CREATE VIEW dbo.entity_available_for_group_vw
AS
SELECT DISTINCT 
    entity.entity_id, entity.entity_cd, account.file_as_name, 
    tax_rate.tax_rate_yr, tax_rate.m_n_o_tax_pct, 
    tax_rate.i_n_s_tax_pct, tax_rate.stmnt_dt, 
    tax_rate.prot_i_n_s_tax_pct
FROM entity INNER JOIN
    account ON entity.entity_id = account.acct_id INNER JOIN
    tax_rate ON entity.entity_id = tax_rate.entity_id
WHERE (tax_rate.collect_option <> 'N') AND (NOT EXISTS
        (SELECT *
      FROM levy_group_entity_assoc
      WHERE levy_group_entity_assoc.levy_entity_id = tax_rate.entity_id
            AND 
           levy_group_entity_assoc.levy_year = tax_rate.tax_rate_yr))

GO

