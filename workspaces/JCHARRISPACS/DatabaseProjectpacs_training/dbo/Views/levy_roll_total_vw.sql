

CREATE VIEW dbo.levy_roll_total_vw
AS
SELECT tr.m_n_o_tax_pct, 
		tr.i_n_s_tax_pct, 
		tr.prot_i_n_s_tax_pct, 
		b.sup_tax_yr, b.entity_id, 
		SUM(b.bill_m_n_o) AS mno_amt, 
		SUM(b.bill_i_n_s - ISNULL(b.bill_prot_i_n_s, 0) - ISNULL(b.bill_late_ag_penalty, 0)) AS ins_amt, 
		SUM(ISNULL(b.bill_prot_i_n_s, 0)) AS prot_ins_amt, 
		SUM(b.bill_m_n_o + b.bill_i_n_s) AS total_amt, 
		SUM(ISNULL(b.bill_late_ag_penalty, 0)) AS ag_penalty_amt, 
		a.arb_status AS arb_status,
		b.bill_type AS type,
		a.tnt_export_id,
		a.pacs_user_id
FROM appraisal_totals as a
with (nolock)
join dbo.bill as b
with (nolock)
on a.entity_id = b.entity_id
and a.prop_val_yr = b.sup_tax_yr
JOIN dbo.tax_rate as tr
with (nolock)
ON b.entity_id = tr.entity_id 
AND b.sup_tax_yr = tr.tax_rate_yr
WHERE (b.bill_type = 'L')
and a.arb_status in ('C','0')
GROUP BY tr.m_n_o_tax_pct, tr.i_n_s_tax_pct, tr.prot_i_n_s_tax_pct, 
		b.sup_tax_yr, b.entity_id, b.bill_type,
		a.tnt_export_id, a.pacs_user_id, a.arb_status

GO

