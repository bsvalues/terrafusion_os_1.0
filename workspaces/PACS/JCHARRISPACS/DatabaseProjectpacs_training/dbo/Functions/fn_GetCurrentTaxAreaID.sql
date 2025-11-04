
----------------------------------------------------------------------------------------------------
-- Gets the current tax_area_id for a property for a particular year and 'As Of' date based
-- on either the current tax area associated with the property or the pending tax area associated
-- with the property thru the most recently active annexation property based on the 'As Of' date
----------------------------------------------------------------------------------------------------
create function fn_GetCurrentTaxAreaID(@prop_id as int, @year numeric(4, 0), @as_of_date as datetime,
@sup_num as int = 0) 
returns int
begin
	declare @tax_area_id int

	select distinct @tax_area_id = 
		case 
			when tam.annexation_id is null then pta.tax_area_id
			else tam.tax_area_destination_id
		end
	from property_tax_area as pta with (nolock)
	left join (
		-- get all active annexations on the property
		select apa_inner.prop_id, a_inner.annexation_id, a_inner.balance_dt as effective_date
		from annexation_property_assoc as apa_inner with (nolock) 
		join (
			select annexation.*, b.balance_dt
			from annexation with (nolock) 
			join batch as b with (nolock) on 
					b.batch_id = annexation.divert_funds_batch_id
		) as a_inner on
				a_inner.annexation_id = apa_inner.annexation_id
			and a_inner.balance_dt <= @as_of_date
			and a_inner.accept_date is not null
			and a_inner.earliest_divert_funds_year <= @year
			and a_inner.start_year > @year
		where apa_inner.prop_id = @prop_id
	) as tmp on
			tmp.prop_id = pta.prop_id
	left join (
		-- get the max effective date <= @as_of_date of all active 
		-- annexations on the property to narrow the join above to
		-- one annexation (if it exists
		select apa_inner.prop_id, max(a_inner.balance_dt) as effective_date
		from annexation_property_assoc as apa_inner with (nolock) 
		join (
			select annexation.*, b.balance_dt
			from annexation with (nolock) 
			join batch as b with (nolock) on 
					b.batch_id = annexation.divert_funds_batch_id
		) as a_inner on 
				a_inner.annexation_id = apa_inner.annexation_id
			and a_inner.balance_dt <= @as_of_date
			and a_inner.accept_date is not null
			and a_inner.earliest_divert_funds_year <= @year
			and a_inner.start_year > @year
		where apa_inner.prop_id = @prop_id
		group by apa_inner.prop_id
	) as tmp2 on 
			tmp2.prop_id = tmp.prop_id
		and tmp2.effective_date = tmp.effective_date
	left join annexation_property_assoc as apa with (nolock) on
			apa.annexation_id = tmp.annexation_id
		and apa.prop_id = tmp.prop_id
	left join tax_area_mapping as tam with (nolock) on
			tam.annexation_id = tmp.annexation_id
		and tam.tax_area_source_id = apa.tax_area_source_id
	where pta.prop_id = @prop_id
		and pta.[year] = @year
		and pta.sup_num = @sup_num	

	return @tax_area_id
end

GO

