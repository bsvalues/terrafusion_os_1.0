
create procedure LayerCopyTablePropertyTaxArea
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

if @lYear_From = @lYear_To
begin
	insert dbo.property_tax_area with(rowlock) (
		[year],
		sup_num,
		prop_id,
		tax_area_id,
		tax_area_id_pending,
		effective_date,
		is_annex_value
	)
	select
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		tax_area_id,
		tax_area_id_pending,
		effective_date,
		is_annex_value
	from dbo.property_tax_area with(nolock)
	where
		[year] = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From
end
else
begin
	insert dbo.property_tax_area with(rowlock) (
		[year],
		sup_num,
		prop_id,
		tax_area_id,
		tax_area_id_pending,
		effective_date,
		is_annex_value
	)
	select 
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		case when new_annex.prop_id IS NULL THEN pta.tax_area_id
			  else isnull(pta.tax_area_id_pending, pta.tax_area_id) -- has matching annex with start_year = new year
		end,
		case when pending_annex.prop_id IS NOT NULL then pending_annex.tax_area_destination_id 
			  when new_annex.prop_id IS NULL THEN pta.tax_area_id_pending
			  else NULL -- has matching annex with start_year = new year but not a pending annex
		end,
		case when pending_annex.prop_id IS NOT NULL then pending_annex.effective_date
			  else NULL 
		end,
		case when new_annex.prop_id IS NULL THEN 0
			  else 1 -- has matching annex with start_year = new year
		end
	from property_tax_area as pta  with(tablockx)
	left join (
		-- get matching annexation info with start_year = to new year, if it exists
		select apa.prop_id, a.effective_date, a.start_year
		from annexation_property_assoc as apa with (nolock)
		join annexation as a with (nolock) on 
				apa.annexation_id = a.annexation_id
		where	a.start_year = @lYear_To
			and a.accept_date is not null
	) as new_annex on  
			pta.prop_id = new_annex.prop_id
		and pta.effective_date = new_annex.effective_date
	left join (
		-- see if there is a pending annexation for year after new year being copied to
		select apa.prop_id,tam.tax_area_destination_id, max(a.effective_date) as effective_date
		from annexation as a with (nolock) 
		join annexation_property_assoc as apa with (nolock) on 
				a.annexation_id = apa.annexation_id
		join tax_area_mapping as tam with (nolock) on 
				tam.annexation_id = apa.annexation_id
			and tam.tax_area_source_id = apa.tax_area_source_id
		where	a.start_year >= @lYear_To + 1
			and year(a.effective_date) < @lYear_To + 1
			and a.accept_date is not null
		group by prop_id,tam.tax_area_destination_id
	) as pending_annex on  
			pta.prop_id = pending_annex.prop_id
	where
		pta.[year] = @lYear_From and
		pta.sup_num = @lSupNum_From and
		pta.prop_id = @lPropID_From
		
end

return(0)

GO

