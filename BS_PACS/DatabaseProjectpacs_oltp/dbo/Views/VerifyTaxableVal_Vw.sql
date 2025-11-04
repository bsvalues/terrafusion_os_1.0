
create view VerifyTaxableVal_Vw
as

select 
sup_yr as year, 
prop_id,entity_id,
owner_id,
sup_num,
taxable_val,
assessed_val,
pee_exempt_amt as exempt_amt, 
abs(taxable_val - (assessed_val-pee_exempt_amt)) as taxable_diff, -- This column has the taxable value difference 
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
	'TAX_VAL' as check_cd,
	0 as ic_ref_id
from prop_owner_entity_val as poev with(nolock)
inner join (
	select exmpt_tax_yr as pee_exmpt_tax_yr,sup_num as pee_sup_num,entity_id as pee_entity_id,
				prop_id as pee_prop_id,owner_id as pee_owner_id,
				sum(state_amt+local_amt) as pee_exempt_amt
	from property_entity_exemption as pee with(nolock)
	group by exmpt_tax_yr,sup_num,entity_id,prop_id,owner_id
) as pee_ex on
poev.sup_yr=pee_ex.pee_exmpt_tax_yr and
poev.sup_num=pee_ex.pee_sup_num and
poev.entity_id=pee_ex.pee_entity_id and
poev.prop_id=pee_ex.pee_prop_id and
poev.owner_id=pee_ex.pee_owner_id
where taxable_val <> assessed_val - pee_exempt_amt

GO

