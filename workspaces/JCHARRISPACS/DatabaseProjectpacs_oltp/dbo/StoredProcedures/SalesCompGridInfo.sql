


CREATE PROCEDURE SalesCompGridInfo

@input_sp	varchar(5),
@input_user_id 	int,
@input_prop_id	int,
@input_year	numeric(4,0)

AS

--@input_sp is 'NS' for 'Non-Subject', 'S' for 'Subject'
if (@input_sp = 'NS')
begin
	select 1 as DumbID,
		scp.prop_id,
		scp.year,
		scp.geo_id,
		scp.owner,
		scp.situs,
		scp.school,
		scp.city,
		scp.state_cd,
		scp.region,
		scp.abs_subdv,
		scp.hood,
		scp.subset,
		scp.map_id,
		scp.imprv_class,
		scp.living_area,
		scp.year_built,
		scp.imprv_up,
		scp.imprv_val,
		scp.imprv_add_val,
		scp.land_type,
		scp.land_size,
		scp.land_up,
		scp.land_val,
		scp.land_val_per_area,
		scp.land_sale_val_per_area,
		scp.appraised_val,
		scp.appraised_val_per_sqft,
		scp.sale_type,
		scp.sale_date,
		scp.sale_price,
		scp.sale_price_per_sqft,
		scp.sale_ratio,
		scp.score,
		pv.image_path
	from sales_comp_print as scp, property_val as pv, prop_supp_assoc as psa
	where scp.pacs_user_id = @input_user_id
	and scp.prop_id = psa.prop_id
	and scp.year = psa.owner_tax_yr
	and psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
	and scp.print_flag = 'T'
	order by scp.sequence_num
end
else if (@input_sp = 'S')
begin
	select 
		1 as DumbID,
		property_profile.prop_id,
		property_profile.prop_val_yr as year,
		property.geo_id,
		cast(account.file_as_name as varchar(50)) as owner,
		REPLACE(isnull(situs.situs_display, ''), CHAR(13) + CHAR(10), ' ') as situs,
		school_entity.entity_cd as school,
		city_entity.entity_cd as city,
		property_profile.state_cd,
		property_profile.region,
		property_profile.abs_subdv,
		property_profile.neighborhood as hood,
		property_profile.subset,
		property_profile.map_id,
		property_profile.class_cd as imprv_class,
		property_profile.living_area,
		property_profile.yr_blt as year_built,
		property_profile.imprv_unit_price as imprv_up,
		cast(case when (isnull(property_val.imprv_hstd_val, 0) + isnull(property_val.imprv_non_hstd_val, 0)) > 0 
			then (isnull(property_val.imprv_hstd_val, 0) + isnull(property_val.imprv_non_hstd_val, 0)) 
			else 0 end as varchar(50)) as imprv_val,
		property_profile.imprv_add_val,
		property_profile.land_type_cd as land_type,
		case when isnull(property_profile.land_sqft, 0) > 0 
			then cast(property_profile.land_sqft as varchar(50)) 
			when isnull(property_profile.land_acres, 0) > 0 
			then cast(property_profile.land_acres as varchar(50)) 
			when isnull(property_profile.land_front_feet, 0) > 0 
			then cast(property_profile.land_front_feet as varchar(50)) 
			when isnull(property_profile.land_lot, 'F') = 'T' 
			then 'LOT' else cast(0 as varchar(50)) end as land_size,
		property_profile.land_unit_price as land_up,
		cast(case when (isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + isnull(property_val.ag_use_val, 0) + isnull(property_val.ag_market, 0) + isnull(property_val.timber_use, 0) + isnull(property_val.timber_market, 0)) > 0 
			then (isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + isnull(property_val.ag_use_val, 0) + isnull(property_val.ag_market, 0) + isnull(property_val.timber_use, 0) + isnull(property_val.timber_market, 0)) 
			else 0 end as varchar(50)) as land_val,
		cast(case when isnull(property_profile.land_sqft, 0) > 0 
			then (isnull(property_profile.appraised_val, 0) / property_profile.land_sqft) 
			when isnull(property_profile.land_acres, 0) > 0 
			then (isnull(property_profile.appraised_val, 0) / property_profile.land_acres) 
			when isnull(property_profile.land_front_feet, 0) > 0 
			then (isnull(property_profile.appraised_val, 0) / property_profile.land_front_feet) 
			else isnull(property_profile.appraised_val, 0) end as numeric(14,2)) as land_val_per_area,
        	cast(isnull(sale.sl_price, 0) / (case when isnull(property_profile.land_sqft, 0) > 0 
													then cast(property_profile.land_sqft as numeric(12,4)) 
													when isnull(property_profile.land_acres, 0) > 0 
													then cast(property_profile.land_acres as numeric(12,4)) 
													when isnull(property_profile.land_front_feet, 0) > 0 
													then cast(property_profile.land_front_feet as numeric(14,2)) 
													else cast(1 as int) end) as numeric(14,2)) as land_sale_val_per_area,
		property_profile.appraised_val,
		cast(isnull(property_profile.appraised_val, 0) / case when cast(property_profile.living_area as numeric(14,2)) > 0 
																then property_profile.living_area 
																else cast(1 as int) end as numeric(14,2)) as appraised_val_per_sqft,
		null as sale_type,
		null as sale_date,
		property_profile.appraised_val as sale_price,
		cast(isnull(property_profile.appraised_val, 0) / case when cast(property_profile.living_area as numeric(14,2)) > 0 
															then property_profile.living_area 
															else cast(1 as int) end as varchar(50)) as sale_price_per_sqft,
		null as sale_ratio,
		null as score,
	        property_val.image_path
	FROM sale INNER JOIN
	    chg_of_owner_prop_assoc ON 
	    sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id AND
	    chg_of_owner_prop_assoc.seq_num = 0 RIGHT OUTER JOIN
	    property_profile INNER JOIN
	    prop_supp_assoc INNER JOIN
	    property_val ON 
	    prop_supp_assoc.prop_id = property_val.prop_id AND 
	    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
	    prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
	    property ON prop_supp_assoc.prop_id = property.prop_id ON 
	    property_profile.prop_id = prop_supp_assoc.prop_id AND 
	    property_profile.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
	    property_profile.sup_num = prop_supp_assoc.sup_num INNER JOIN
	    account INNER JOIN
	    owner ON account.acct_id = owner.owner_id ON 
	    property_val.prop_id = owner.prop_id AND 
	    property_val.prop_val_yr = owner.owner_tax_yr AND 
	    property_val.sup_num = owner.sup_num ON 
	    chg_of_owner_prop_assoc.prop_id = property.prop_id LEFT OUTER JOIN
	    situs ON property.prop_id = situs.prop_id AND
	    situs.primary_situs = 'Y' LEFT OUTER JOIN
	    entity city_entity ON 
	    property_profile.city_id = city_entity.entity_id LEFT OUTER JOIN
	    entity school_entity ON 
	    property_profile.school_id = school_entity.entity_id
	WHERE property_profile.prop_id 	 = @input_prop_id
	and property_profile.prop_val_yr = @input_year
end

GO

