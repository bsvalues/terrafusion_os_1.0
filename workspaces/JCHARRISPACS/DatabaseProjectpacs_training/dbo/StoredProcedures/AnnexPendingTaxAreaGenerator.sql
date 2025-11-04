
create procedure AnnexPendingTaxAreaGenerator
	@datasetID int,
	@taxDistrictID int = null,
	@annexationID int = null,
	@year int = null,
	@pendingTaxAreaNum varchar(23) = null
as

	insert into ##annexation_pending_tax_area_report
	select distinct
		@datasetID,
		pta.year,
		tta.tax_area_number as prior_tax_area,
		ta.tax_area_number as pending_tax_area,
		annexation_code,
		annexation_description,
		td.tax_district_desc,	
		a.effective_date,
		isnull(sf.levy_cd, 'NONE') as source_levy,
		isnull(sf.display_fund_number, 'NONE') as source_fund,
		isnull(sf.fund_description, 'NONE') as source_fund_description,
		isnull(df.display_fund_number, 'NONE') as destination_fund,
		isnull(df.fund_description,'NONE') as dest_fund_description
	from property_tax_area pta (nolock)
	join tax_area ta (nolock)
		on ta.tax_area_id = pta.tax_area_id_pending
	join tax_area tta (nolock)
		on tta.tax_area_id = pta.tax_area_id
	join annexation_property_assoc apa (nolock)
		on apa.prop_id = pta.prop_id
		and apa.year = pta.year
		and pta.tax_area_id = apa.tax_area_source_id
	join prop_supp_assoc psa (nolock)
		on pta.prop_id = psa.prop_id
		and pta.year = psa.owner_tax_yr
		and pta.sup_num = psa.sup_num
	join annexation a (nolock)
		on a.annexation_id = apa.annexation_id
	join tax_district td (nolock)
		on td.tax_district_id = a.tax_district_id
	left join tax_area_mapping tam(nolock)
		on a.annexation_id = tam.annexation_id
		and tam.tax_area_destination_id = pta.tax_area_id_pending
	left outer join fund sf (nolock)
		on sf.fund_id = tam.tax_area_fund_source_id
		and sf.year = pta.year
	left outer join fund df (nolock)
		on df.fund_id = tam.tax_area_fund_destination_id
		and df.year = sf.year
	where (@taxDistrictID is null or a.tax_district_id = @taxDistrictID) and
		(@annexationID is null or a.annexation_id = @annexationID) and
		(@year is null or pta.year = @year) and
		(@pendingTaxAreaNum is null or ta.tax_area_number = @pendingTaxAreaNum)

GO

