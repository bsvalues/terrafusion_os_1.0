
create view wa_tax_statement_tax_history_comparison_vw
as

	select distinct
		thc.year,
		thc.group_id,
		thc.run_id,
		thc.statement_id,
		thc.tax_district_id,
		thc.voted,
		thc.curr_year_levy_rate,
		thc.curr_year_taxes,
		thc.prior_year_levy_rate,
		thc.prior_year_taxes,
		thc.pct_change_levy_rate,
		thc.pct_change_taxes,
		thc.order_num,
		
		case when (lt.levy_part = 2) then
			 left(l.levy_description, 33)
		else
			 left(td.tax_district_desc, 33)
		end tax_district_desc
	from wa_tax_statement_tax_history_comparison as thc with(nolock)
	join tax_district as td with(nolock) on
		td.tax_district_id = thc.tax_district_id
	inner join 	levy l with(nolock)	on
		td.tax_district_id = l.tax_district_id
		and thc.year = l.year
	inner join levy_type lt with(nolock) on
		l.levy_type_cd = lt.levy_type_cd
	 and thc.levy_part = lt.levy_part

GO

