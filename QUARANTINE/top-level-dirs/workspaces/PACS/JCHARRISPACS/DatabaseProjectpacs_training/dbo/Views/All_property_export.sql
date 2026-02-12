create view All_property_export as 


SELECT
	pacs_oltp.dbo.property.prop_id, pacs_oltp.dbo.property.prop_type_cd, pacs_oltp.dbo.property.prop_create_dt, 
	pacs_oltp.dbo.property.geo_id, pacs_oltp.dbo.property_val.map_id, pacs_oltp.dbo.property_val.prop_val_yr, 
	pacs_oltp.dbo.property_val.land_hstd_val, pacs_oltp.dbo.property_val.land_non_hstd_val, 
	pacs_oltp.dbo.property_val.imprv_hstd_val, pacs_oltp.dbo.property_val.imprv_non_hstd_val, pacs_oltp.dbo.property_val.appraised_val, 
	pacs_oltp.dbo.property_val.ag_use_val, pacs_oltp.dbo.property_val.ag_market, pacs_oltp.dbo.property_val.timber_market, 
	pacs_oltp.dbo.property_val.timber_use, pacs_oltp.dbo.property_val.ten_percent_cap, pacs_oltp.dbo.property_val.legal_desc, 
	pacs_oltp.dbo.property_val.legal_acreage,pacs_oltp. dbo.situs.primary_situs, pacs_oltp.dbo.situs.situs_num, 
	pacs_oltp.dbo.situs.situs_street_prefx,pacs_oltp.dbo.situs.situs_street, pacs_oltp.dbo.situs.situs_street_sufix, 
	pacs_oltp.dbo.situs.situs_unit,pacs_oltp.dbo.situs.situs_city,pacs_oltp. dbo.situs.situs_state,pacs_oltp. dbo.situs.situs_zip, 
	pacs_oltp.dbo.situs.situs_display, pacs_oltp.dbo.property.utilities, pacs_oltp.dbo.property.topography,pacs_oltp. dbo.property.road_access, 
	pacs_oltp.dbo.property.other, pacs_oltp.dbo.property.zoning, pacs_oltp.dbo.property.remarks, pacs_oltp.dbo.property_val.last_appraisal_yr, 
	pacs_oltp.dbo.property_val.last_appraisal_dt,pacs_oltp. dbo.property_val.next_appraisal_dt, pacs_oltp.dbo.property_val.next_appraisal_rsn, 
	pacs_oltp.dbo.property_val.image_path, pacs_oltp. dbo.property_val.shared_prop_cad_code, 
	pacs_oltp.dbo.property_val.recalc_flag, pacs_oltp. dbo.property_val.eff_size_acres, 
	pacs_oltp.dbo.property_val.assessed_val,pacs_oltp. dbo.property_val.prop_inactive_dt, pacs_oltp.dbo.property_val.abs_subdv_cd, 
	pacs_oltp.dbo.property_val.hood_cd, pacs_oltp.dbo.property.ref_id1, pacs_oltp.dbo.property.ref_id2, pacs_oltp.dbo.property.prop_sic_cd, 
	pacs_oltp.dbo.appraiser.appraiser_nm AS last_appraiser_nm, pacs_oltp.dbo.property.dba_name, 
	pacs_oltp.dbo.property_val.udi_parent AS udi_parent, 
	pacs_oltp.dbo.property_val.appr_method,
	pacs_oltp.dbo.property_val.udi_parent_prop_id,
	xcoord,ycoord
FROM pacs_oltp.dbo.neighborhood with (nolock)
RIGHT OUTER JOIN	
	pacs_oltp.dbo.property with (nolock)
	INNER JOIN pacs_oltp.dbo.prop_supp_assoc with (nolock)
		ON pacs_oltp.dbo.property.prop_id = pacs_oltp.dbo.prop_supp_assoc.prop_id 
	INNER JOIN pacs_oltp.dbo.property_val with (nolock)
		ON pacs_oltp.dbo.prop_supp_assoc.prop_id = pacs_oltp.dbo.property_val.prop_id 
		AND pacs_oltp.dbo.prop_supp_assoc.owner_tax_yr = pacs_oltp.dbo.property_val.prop_val_yr 
		AND pacs_oltp.dbo.prop_supp_assoc.sup_num = pacs_oltp.dbo.property_val.sup_num 
	LEFT OUTER JOIN pacs_oltp.dbo.appraiser with (nolock)
		ON pacs_oltp.dbo.property_val.last_appraiser_id = pacs_oltp.dbo.appraiser.appraiser_id 
	LEFT OUTER JOIN pacs_oltp.dbo.situs with (nolock)
		ON pacs_oltp. dbo.property.prop_id = pacs_oltp.dbo.situs.prop_id 
		AND pacs_oltp.dbo.situs.primary_situs = 'Y' 
	LEFT OUTER JOIN pacs_oltp.dbo.abs_subdv with (nolock)
		ON pacs_oltp.dbo.property_val.abs_subdv_cd =pacs_oltp.dbo.abs_subdv.abs_subdv_cd 
		AND pacs_oltp.dbo.property_val.prop_val_yr = pacs_oltp.dbo.abs_subdv.abs_subdv_yr 
	ON pacs_oltp.dbo.neighborhood.hood_cd = pacs_oltp.dbo.property_val.hood_cd 
	AND pacs_oltp.dbo.neighborhood.hood_yr = pacs_oltp.dbo.property_val.prop_val_yr
	left join 
(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [Shape_Area] DESC) 
AS order_id,
[Prop_ID],
[Geometry].STCentroid().STX as XCoord,
[Geometry].STCentroid().STY as YCoord 

FROM 
[Benton_spatial_data].[dbo].[Parcel]
) as coords
 
ON 

pacs_oltp.dbo.property.prop_id = coords.Prop_ID AND coords.order_id = 1

WHERE 

pacs_oltp.dbo.property_val.prop_val_yr =

(select appr_yr 
from pacs_oltp.dbo.pacs_system)  

--AND XCoord IS NOT NULL 

and prop_inactive_dt is null
--and prop_type_cd = 'r'

GO

