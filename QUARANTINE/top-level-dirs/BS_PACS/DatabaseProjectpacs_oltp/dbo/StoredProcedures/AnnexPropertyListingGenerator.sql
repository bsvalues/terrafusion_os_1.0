
create procedure AnnexPropertyListingGenerator
	@datasetID int,
	@taxDistrictID int = null,
	@annexationID int = null,
	@year int = null
as

	insert into ##annexation_property_listing_report
	(
		[dataset_id],
		[prop_id],
		[year],
		[tax_district_desc],
		[annexation_code],
		[annexation_description],
		[land_value],
		[improvement_value],
		[current_use_value],
		[prior_tax_area],
		[new_tax_area]
	)
	select distinct
		@datasetID,
		apa.prop_id,
		a.start_year,
		td.tax_district_desc,
		a.annexation_code,
		a.annexation_description,
		wpov.land_hstd_val + wpov.land_non_hstd_val as land_value,
		case when p.prop_type_cd in ('P', 'MN') or state_assessed > 0
			then wpov.appraised_classified + wpov.appraised_non_classified
			else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
		end as improvement_value,
		wpov.ag_use_val + wpov.ag_hs_use_val as current_use_value,
		ta.tax_area_number as prior_tax_area,
		tta.tax_area_number as new_tax_area
	from  annexation a (nolock)
	inner join annexation_property_assoc apa (nolock) on 
		a.annexation_id = apa.annexation_id
	inner join property p (nolock) on 
		apa.prop_id = p.prop_id
	inner join prop_supp_assoc psa (nolock) on 
		apa.prop_id = psa.prop_id and 
		a.start_year = psa.owner_tax_yr
	inner join property_tax_area pta (nolock) on 
		psa.prop_id = pta.prop_id and 
		pta.year = a.start_year and 
		psa.sup_num = psa.sup_num
	inner join wash_prop_owner_val wpov (nolock) on 
		wpov.prop_id = apa.prop_id and 
		wpov.year = psa.owner_tax_yr and 
		wpov.sup_num = psa.sup_num
	inner join tax_area_mapping tam (nolock) on 
		a.annexation_id = tam.annexation_id and 
		pta.tax_area_id = tam.tax_area_destination_id and
		apa.tax_area_source_id = tam.tax_area_source_id
	inner join tax_area ta (nolock) on 
		tam.tax_area_source_id = ta.tax_area_id
	inner join tax_area tta (nolock) on 
		tta.tax_area_id = tam.tax_area_destination_id
	inner join tax_district td (nolock) on
		td.tax_district_id = a.tax_district_id
	where (@taxDistrictID is null or a.tax_district_id = @taxDistrictID) and
		(@annexationID is null or a.annexation_id = @annexationID) and
		(@year is null or a.start_year = @year)

GO

