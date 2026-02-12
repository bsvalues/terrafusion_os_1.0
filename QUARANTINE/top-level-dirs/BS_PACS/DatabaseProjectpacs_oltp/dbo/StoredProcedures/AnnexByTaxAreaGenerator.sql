
create procedure AnnexByTaxAreaGenerator
	@datasetID int,
	@taxDistrictID int = null,
	@annexationID int = null,
	@year int = null
as

	insert into ##annexations_by_tax_area_report
	select distinct
		@datasetID,
		a.annexation_id,
		a.start_year,
		a.annexation_code,	
		a.annexation_description,
		a.ordinance_number,
		a.effective_date,
		dta.tax_area_number as destination_tax_area,
		dta.tax_area_state as state_tax_area,
		sta.tax_area_number as source_tax_area,
		tdt.tax_district_desc as tax_district_type,
		td.tax_district_desc,
		tdt.priority
	from (
				select distinct annexation_id, 
						tax_area_destination_id,
						tax_area_source_id
				from tax_area_mapping with(nolock)
	) as tam
	join tax_area dta (nolock)
		on dta.tax_area_id = tam.tax_area_destination_id
	join tax_area sta (nolock)
		on sta.tax_area_id = tam.tax_area_source_id
	join annexation a (nolock)
		on a.annexation_id = tam.annexation_id
	join tax_area_fund_assoc tafa (nolock)
		on tafa.year = a.start_year
		and tafa.tax_area_id = tam.tax_area_destination_id 
	join tax_district td (nolock)
		on td.tax_district_id = tafa.tax_district_id
	join tax_district_type tdt (nolock)
		on td.tax_district_type_cd = tdt.tax_district_type_cd
	where (@taxDistrictID is null or a.tax_district_id = @taxDistrictID) and
		(@annexationID is null or a.annexation_id = @annexationID) and
		(@year is null or a.start_year = @year)

GO

