

CREATE PROCEDURE SalesCompSubjectGridInfo

@input_prop_id  int,
@input_year	numeric(4,0)

AS

select 
	1 as DumbID,
	property_profile.prop_id,
	property_profile.prop_val_yr,
	property.geo_id,
	REPLACE(isnull(situs.situs_display, ''), CHAR(13) + CHAR(10), ' ') as situs,
	cast(account.file_as_name as varchar(50)) as owner,
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
	cast(case when (isnull(property_val.imprv_hstd_val, 0) + isnull(property_val.imprv_non_hstd_val, 0)) > 0 then (isnull(property_val.imprv_hstd_val, 0) + isnull(property_val.imprv_non_hstd_val, 0)) else 0 end as varchar(50)) as imprv_val,
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
	cast(case when (isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + isnull(property_val.ag_use_val, 0) + isnull(property_val.ag_market, 0) + isnull(property_val.timber_use, 0) + isnull(property_val.timber_market, 0)) > 0 then (isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + isnull(property_val.ag_use_val, 0) + isnull(property_val.ag_market, 0) + isnull(property_val.timber_use, 0) + isnull(property_val.timber_market, 0)) else 0 end as varchar(50)) as land_val,
	property_profile.appraised_val,
	sale.sl_type_cd as sale_type,
	convert(varchar(50), sale.sl_dt, 101) as sale_date,
	sale.sl_price as sale_price,
	cast(case when isnull(sale.adjusted_sl_price, 0) > 0 then (isnull(property_profile.appraised_val, 0) / isnull(sale.adjusted_sl_price, 0)) end as numeric(12,4)) as sale_ratio,
        property_val.image_path
FROM sale INNER JOIN
    chg_of_owner_prop_assoc ON 
    sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
    AND chg_of_owner_prop_assoc.seq_num = 0
     RIGHT OUTER JOIN
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
    chg_of_owner_prop_assoc.prop_id = property.prop_id LEFT OUTER
     JOIN
    situs ON property.prop_id = situs.prop_id 
    AND situs.primary_situs = 'Y' LEFT OUTER JOIN
    entity city_entity ON 
    property_profile.city_id = city_entity.entity_id LEFT OUTER JOIN
    entity school_entity ON 
    property_profile.school_id = school_entity.entity_id
WHERE property_profile.prop_id = @input_prop_id
and property_profile.prop_val_yr = @input_year

GO

