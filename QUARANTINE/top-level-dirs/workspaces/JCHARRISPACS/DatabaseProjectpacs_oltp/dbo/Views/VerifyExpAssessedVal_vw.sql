

CREATE view VerifyExpAssessedVal_vw
as
select 
	pv.prop_id  ,
	pv.prop_val_yr as year,
	pv.sup_num  ,
	0 as owner_id,
	0 as entity_id,
	case 	when CONVERT(float, rtrim(assessed_val)) < 0 then 'EX_AV_LT_0'
		when CONVERT(float, rtrim(assessed_val)) > CONVERT(float, rtrim(market_value)) then 'EX_AV_GT_MV'
		when CONVERT(float, rtrim(assessed_val)) <> CONVERT(float, rtrim(market_value))-
		(
			(CONVERT(float, rtrim(ag_market)) + CONVERT(float, rtrim(timber_market)))
			- (CONVERT(float, rtrim(ag_use_val)) + CONVERT(float, rtrim(timber_use)))
		)-CONVERT(float, rtrim(ten_percent_cap))
			then 'EX_AV_SUM'
		end as check_cd,
	dataset_id as ic_ref_id
from export_appraisal_info as pv with(nolock)
where (CONVERT(float, rtrim(assessed_val)) < 0 or CONVERT(float, rtrim(assessed_val)) > CONVERT(float, rtrim(market_value))
or CONVERT(float, rtrim(assessed_val)) <> CONVERT(float, rtrim(market_value))-
((CONVERT(float, rtrim(ag_market)) + CONVERT(float, rtrim(timber_market)))- 
(CONVERT(float, rtrim(ag_use_val)) + CONVERT(float, rtrim(timber_use))))-
CONVERT(float, rtrim(ten_percent_cap))
)

GO

