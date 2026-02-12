
create view wash_prop_owner_val_verify_vw
as

select
	wpov.year,
	wpov.sup_num,
	wpov.prop_id,
	wpov.owner_id,
	p.prop_type_cd,
	pv.appr_method,
	pv.udi_parent,
	pv.udi_parent_prop_id,
	pv.prop_inactive_dt,
	
	wpov.appraised_classified,
	wpov.appraised_non_classified,
	total_appraised = wpov.appraised,
	
	exempt_amount = isnull(exsummary.exempt_amount, 0),
	
	wpov.taxable_classified,
	wpov.taxable_non_classified,
	total_taxable = (wpov.taxable_classified + wpov.taxable_non_classified)
	
from wash_prop_owner_val as wpov
left outer join (
	select
		wpoe.year,
		wpoe.sup_num,
		wpoe.prop_id,
		wpoe.owner_id,
		sum(wpoe.exempt_value) as exempt_amount
	from wash_prop_owner_exemption as wpoe
	group by
		wpoe.year,
		wpoe.sup_num,
		wpoe.prop_id,
		wpoe.owner_id
) as exsummary on
	exsummary.year = wpov.year and
	exsummary.sup_num = wpov.sup_num and
	exsummary.prop_id = wpov.prop_id and
	exsummary.owner_id = wpov.owner_id
join property as p on
	p.prop_id = wpov.prop_id
join property_val as pv on
	pv.prop_val_yr = wpov.year and
	pv.sup_num = wpov.sup_num and
	pv.prop_id = wpov.prop_id
where
	(wpov.appraised_classified + wpov.appraised_non_classified) <> wpov.appraised
	or
	(wpov.appraised - isnull(exsummary.exempt_amount, 0)) <> (wpov.taxable_classified + wpov.taxable_non_classified)

GO

