
 create view [dbo].[ag_land_detail]
 as   
SELECT distinct
 land_detail.prop_id,

SUM(size_acres) as size_acres,

MIN(CASE WHEN land_soil_code like'range' THEN land_soil_code END) as 'Range_land',
	MIN(CASE WHEN land_soil_code like'range' THEN size_acres END) as 'Range_land_acres',

MIN(CASE WHEN land_soil_code like 'DRAG%' THEN land_soil_code END) as 'Dry_agland',
	MIN(CASE WHEN land_soil_code like 'DRAG%'THEN size_acres END) as 'Dry_agland_acres',

MIN(CASE WHEN land_soil_code like 'BMIA%' THEN land_soil_code END) as 'Badger_Irr',
	MIN(CASE WHEN land_soil_code like 'BMIA%' THEN size_acres END) as 'Badger_Irr_acres',

MIN(CASE WHEN land_soil_code like 'CRIA%' THEN land_soil_code END) as 'Columbia_river',
	MIN(CASE WHEN land_soil_code like 'CRIA%'THEN size_acres END) as 'Columbia_river_acres',

MIN(CASE WHEN land_soil_code like 'IRAG%' THEN land_soil_code END) as 'Irrigated_agland',

	MIN(CASE WHEN land_soil_code like 'IRAG%'THEN size_acres END) as 'Irrigated_agland_acres',

MIN(CASE WHEN land_soil_code like 'DRPA%' THEN land_soil_code END) as 'Dry_Pasture',
	MIN(CASE WHEN land_soil_code like 'DRPA%'THEN size_acres END) as 'Dry_Pasture_acres',

MIN(CASE WHEN land_soil_code like 'RHS%' THEN land_soil_code END) as 'Rural_Homesite',
	MIN(CASE WHEN land_soil_code like 'RHS%'THEN size_acres END) as 'Rural_Homesite_acres',

MIN(CASE WHEN land_soil_code like 'BMDRP%' THEN land_soil_code END) as 'BMDRP',
	MIN(CASE WHEN land_soil_code like 'BMDRP%'THEN size_acres END) as 'BMDRP_acres',

MIN(CASE WHEN land_soil_code like 'WCIA1%' THEN land_soil_code END) as 'Well_circle',
	MIN(CASE WHEN land_soil_code like 'WCIA1%' THEN size_acres END) as 'Well_circle_acres',

MIN(CASE WHEN land_soil_code like 'RMIA1%' THEN land_soil_code END) as 'Red_Mountain',
	MIN(CASE WHEN land_soil_code like 'RMIA1%'THEN size_acres END) as 'Res_Mountain_acres',

MIN(CASE WHEN land_soil_code like 'WASTE%' THEN land_soil_code END) as 'Waste',
	MIN(CASE WHEN land_soil_code like 'WASTE%' THEN size_acres END) as 'Waste_acres',

MIN(CASE WHEN land_soil_code like 'SITE%' THEN land_soil_code END) as 'AG1SITE',
	MIN(CASE WHEN land_soil_code like 'SITE%' THEN size_acres END) as 'AG1SITE_acres',

MIN(CASE WHEN land_soil_code like 'SITC%' THEN land_soil_code END) as 'Columbia_river_AG1_Site',
	MIN(CASE WHEN land_soil_code like 'SITC%' THEN size_acres END) as 'Columbia_river_AG1_Site_acres',

MIN(CASE WHEN land_soil_code like 'FROS%' THEN land_soil_code END) as 'FROS',
	MIN(CASE WHEN land_soil_code like 'FROS%' THEN size_acres END) as 'FROS_acres',

MIN(CASE WHEN land_soil_code like 'OSOS%' THEN land_soil_code END) as 'OpenSpace_OpenSpace',
	MIN(CASE WHEN land_soil_code like 'OSOS%' THEN size_acres END) as 'OpenSpace_OpenSpace_acres',

MIN(CASE WHEN land_soil_code like 'DRPNV%' THEN land_soil_code END) as 'Dry_Pasture_Norm',

	min(CASE WHEN land_soil_code like 'DRPNV%'THEN size_acres END) as 'Dry_Pasture_Norm_acres',

MIN(CASE WHEN land_soil_code like 'BASE%' THEN land_soil_code END) as 'BASE',

	min(CASE WHEN land_soil_code like 'BASE%'THEN size_acres END) as 'BASE_acres'




 --imprv_detail.imprv_id, imprv_detail.imprv_det_id, imprv_detail.imprv_det_meth_cd, imprv_detail.imprv_det_type_cd, imprv_detail.imprv_det_area, imprv_detail.imprv_det_area_type, imprv_detail.imprv_det_desc


FROM            land_detail 

LEFT OUTER JOIN imprv_detail ON land_detail.prop_id = imprv_detail.prop_id
	 where 
						 land_detail.prop_val_yr=2019
						 --and imprv_det_type_cd like 'V%'
						and  land_detail.sale_id=0

						--and 
									
						--land_detail.prop_id=10007


group by  land_detail.prop_id
--imprv_detail.prop_id, imprv_detail.imprv_id, imprv_detail.imprv_det_id, imprv_detail.imprv_det_meth_cd, imprv_detail.imprv_det_type_cd, imprv_detail.imprv_det_area, imprv_detail.imprv_det_area_type, imprv_detail.imprv_det_desc

GO

