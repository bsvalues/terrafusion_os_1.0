create view ag_permc_land
as

SELECT        _ag_land_detail_vw.prop_id AS ag_prop_id, _ag_land_detail_vw.size_acres, _ag_land_detail_vw.Range_land, _ag_land_detail_vw.Range_land_acres, _ag_land_detail_vw.Dry_agland, 
                         _ag_land_detail_vw.Dry_agland_acres, _ag_land_detail_vw.Badger_Irr, _ag_land_detail_vw.Badger_Irr_acres, _ag_land_detail_vw.Columbia_river, _ag_land_detail_vw.Columbia_river_acres, 
                         _ag_land_detail_vw.Irrigated_agland, _ag_land_detail_vw.Irrigated_agland_acres, _ag_land_detail_vw.Dry_Pasture, _ag_land_detail_vw.Dry_Pasture_acres, _ag_land_detail_vw.Rural_Homesite, 
                         _ag_land_detail_vw.Rural_Homesite_acres, _ag_land_detail_vw.BMDRP, _ag_land_detail_vw.BMDRP_acres, _ag_land_detail_vw.Well_circle, _ag_land_detail_vw.Well_circle_acres, 
                         _ag_land_detail_vw.Red_Mountain, _ag_land_detail_vw.Res_Mountain_acres, _ag_land_detail_vw.Waste, _ag_land_detail_vw.Waste_acres, _ag_land_detail_vw.AG1SITE, _ag_land_detail_vw.AG1SITE_acres, 
                         _ag_land_detail_vw.Columbia_river_AG1_Site, _ag_land_detail_vw.Columbia_river_AG1_Site_acres, _ag_land_detail_vw.FROS, _ag_land_detail_vw.FROS_acres, _ag_land_detail_vw.OpenSpace_OpenSpace, 
                         _ag_land_detail_vw.OpenSpace_OpenSpace_acres, _ag_land_detail_vw.Dry_Pasture_Norm, _ag_land_detail_vw.Dry_Pasture_Norm_acres, _ag_land_detail_vw.BASE, _ag_land_detail_vw.BASE_acres, 
                         __perm_crop_acres.*
FROM            _ag_land_detail_vw LEFT OUTER JOIN
                         __perm_crop_acres ON _ag_land_detail_vw.prop_id = __perm_crop_acres.prop_id
						-- where 						-- [V26-Zinfan 	( permanent_crop_acres  )]is not null or [V17-Syrah 	( permanent_crop_acres  )]is not null

GO

