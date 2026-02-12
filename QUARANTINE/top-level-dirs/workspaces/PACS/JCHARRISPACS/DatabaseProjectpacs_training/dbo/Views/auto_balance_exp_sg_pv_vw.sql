

CREATE VIEW dbo.auto_balance_exp_sg_pv_vw
AS

SELECT 
	eai.dataset_id as validation_id,
	sgpi.sup_yr as prop_val_yr,
	sgpi.sup_num as sup_num,
	sgpi.prop_id as prop_id,
	sgpi.market as sup_market_val,
	convert(numeric(14,0), eai.market_value) as ex_market_val,
	sgpi.appraised_val as sup_appraised_val,
	convert(numeric(14,0), eai.appraised_val) as ex_appraised_val,
	sgpi.assessed_val as sup_assessed_val,
	convert(numeric(14,0), eai.assessed_val) as ex_assessed_val,
	sgpi.land_hstd_val as sup_land_hstd_val,
	convert(numeric(14,0), eai.land_hstd_val) as ex_land_hstd_val,
	sgpi.land_non_hstd_val as sup_land_non_hstd_val,
	convert(numeric(14,0), eai.land_non_hstd_val) as ex_land_non_hstd_val,
	sgpi.imprv_hstd_val as sup_imprv_hstd_val,
	convert(numeric(14,0), eai.imprv_hstd_val) as ex_imprv_hstd_val,
	sgpi.imprv_non_hstd_val as sup_imprv_non_hstd_val,
	convert(numeric(14,0), eai.imprv_non_hstd_val) as ex_imprv_non_hstd_val,
	sgpi.ag_use_val as sup_ag_use_val,
	convert(numeric(14,0), eai.ag_use_val) as ex_ag_use_val,
	sgpi.ag_market as sup_ag_market,
	convert(numeric(14,0), eai.ag_market) as ex_ag_market,
	sgpi.timber_use as sup_timber_use,
	convert(numeric(14,0), eai.timber_use) as ex_timber_use,
	sgpi.timber_market as sup_timber_market,
	convert(numeric(14,0), eai.timber_market) as ex_timber_market
FROM
export_appraisal_info AS eai
INNER JOIN export_appraisal_history as eah
ON eah.export_id = convert(int, eai.dataset_id)
INNER JOIN sup_group_property_info AS sgpi
ON sgpi.sup_group_id = eah.appraisal_year
AND sgpi.prop_id = convert(int, eai.prop_id)
AND sgpi.data_flag = 0

GO

