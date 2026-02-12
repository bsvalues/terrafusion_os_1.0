
create procedure RecalcUpdatePropertyProfile
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_property_profile
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 0,
			tablock
		)
	'
	exec(@szSQL)
	set @lBCPRowCount = @@rowcount

	/* Update all rows at once if requested */
	if ( @lRowsPerUpdate = 0 )
	begin
		set @lRowsPerUpdate = @lBCPRowCount
	end

	declare @lMinBCPRowID int
	declare @lMaxBCPRowID int

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lBCPRowCount > 0 )
	begin
		update property_profile
		set
			property_profile.sup_num = tpp.sup_num,
			property_profile.school_id = isnull(tpp.school_id, 0),
			property_profile.city_id = isnull(tpp.city_id, 0),
			property_profile.state_cd = tpp.state_cd,
			property_profile.yr_blt = isnull(tpp.yr_blt, 0),
			property_profile.living_area = isnull(tpp.living_area, 0),
			property_profile.imprv_unit_price = isnull(tpp.imprv_unit_price, 0),
			property_profile.imprv_add_val = isnull(tpp.imprv_add_val, 0),
			property_profile.class_cd = tpp.class_cd,
			property_profile.land_acres = isnull(tpp.land_acres, 0),
			property_profile.land_sqft = isnull(tpp.land_sqft, 0),
			property_profile.land_front_feet = isnull(tpp.land_front_feet, 0),
			property_profile.land_depth = isnull(tpp.land_depth, 0),
			property_profile.land_unit_price = isnull(tpp.land_unit_price, 0),
			property_profile.land_lot = tpp.land_lot,
			property_profile.land_type_cd = tpp.land_type_cd,

			property_profile.region = tpp.region,
			property_profile.abs_subdv = tpp.abs_subdv,
			property_profile.neighborhood = tpp.neighborhood,
			property_profile.subset = tpp.subset,
			property_profile.map_id = tpp.map_id,
			property_profile.appraised_val = isnull(tpp.appraised_val, 0),

			property_profile.land_appr_method = isnull(tpp.land_appr_method, ''),
			property_profile.land_num_lots = isnull(tpp.land_num_lots, 0),
			property_profile.land_total_sqft = isnull(tpp.land_total_sqft, 0),
			property_profile.eff_yr_blt = isnull(tpp.eff_yr_blt, 0),
			property_profile.condition_cd = tpp.condition_cd,
			property_profile.percent_complete = tpp.percent_complete,
			property_profile.ls_table = tpp.ls_table,
			property_profile.main_land_unit_price = tpp.main_land_unit_price,
			property_profile.main_land_total_adj = tpp.main_land_total_adj,
			property_profile.size_adj_pct = tpp.size_adj_pct,
			property_profile.heat_ac_code = tpp.heat_ac_code,
			property_profile.land_total_acres = tpp.land_total_acres,

			property_profile.zoning = tpp.zoning,
			property_profile.visibility_access_cd = tpp.visibility_access_cd,
			property_profile.sub_market_cd = tpp.sub_market_cd,
			property_profile.road_access = tpp.road_access,
			property_profile.land_useable_acres = tpp.land_useable_acres,
			property_profile.land_useable_sqft = tpp.land_useable_sqft,
			property_profile.property_use_cd = tpp.property_use_cd,
			property_profile.last_appraisal_dt = tpp.last_appraisal_dt,
			property_profile.utilities = tpp.utilities,
			property_profile.topography = tpp.topography,
			property_profile.num_imprv = tpp.num_imprv,
			property_profile.imprv_type_cd = tpp.imprv_type_cd,
			property_profile.imprv_det_sub_class_cd = tpp.imprv_det_sub_class_cd,

			property_profile.class_cd_highvalueimprov = tpp.class_cd_highvalueimprov,
			property_profile.imprv_det_sub_class_cd_highvalueimprov = tpp.imprv_det_sub_class_cd_highvalueimprov,
			property_profile.living_area_highvalueimprov = isnull(tpp.living_area_highvalueimprov, 0),
			property_profile.actual_year_built = tpp.actual_year_built,
			property_profile.characteristic_zoning1 = tpp.characteristic_zoning1,
			property_profile.characteristic_zoning2 = tpp.characteristic_zoning2,
			property_profile.characteristic_view = tpp.characteristic_view,
			property_profile.actual_age = tpp.actual_age,
			property_profile.mbl_hm_make = mhi.mbl_hm_make,
			property_profile.mbl_hm_model = mhi.mbl_hm_model,
			property_profile.mbl_hm_sn = mhi.mbl_hm_sn,
			property_profile.mbl_hm_hud_num = mhi.mbl_hm_hud_num,
			property_profile.mbl_hm_title_num = mhi.mbl_hm_title_num,
			property_profile.imprv_det_meth_cd_highvalueimprov = tpp.imprv_det_meth_cd_highvalueimprov,
			property_profile.imprv_building_name_highvalueimprov = hvi.building_name,
			property_profile.imprv_det_lease_class_highvalueimprov = hvid.lease_class

		from property_profile
		join #recalc_bcp_property_profile as tpp with(nolock) on
			property_profile.prop_id = tpp.prop_id and
			property_profile.prop_val_yr = tpp.prop_val_yr and
			tpp.lRecalcBCPRowID >= @lMinBCPRowID and tpp.lRecalcBCPRowID <= @lMaxBCPRowID
		left outer join imprv as mhi with(nolock) on
			mhi.prop_val_yr = tpp.prop_val_yr and
			mhi.sup_num = tpp.sup_num and
			mhi.sale_id = 0 and
			mhi.prop_id = tpp.prop_id and
			mhi.imprv_id = tpp.imprv_id_highvaluemobilehome
		left outer join imprv as hvi with(nolock) on
			hvi.prop_val_yr = tpp.prop_val_yr and
			hvi.sup_num = tpp.sup_num and
			hvi.sale_id = 0 and
			hvi.prop_id = tpp.prop_id and
			hvi.imprv_id = tpp.imprv_id_highvalue
		left outer join imprv_detail as hvid with(nolock) on
			hvid.prop_val_yr = tpp.prop_val_yr and
			hvid.sup_num = tpp.sup_num and
			hvid.sale_id = 0 and
			hvid.prop_id = tpp.prop_id and
			hvid.imprv_id = tpp.imprv_id_highvalue and
			hvid.imprv_det_id = tpp.imprv_det_id_highvalue

		/* Not all property layers will have a property_profile row, so add those that do not */
		insert property_profile (
			prop_id, prop_val_yr, sup_num,
			school_id, city_id, state_cd,
			yr_blt, living_area,
			imprv_unit_price, imprv_add_val, class_cd,
			land_acres, land_sqft, land_front_feet, land_depth, land_unit_price, land_lot, land_type_cd,
			region, abs_subdv, neighborhood, subset, map_id, appraised_val,
			land_appr_method, land_num_lots, land_total_sqft,
			eff_yr_blt, condition_cd, percent_complete,
			ls_table, main_land_unit_price, main_land_total_adj, size_adj_pct, heat_ac_code, land_total_acres,
			zoning, visibility_access_cd, sub_market_cd, road_access,
			land_useable_acres, land_useable_sqft,
			property_use_cd, last_appraisal_dt, utilities, topography, num_imprv, imprv_type_cd, imprv_det_sub_class_cd,
			class_cd_highvalueimprov, imprv_det_sub_class_cd_highvalueimprov, living_area_highvalueimprov, actual_year_built,
			characteristic_zoning1, characteristic_zoning2, characteristic_view, actual_age,
			mbl_hm_make, mbl_hm_model, mbl_hm_sn, mbl_hm_hud_num, mbl_hm_title_num,
			imprv_det_meth_cd_highvalueimprov, imprv_building_name_highvalueimprov, imprv_det_lease_class_highvalueimprov
		)
		select
			tpp.prop_id, tpp.prop_val_yr, tpp.sup_num,
			isnull(tpp.school_id, 0), isnull(tpp.city_id, 0), tpp.state_cd,
			isnull(tpp.yr_blt, 0), isnull(tpp.living_area, 0),
			isnull(tpp.imprv_unit_price, 0), isnull(tpp.imprv_add_val, 0), tpp.class_cd,
			isnull(tpp.land_acres, 0), isnull(tpp.land_sqft, 0), isnull(tpp.land_front_feet, 0), isnull(tpp.land_depth, 0), isnull(tpp.land_unit_price, 0), tpp.land_lot, tpp.land_type_cd,
			tpp.region, tpp.abs_subdv, tpp.neighborhood, tpp.subset, tpp.map_id, isnull(tpp.appraised_val, 0),
			isnull(tpp.land_appr_method, ''), isnull(tpp.land_num_lots, 0), isnull(tpp.land_total_sqft, 0),
			isnull(tpp.eff_yr_blt, 0), tpp.condition_cd, tpp.percent_complete,
			tpp.ls_table, tpp.main_land_unit_price, tpp.main_land_total_adj, tpp.size_adj_pct, tpp.heat_ac_code, tpp.land_total_acres,
			tpp.zoning, tpp.visibility_access_cd, tpp.sub_market_cd, tpp.road_access,
			tpp.land_useable_acres, tpp.land_useable_sqft,
			tpp.property_use_cd, tpp.last_appraisal_dt, tpp.utilities, tpp.topography, tpp.num_imprv, tpp.imprv_type_cd, tpp.imprv_det_sub_class_cd,
			tpp.class_cd_highvalueimprov, tpp.imprv_det_sub_class_cd_highvalueimprov, tpp.living_area_highvalueimprov, tpp.actual_year_built,
			tpp.characteristic_zoning1, tpp.characteristic_zoning2, tpp.characteristic_view, tpp.actual_age,
			mhi.mbl_hm_make, mhi.mbl_hm_model, mhi.mbl_hm_sn, mhi.mbl_hm_hud_num, mhi.mbl_hm_title_num,
			tpp.imprv_det_meth_cd_highvalueimprov, hvi.building_name, hvid.lease_class
		from #recalc_bcp_property_profile as tpp with(nolock)
		left outer join imprv as mhi with(nolock) on
			mhi.prop_val_yr = tpp.prop_val_yr and
			mhi.sup_num = tpp.sup_num and
			mhi.sale_id = 0 and
			mhi.prop_id = tpp.prop_id and
			mhi.imprv_id = tpp.imprv_id_highvaluemobilehome
		left outer join imprv as hvi with(nolock) on
			hvi.prop_val_yr = tpp.prop_val_yr and
			hvi.sup_num = tpp.sup_num and
			hvi.sale_id = 0 and
			hvi.prop_id = tpp.prop_id and
			hvi.imprv_id = tpp.imprv_id_highvalue
		left outer join imprv_detail as hvid with(nolock) on
			hvid.prop_val_yr = tpp.prop_val_yr and
			hvid.sup_num = tpp.sup_num and
			hvid.sale_id = 0 and
			hvid.prop_id = tpp.prop_id and
			hvid.imprv_id = tpp.imprv_id_highvalue and
			hvid.imprv_det_id = tpp.imprv_det_id_highvalue
		where
			tpp.lRecalcBCPRowID >= @lMinBCPRowID and tpp.lRecalcBCPRowID <= @lMaxBCPRowID and
			not exists (
				select pp.prop_id
				from property_profile as pp
				where
					pp.prop_id = tpp.prop_id and
					pp.prop_val_yr = tpp.prop_val_yr
			)

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

