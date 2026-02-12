

CREATE VIEW dbo.auto_balance_exp_as_pv_vw
AS

SELECT 
	eai.dataset_id as validation_id,
	pv.prop_val_yr as prop_val_yr,
	pv.sup_num as sup_num,
	pv.prop_id as prop_id,
	pv.market as pv_market_val,
	convert(numeric(14,0), eai.market_value) as ex_market_val,
	pv.appraised_val as pv_appraised_val,
	convert(numeric(14,0), eai.appraised_val) as ex_appraised_val,
	pv.assessed_val as pv_assessed_val,
	convert(numeric(14,0), eai.assessed_val) as ex_assessed_val,
	pv.land_hstd_val as pv_land_hstd_val,
	convert(numeric(14,0), eai.land_hstd_val) as ex_land_hstd_val,
	pv.land_non_hstd_val as pv_land_non_hstd_val,
	convert(numeric(14,0), eai.land_non_hstd_val) as ex_land_non_hstd_val,
	pv.imprv_hstd_val as pv_imprv_hstd_val,
	convert(numeric(14,0), eai.imprv_hstd_val) as ex_imprv_hstd_val,
	pv.imprv_non_hstd_val as pv_imprv_non_hstd_val,
	convert(numeric(14,0), eai.imprv_non_hstd_val) as ex_imprv_non_hstd_val,
	pv.ag_use_val as pv_ag_use_val,
	convert(numeric(14,0), eai.ag_use_val) as ex_ag_use_val,
	pv.ag_market as pv_ag_market,
	convert(numeric(14,0), eai.ag_market) as ex_ag_market,
	pv.timber_use as pv_timber_use,
	convert(numeric(14,0), eai.timber_use) as ex_timber_use,
	pv.timber_market as pv_timber_market,
	convert(numeric(14,0), eai.timber_market) as ex_timber_market
FROM
property_val AS pv
INNER JOIN export_appraisal_info AS eai
ON pv.prop_val_yr = eai.prop_val_yr
AND pv.sup_num = eai.sup_num
AND pv.prop_id = eai.prop_id

GO

