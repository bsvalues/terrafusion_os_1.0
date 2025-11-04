
create view wa_tax_statement_levy_vw
as

select
	wtsl.year, wtsl.group_id, wtsl.run_id, wtsl.statement_id, wtsl.tax_district_id, wtsl.voted, 
	wts.levy_rate, wts.tax_amount, 
	row_number() over(
		partition by wtsl.year, wtsl.group_id, wtsl.run_id, wtsl.statement_id, wtsl.voted 
		order by wtsl.order_num, wts.tax_district_desc) as order_num,
	left(wts.tax_district_desc, 33) as tax_district_desc
from wa_tax_statement_levy wtsl with(nolock)

join (
	select
		wtsldd.year, wtsldd.run_id, wtsldd.group_id, wtsldd.statement_id, wtsldd.tax_district_id,
		wtsldd.voted, lt.levy_part, case when lt.levy_part in (1,2) then l.levy_type_cd else '' end levy_type_cd,
		sum(wtsldd.levy_rate) as levy_rate, 
		sum(wtsldd.tax_amount) as tax_amount,
		max(y.tax_district_desc) as tax_district_desc

	from wa_tax_statement_levy_details_display wtsldd with(nolock)	

	join tax_district td with(nolock)
		on td.tax_district_id = wtsldd.tax_district_id  

	join levy l with(nolock)
		on l.year = wtsldd.year
		and l.tax_district_id = wtsldd.tax_district_id
		and l.levy_cd = wtsldd.levy_cd

	left join levy_type lt with(nolock)
		on lt.levy_type_cd = l.levy_type_cd

	left join levy_statement_option lso with(nolock)
		on wtsldd.year = lso.year
		and wtsldd.tax_district_id = lso.tax_district_id
		and wtsldd.levy_cd = lso.levy_cd

	outer apply (
	 select case when lt.levy_part in (1,2) then l.levy_type_cd else '' end levy_type_cd,
		case when lso.separate_levy_display = 1 then lso.levy_description else '' end as separate_levy_desc
	)x

	outer apply (
		select case when isnull(separate_levy_desc,'') <> '' then separate_levy_desc 
			when lt.levy_part in (1,2) then lt.levy_type_desc 
			else isnull(td.tax_district_desc, 'OTHER') end as tax_district_desc
	)y
	
	group by wtsldd.year, wtsldd.run_id, wtsldd.group_id, wtsldd.statement_id, wtsldd.tax_district_id, 
		wtsldd.voted, lt.levy_part, case when lt.levy_part in (1,2) then l.levy_type_cd else '' end, 
		y.tax_district_desc
) wts
	on wts.group_id = wtsl.group_id 
	and wts.year = wtsl.year
	and wts.run_id = wtsl.run_id
	and wts.statement_id = wtsl.statement_id
	and wts.tax_district_id = wtsl.tax_district_id
	and wts.voted = wtsl.voted
	and wts.levy_part = wtsl.levy_part

GO

