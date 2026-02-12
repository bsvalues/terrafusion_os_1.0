
create view wash_levy_rate_vw
as

select
	l.year,
	l.tax_district_id,
	l.levy_cd,
	pt.prop_type_cd,

	levy_rate_classified = convert(numeric(13,10), case
		when pt.prop_type_cd in ('R','MH') and lexreal.exmpt_type_cd is not null
		then 0

		when pt.prop_type_cd in ('P','A') and lexpers.exmpt_type_cd is not null
		then 0

		else isnull(l.levy_rate, 0)
	end),

	levy_rate_non_classified = isnull(l.levy_rate, 0),

	levy_exemption = case
		when pt.prop_type_cd in ('R','MH') and lexreal.exmpt_type_cd is not null
		then 'SNR/DSBL'

		when pt.prop_type_cd in ('P','A') and lexpers.exmpt_type_cd is not null
		then 'FARM'

		else ''
	end,
	
	l.levy_description
	
from levy as l
left outer join levy_exemption as lexreal on
	lexreal.year = l.year and
	lexreal.tax_district_id = l.tax_district_id and
	lexreal.levy_cd = l.levy_cd and
	lexreal.exmpt_type_cd = 'SNR/DSBL'
left outer join levy_exemption as lexpers on
	lexpers.year = l.year and
	lexpers.tax_district_id = l.tax_district_id and
	lexpers.levy_cd = l.levy_cd and
	lexpers.exmpt_type_cd = 'FARM'
join property_type as pt on 0=0

GO

