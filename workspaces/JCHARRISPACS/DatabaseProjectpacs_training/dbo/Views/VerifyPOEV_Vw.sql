
create view VerifyPOEV_Vw
as

select 
	sup_yr as year, 
	prop_id,entity_id,
	owner_id,
	sup_num,
	taxable_val,
	assessed_val,
	frz_taxable_val,
	frz_assessed_val,
	frz_actual_tax,
	frz_tax_rate,
	frz_levy_actual_tax ,
	weed_taxable_acres,
	land_hstd_val,
	land_non_hstd_val ,
	imprv_hstd_val ,
	imprv_non_hstd_val ,
	ag_market ,
	ag_use_val ,
	timber_market ,
	timber_use ,
	ten_percent_cap ,
	exempt_val ,
	prop_type_cd ,
	tax_increment_flag ,
	tax_increment_imprv_val ,
	tax_increment_land_val ,
	arb_status,
	market_val ,
	ag_late_loss ,
	appraised_val ,
	freeport_late_loss ,
	transfer_pct,
	transfer_freeze_assessed,
	transfer_freeze_taxable,
	transfer_entity_taxable,
	transfer_taxable_adjustment,
	transfer_flag,
	ptd_actual_tax,
	new_val_hs,
	new_val_nhs,
	new_val_p,
	new_val_taxable,
	freeze_type,
	freeze_ceiling,
	freeze_yr,
	case 	when assessed_val < 0
			then 'POEV_AVLT0'
		when prop_type_cd in ('R', 'MH') and market_val <> imprv_hstd_val + imprv_non_hstd_val + land_hstd_val + land_non_hstd_val + 
				ag_market + timber_market
			then 'POEV_MV'
		when prop_type_cd in ('R', 'MH') and appraised_val <> imprv_hstd_val + imprv_non_hstd_val + land_hstd_val + 
				land_non_hstd_val + ag_use_val + timber_use
			then 'POEV_APV'
		when prop_type_cd in ('R', 'MH') and assessed_val <> appraised_val - ten_percent_cap
			then 'POEV_AV'
		end as check_cd,
	0 as ic_ref_id
from prop_owner_entity_val as poev with(nolock)
where (
	assessed_val < 0
	or ( prop_type_cd in ('R', 'MH')
		and (
			market_val <> imprv_hstd_val + imprv_non_hstd_val + land_hstd_val + land_non_hstd_val + 
				ag_market + timber_market
			or appraised_val <> imprv_hstd_val + imprv_non_hstd_val + land_hstd_val + land_non_hstd_val +
				ag_use_val + timber_use
			or assessed_val <> appraised_val - ten_percent_cap
		)
	)
)

GO

