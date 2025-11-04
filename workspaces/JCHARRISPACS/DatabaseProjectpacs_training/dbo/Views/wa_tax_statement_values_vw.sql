
create view wa_tax_statement_values_vw
as

-- This stored procedure calculates values displayed as extra information on tax statements.
-- When a property exemption is being prorated off, it calculates values as if the exemption
-- was not present at all.  In the future, we might need to accurately calculate the prorated
-- exemption loss instead.

select 

wpov.prop_id,
wpov.sup_num,
wpov.year, 

v2.land_value,
v2.imprv_value,
v2.total_value,
v3.exemption_amount,

case when v2.total_value < v3.exemption_amount 
	then 0
	else v2.total_value - v3.exemption_amount
end as taxable_value,

wpov.state_assessed

,has_exemption_prorated_off

from wash_prop_owner_val wpov with(nolock)

join property p with(nolock)
on wpov.prop_id = p.prop_id

join property_val pv with(nolock)
on wpov.prop_id = pv.prop_id
and wpov.year = pv.prop_val_yr
and wpov.sup_num = pv.sup_num

join wash_property_val wpv with(nolock)
on wpov.prop_id = wpv.prop_id
and wpov.sup_num = wpv.sup_num
and wpov.year = wpv.prop_val_yr

cross apply (
	select case when exists (
		select 1
		from property_exemption pe
		where pe.prop_id = pv.prop_id
		and pe.exmpt_tax_yr = pv.prop_val_yr
		and pe.sup_num = pv.sup_num
		and pe.termination_dt is not null
	) then 1 else 0 end as has_exemption_prorated_off
) v0

cross apply (
	select
		case when wpov.snr_frz_land_hs > 0 and has_exemption_prorated_off = 0
			then wpv.snr_land_lesser + wpov.land_non_hstd_val + wpov.ag_use_val
			else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
		end as land,

		case when wpov.snr_frz_imprv_hs > 0 and has_exemption_prorated_off = 0
			then wpv.snr_imprv_lesser + wpov.imprv_non_hstd_val
			else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
		end as imprv,
		
		(wpov.appraised_classified + wpov.appraised_non_classified) appraised
) v1

cross apply (
	select 
		v1.land as land_value,
		
		case when p.prop_type_cd in ('P', 'MN') and state_assessed = 0
			then v1.appraised
			else v1.imprv
		end as imprv_value,
	
		case when p.prop_type_cd in ('P', 'MN') or state_assessed > 0 
			then v1.appraised
			else v1.land + v1.imprv 
		end as total_value
) v2

cross apply (
	select case when has_exemption_prorated_off = 1 
		then 0
		else v2.total_value - (wpov.taxable_classified + wpov.taxable_non_classified) 
	end as exemption_amount
) v3

GO

