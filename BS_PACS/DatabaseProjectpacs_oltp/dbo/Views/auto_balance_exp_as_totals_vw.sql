

CREATE VIEW dbo.auto_balance_exp_as_totals_vw
AS

SELECT 
	vt.validation_id,
	vt.prop_val_yr,
	vt.sup_num,
	vt.entity_id as entity_id,
	et.entity_cd as entity_cd,
	vt.taxable_val as vt_taxable_val,
	convert(numeric(14,0), et.taxable_val) as ex_taxable_val,
	vt.market_val as vt_market_val,
	convert(numeric(14,0), et.market_value) as ex_market_val,
	vt.ag_market as vt_ag_market,
	convert(numeric(14,0), et.ag_market_val) as ex_ag_market,
	vt.ag_market_ex as vt_ag_market_ex,
	convert(numeric(14,0), et.ag_market_ex) as ex_ag_market_ex,
	vt.timber_market as vt_timber_market,
	convert(numeric(14,0), et.tim_market_val) as ex_timber_market,
	vt.timber_market_ex as vt_timber_market_ex,
	convert(numeric(14,0), et.timber_market_ex) as ex_timber_market_ex,
	vt.land_hstd_val as vt_land_hstd_val,
	convert(numeric(14,0), et.land_hstd_val) as ex_land_hstd_val,
	vt.land_non_hstd_val as vt_land_non_hstd_val,
	convert(numeric(14,0), et.land_non_hstd_val) as ex_land_non_hstd_val,
	vt.imprv_hstd_val as vt_imprv_hstd_val,
	convert(numeric(14,0), et.imprv_hstd_val) as ex_imprv_hstd_val,
	vt.imprv_non_hstd_val as vt_imprv_non_hstd_val,
	convert(numeric(14,0), et.imprv_non_hstd_val) as ex_imprv_non_hstd_val,
	vt.personal_val as vt_personal_val,
	convert(numeric(14,0), et.personal_val) as ex_personal_val,
	vt.mineral_val as vt_mineral_val,
	convert(numeric(14,0), et.mineral_val) as ex_mineral_val,
	vt.auto_val as vt_auto_val,
	convert(numeric(14,0), et.auto_val) as ex_auto_val,
	vt.total_exemption_amount as vt_total_exemption,
	convert(numeric(14,0), et.ex_amt) as ex_total_exemption
FROM
validation_totals AS vt
INNER JOIN export_appraisal_entity_totals AS et
ON vt.validation_id = et.dataset_id
AND vt.entity_id = et.entity_id
AND vt.arb_status = '0'

GO

