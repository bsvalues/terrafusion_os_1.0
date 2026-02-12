




CREATE VIEW [dbo].[sales_export_vw]
as
SELECT DISTINCT
    isnull(isnull(rtrim(entity.entity_cd), (select entity.entity_cd from entity with (nolock) where entity.entity_id = property_profile.school_id)), '') as isd_cd,
    isnull(rtrim(chg_of_owner_prop_assoc.prop_id), '') as prop_id,
    isnull(isnull(rtrim(sale.sl_state_cd), property_profile.state_cd), '') as sl_state_cd,
    isnull(rtrim(sale.sl_type_cd), '') as sl_type_cd,
    isnull(rtrim(sale.sl_price), '') as sl_price,
    isnull(isnull(rtrim(sale.sl_living_area), property_profile.living_area), '') as sl_sqft,
    isnull(isnull(rtrim(sale.sl_land_acres), property_profile.land_acres), '') as sl_land_acres,
    isnull(isnull(rtrim(DATEPART(year, GETDATE()) - case when sale.sl_yr_blt > 0 then sale.sl_yr_blt else NULL end), DATEPART(year, GETDATE()) - case when property_profile.yr_blt > 0 then property_profile.yr_blt else NULL end), '') as blg_age,
    convert(char(5), case when property_profile.condition_cd is not null then property_profile.condition_cd else 'A' end) as blg_condition,
    isnull(isnull(rtrim(sale.sl_class_cd), property_profile.class_cd), '') as sl_class_cd,
    case when (convert(varchar(10), sale.sl_dt, 101)) is null then '' else (convert(varchar(10), sale.sl_dt, 101)) end as sl_dt,
    case when (convert(varchar(10), chg_of_owner.deed_dt, 101)) is null then '' else (convert(varchar(10), chg_of_owner.deed_dt, 101)) end as deed_dt,
    isnull(rtrim(chg_of_owner.deed_num), '') as deed_num,
    isnull(rtrim(chg_of_owner.deed_book_id), '') as deed_book_id,
    isnull(rtrim(chg_of_owner.deed_book_page), '') as deed_book_page,
    isnull(rtrim(chg_of_owner.deed_type_cd), '') as deed_type_cd,
    isnull(rtrim(psseggv.grantee_file_as_name), '') as grantee, 
    isnull(rtrim(psseggv.grantee_addr_line1), '') as grantee_addr_line_1, 
    isnull(rtrim(psseggv.grantee_addr_line2), '') as grantee_addr_line_2, 
    isnull(rtrim(psseggv.grantee_addr_line3), '') as grantee_addr_line_3, 
    isnull(rtrim(psseggv.grantee_addr_city), '') as grantee_addr_city, 
    isnull(rtrim(psseggv.grantee_addr_state), '') as grantee_addr_state, 
    isnull(rtrim(psseggv.grantee_addr_zip), '') as grantee_addr_zip, 
    isnull(rtrim(psseggv.grantee_country_cd), '') as grantee_addr_country,
    isnull(rtrim(psseggv.grantor_file_as_name), '') as grantor, 
    isnull(rtrim(psseggv.grantor_addr_line1), '') as grantor_addr_line_1, 
    isnull(rtrim(psseggv.grantor_addr_line2), '') as grantor_addr_line_2, 
    isnull(rtrim(psseggv.grantor_addr_line3), '') as grantor_addr_line_3, 
    isnull(rtrim(psseggv.grantor_addr_city), '') as grantor_addr_city, 
    isnull(rtrim(psseggv.grantor_addr_state), '') as grantor_addr_state, 
    isnull(rtrim(psseggv.grantor_addr_zip), '') as grantor_addr_zip, 
    isnull(rtrim(psseggv.grantor_country_cd), '') as grantor_addr_country,
    RTRIM(REPLACE(isnull(situs.situs_display, ''), CHAR(13) + CHAR(10), ' ')) as situs,
    isnull(rtrim(isnull(sale.finance_comment, '') + isnull(sale.sl_comment, '')), '') as comments,
    isnull(rtrim(property_val.legal_desc), '') as legal_desc,
    isnull(isnull(rtrim(property_val.abs_subdv_cd), property_profile.abs_subdv), '') as abs_subdv_cd,
    isnull(isnull(rtrim(property_val.map_id), property_profile.map_id), '') as map_id,
    rtrim(cast(property_val.imprv_hstd_val + property_val.imprv_non_hstd_val as varchar(50))) as imprv_market_val,
    rtrim(cast(property_val.land_hstd_val + property_val.land_non_hstd_val + property_val.ag_market + property_val.timber_market as varchar(50))) as land_market_val,
    rtrim(cast(property_val.land_hstd_val + property_val.land_non_hstd_val + property_val.ag_market + property_val.timber_market + property_val.imprv_hstd_val + property_val.imprv_non_hstd_val as varchar(50))) as market_val,
    isnull(rtrim(semv.partial_complete), 'F') as partial_complete,
    'F' as arb_set_value
FROM ptd_sale_submission_export_grantor_grantee_vw psseggv with (nolock)
INNER JOIN chg_of_owner with (nolock)
	ON psseggv.chg_of_owner_id = chg_of_owner.chg_of_owner_id
INNER JOIN chg_of_owner_prop_assoc with (nolock)
	ON chg_of_owner.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
INNER JOIN pacs_system with (nolock)
	ON pacs_system.id = 1
INNER JOIN prop_supp_assoc with (nolock)
	ON prop_supp_assoc.prop_id = chg_of_owner_prop_assoc.prop_id
		AND prop_supp_assoc.owner_tax_yr = pacs_system.appr_yr
INNER JOIN property_val with (nolock)
	ON property_val.prop_id = prop_supp_assoc.prop_id
		AND property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
		AND property_val.sup_num = prop_supp_assoc.sup_num
		AND property_val.prop_inactive_dt is null
INNER JOIN property_profile with (nolock)
	ON property_val.prop_id = property_profile.prop_id
		AND property_val.prop_val_yr = property_profile.prop_val_yr
LEFT OUTER JOIN sale with (nolock)
	ON chg_of_owner.chg_of_owner_id = sale.chg_of_owner_id
LEFT OUTER JOIN entity with (nolock)
	ON entity.entity_id = sale.sl_school_id
LEFT OUTER JOIN situs with (nolock)
	ON chg_of_owner_prop_assoc.prop_id = situs.prop_id
		AND situs.primary_situs = 'Y'
LEFT OUTER JOIN sales_export_misc_vw semv with (nolock)
	ON prop_supp_assoc.prop_id = semv.prop_id
		AND prop_supp_assoc.sup_num = semv.sup_num
		--AND (prop_supp_assoc.owner_tax_yr - 1) = semv.owner_tax_yr

GO

