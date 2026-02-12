
CREATE VIEW dbo.appraisal_totals_vw
AS
SELECT
	appraisal_totals.entity_id,
	appraisal_totals.prop_val_yr,
	appraisal_totals.pacs_user_id,
	appraisal_totals.date_time,
	appraisal_totals.arb_status,
	appraisal_totals.prop_count,
	appraisal_totals.land_hstd_val,
	appraisal_totals.land_non_hstd_val,
	appraisal_totals.imprv_hstd_val,
	appraisal_totals.imprv_non_hstd_val,
	appraisal_totals.personal_prop_count,
	appraisal_totals.personal_val,
	appraisal_totals.mineral_prop_count,
	appraisal_totals.mineral_val,
	appraisal_totals.auto_prop_count,
	appraisal_totals.auto_val,
	appraisal_totals.ag_market,
	appraisal_totals.timber_market,
	appraisal_totals.ag_use,
	appraisal_totals.productivity_loss,
	appraisal_totals.ag_market_ex,
	appraisal_totals.timber_market_ex,
	appraisal_totals.ag_use_ex,
	appraisal_totals.timber_use_ex,
	appraisal_totals.productivity_loss_ex,
	appraisal_totals.ten_percent_cap,
	appraisal_totals.total_exemption_amount,
	appraisal_totals.tax_rate,
	appraisal_totals.tax_increment_loss,
	appraisal_totals.levy_amount,
	appraisal_totals.weed_taxable_acres,
	account.file_as_name,
	entity.entity_type_cd,
	appraisal_totals.timber_use,
	entity.weed_control,
	entity.entity_cd,
	appraisal_totals.tnt_export_id
FROM
	entity
INNER JOIN
	account
ON
	entity.entity_id = account.acct_id
INNER JOIN
	appraisal_totals
ON
	account.acct_id = appraisal_totals.entity_id

GO

