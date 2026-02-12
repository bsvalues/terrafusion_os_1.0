
create procedure LayerCopyTableAnnexationPropertyAssoc
	@PropID_From int,
	@Year_To numeric(4,0),
	@PropID_To int
as

	set nocount on

	
	insert into annexation_property_assoc with(rowlock) (
		annexation_id,
		prop_id,
		accepted,
		[year],
		tax_area_source_id
	)
	select distinct
		apa.annexation_id,
		@PropID_To as prop_id,
		apa.accepted,
		@Year_To as [year],
		case when pta.tax_area_id_pending is not null then pta.tax_area_id_pending else pta.tax_area_id end as tax_area_source_id
	from annexation_property_assoc apa with(nolock)
	inner join annexation a with(nolock) on
		apa.annexation_id = a.annexation_id
	inner join property_tax_area pta with(nolock) on
		pta.prop_id = @PropID_To and
		pta.[year] = @Year_To
	where 
		apa.prop_id = @PropID_From and
		@Year_To >= year(a.effective_date) - 1 and
		@Year_To <= a.start_year and
		not exists
		(
			select * 
			from annexation_property_assoc apa2 with(nolock)
			where 
				apa2.annexation_id = apa.annexation_id and
				apa2.prop_id = @PropID_To
		)

	return (0)

GO

