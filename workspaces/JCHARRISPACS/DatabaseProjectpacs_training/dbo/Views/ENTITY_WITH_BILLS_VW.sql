




CREATE VIEW dbo.ENTITY_WITH_BILLS_VW
AS
SELECT
	entity.entity_id,
	entity.entity_cd,
	account.file_as_name,
	tax_rate.m_n_o_tax_pct,
	tax_rate.i_n_s_tax_pct,
	tax_rate.prot_i_n_s_tax_pct,
	tax_rate.stmnt_dt,
	tax_rate.tax_rate_yr,
	tax_rate.collect_for,
	tax_rate.collect_option,
	tax_rate.bills_created_dt,
	entity.rendition_entity
FROM
	entity
INNER JOIN
	tax_rate
ON
	entity.entity_id = tax_rate.entity_id
INNER JOIN
	account
ON
	entity.entity_id = account.acct_id
WHERE
	(tax_rate.bills_created_dt IS NOT NULL)

GO

