

CREATE VIEW dbo.auto_balance_exp_sn_totals_vw
AS

SELECT 
	et.dataset_id as validation_id,
	sges.sup_yr,
	sges.sup_num,
	sges.entity_id,
	sges.curr_taxable as sup_taxable,
	convert(numeric(14,0), et.taxable_val) as ex_taxable_val
FROM
export_appraisal_entity_totals as et
INNER JOIN export_appraisal_history as eah
ON eah.export_id = convert(int, et.dataset_id)
INNER JOIN sup_group_entity_subtotal AS sges
ON sges.entity_id = convert(int, et.entity_id)
AND sges.sup_yr = convert(int, eah.appraisal_year)
AND sges.sup_num = convert(int, eah.sup_num)
AND sges.sup_action = 'T'

GO

