

CREATE VIEW dbo.auto_balance_exp_as_poev_vw
AS

SELECT 
	eaei.dataset_id as validation_id,
	poev.sup_yr as sup_yr,
	poev.sup_num as sup_num,
	poev.prop_id as prop_id,
	eaei.entity_id as entity_id,
	eaei.entity_cd as entity_cd,
	poev.market_val as poev_market_val,
	convert(numeric(14,0), eaei.market_val) as ex_market_val,
	poev.appraised_val as poev_appraised_val,
	convert(numeric(14,0), eaei.appraised_val) as ex_appraised_val,
	poev.assessed_val as poev_assessed_val,
	convert(numeric(14,0), eaei.assessed_val) as ex_assessed_val,
	poev.taxable_val as poev_taxable_val,
	convert(numeric(14,0), eaei.taxable_val) as ex_taxable_val,
	poev.land_hstd_val as poev_land_hstd_val,
	convert(numeric(14,0), eaei.land_hstd_val) as ex_land_hstd_val,
	poev.land_non_hstd_val as poev_land_non_hstd_val,
	convert(numeric(14,0), eaei.land_non_hstd_val) as ex_land_non_hstd_val,
	poev.imprv_hstd_val as poev_imprv_hstd_val,
	convert(numeric(14,0), eaei.imprv_hstd_val) as ex_imprv_hstd_val,
	poev.imprv_non_hstd_val as poev_imprv_non_hstd_val,
	convert(numeric(14,0), eaei.imprv_non_hstd_val) as ex_imprv_non_hstd_val,
	poev.ag_use_val as poev_ag_use_val,
	convert(numeric(14,0), eaei.ag_use_val) as ex_ag_use_val,
	poev.ag_market as poev_ag_market,
	convert(numeric(14,0), eaei.ag_market) as ex_ag_market,
	poev.timber_use as poev_timber_use,
	convert(numeric(14,0), eaei.timber_use) as ex_timber_use,
	poev.timber_market as poev_timber_market,
	convert(numeric(14,0), eaei.timber_market) as ex_timber_market
FROM
prop_owner_entity_val AS poev
INNER JOIN export_appraisal_entity_info AS eaei
ON poev.sup_yr = eaei.sup_yr
AND poev.sup_num = eaei.sup_num
AND poev.entity_id = eaei.entity_id
AND poev.prop_id = eaei.prop_id

GO

