

CREATE VIEW dbo.auto_balance_exp_sn_poev_vw
AS

SELECT 
	eaei.dataset_id as validation_id,
	sgei.sup_yr as sup_yr,
	sgei.sup_num as sup_num,
	sgei.prop_id as prop_id,
	eaei.entity_id as entity_id,
	eaei.entity_cd as entity_cd,
	sgei.assessed as sup_assessed_val,
	convert(numeric(14,0), eaei.assessed_val) as ex_assessed_val,
	sgei.taxable as sup_taxable,
	convert(numeric(14,0), eaei.taxable_val) as ex_taxable_val
FROM
export_appraisal_entity_info AS eaei
INNER JOIN export_appraisal_history as eah
ON eah.export_id = convert(int, eaei.dataset_id)
INNER JOIN sup_group_entity_info AS sgei
ON sgei.sup_yr = eah.appraisal_year
AND sgei.sup_num = eah.sup_num
AND sgei.entity_id = convert(int, eaei.entity_id)
AND sgei.prop_id = convert(int, eaei.prop_id)
AND sgei.data_flag = 0

GO

