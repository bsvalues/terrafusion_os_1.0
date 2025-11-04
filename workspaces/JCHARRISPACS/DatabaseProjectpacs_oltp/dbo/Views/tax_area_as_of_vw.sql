
create view tax_area_as_of_vw
as

	select
		year = psa.owner_tax_yr,
		prop_id = psa.prop_id,
		
		tax_area_id = case
			when tam.annexation_id is not null
			then tam.tax_area_destination_id
			else pta.tax_area_id
		end
		
	from (
		select
			owner_tax_yr = pta.year,
			prop_id = pta.prop_id,
			sup_num = max(pta.sup_num)
		from property_tax_area as pta with(nolock)
		group by
			pta.year,
			pta.prop_id
	) as psa
	join property_tax_area as pta with(nolock) on
		pta.year = psa.owner_tax_yr and
		pta.sup_num = psa.sup_num and
		pta.prop_id = psa.prop_id
	-- Join to get most recent annexation-accept-batch-balance date
	left outer join (
		select
			apa.year,
			apa.prop_id,
			effective_date = max(b.balance_dt)
		from annexation_property_assoc as apa with(nolock)
		join annexation as a with(nolock) on
			a.annexation_id = apa.annexation_id and
			a.accept_date is not null -- Annexation is accepted
		join scalar_input_value as siv with(nolock) on
			siv.spid = @@spid
		join batch as b with(nolock) on
			b.batch_id = a.divert_funds_batch_id and
			b.balance_dt <= siv.dateVal
		group by apa.year, apa.prop_id
	) as mra on
		mra.year = pta.year and
		mra.prop_id = pta.prop_id
	-- Join back on most recent annexation-accept-batch-balance date to get annexation_id
	left outer join (
		select
			apa.year,
			apa.prop_id,
			apa.annexation_id,
			apa.tax_area_source_id,
			effective_date = b.balance_dt
		from annexation_property_assoc as apa with(nolock)
		join annexation as a with(nolock) on
			a.annexation_id = apa.annexation_id and
			a.accept_date is not null -- Annexation is accepted
		join batch as b with(nolock) on
			b.batch_id = a.divert_funds_batch_id
	) as aid on
		aid.year = mra.year and
		aid.prop_id = mra.prop_id and
		aid.effective_date = mra.effective_date
	left outer join tax_area_mapping as tam with(nolock) on
		tam.annexation_id = aid.annexation_id and
		tam.tax_area_source_id = aid.tax_area_source_id

GO

