
create procedure RecalcRowUpdatePropertyProfile
	@lPropID int,
	@lYear numeric(4,0),
	@sup_num int,
	@school_id int,
	@city_id int,
	@state_cd varchar(10),
	@yr_blt numeric(4,0),
	@living_area numeric(14,0),
	@imprv_unit_price numeric(14,2),
	@imprv_add_val numeric(14,0),
	@class_cd varchar(10),
	@land_acres numeric(18,4),
	@land_sqft numeric(18,2),
	@land_front_feet numeric(18,2),
	@land_depth numeric(18,2),
	@land_unit_price numeric(14,2),
	@land_type_cd varchar(10),
	@region varchar(5),
	@abs_subdv varchar(10),
	@neighborhood varchar(10),
	@subset varchar(5),
	@map_id varchar(20),
	@appraised_val numeric(14,0),
	@land_appr_method varchar(5),
	@land_num_lots int,
	@land_total_sqft numeric(18,2),
	@eff_yr_blt numeric(4,0),
	@condition_cd char(5),
	@percent_complete numeric(5,2),
	@ls_table char(25),
	@main_land_unit_price numeric(14,2),
	@main_land_total_adj numeric(8,6),
	@size_adj_pct numeric(5,2),
	@heat_ac_code varchar(75),
	@land_total_acres numeric(18,4),
	@zoning varchar(50),
	@visibility_access_cd varchar(10),
	@sub_market_cd varchar(10),
	@road_access varchar(50),
	@land_useable_acres numeric(18,4),
	@land_useable_sqft numeric(18,2),
	@property_use_cd varchar(10),
	@last_appraisal_dt datetime,
	@utilities varchar(50),
	@topography varchar(50),
	@num_imprv int,
	@imprv_type_cd char(5),
	@imprv_det_sub_class_cd varchar(10),
	@land_lot varchar(1),
	@class_cd_highvalueimprov varchar(10),
	@imprv_det_sub_class_cd_highvalueimprov varchar(10),
	@living_area_highvalueimprov numeric(14,0),
	@actual_year_built numeric(4,0),
	@characteristic_zoning1 varchar(20),
	@characteristic_zoning2 varchar(20),
	@characteristic_view varchar(20),
	@actual_age int,
	@imprv_det_meth_cd_highvalueimprov char(5),
	@imprv_id_highvaluemobilehome int,
	@imprv_id_highvalue int,
	@imprv_det_id_highvalue int
as

set nocount on

	declare
		@mbl_hm_make varchar(100),
		@mbl_hm_model varchar(100),
		@mbl_hm_sn varchar(100),
		@mbl_hm_hud_num varchar(100),
		@mbl_hm_title_num varchar(100)

	if ( @imprv_id_highvaluemobilehome > 0 )
	begin
		select
			@mbl_hm_make = mbl_hm_make,
			@mbl_hm_model = mbl_hm_model,
			@mbl_hm_sn = mbl_hm_sn,
			@mbl_hm_hud_num = mbl_hm_hud_num,
			@mbl_hm_title_num = mbl_hm_title_num
		from dbo.imprv with(nolock)
		where
			prop_val_yr = @lYear and
			sup_num = @sup_num and
			sale_id = 0 and -- Profile is only calc'ed when recalculating sale_id 0 so this is hardcoded
			prop_id = @lPropID and
			imprv_id = @imprv_id_highvaluemobilehome
	end
	
	declare
		@imprv_building_name_highvalueimprov varchar(50),
		@imprv_det_lease_class_highvalueimprov varchar(10)
		
	if ( @imprv_id_highvalue > 0 )
	begin
		select
			@imprv_building_name_highvalueimprov = building_name
		from dbo.imprv with(nolock)
		where
			prop_val_yr = @lYear and
			sup_num = @sup_num and
			sale_id = 0 and -- Profile is only calc'ed when recalculating sale_id 0 so this is hardcoded
			prop_id = @lPropID and
			imprv_id = @imprv_id_highvalue
	
		if ( @imprv_det_id_highvalue > 0 )
		begin
			select
				@imprv_det_lease_class_highvalueimprov = lease_class
			from dbo.imprv_detail with(nolock)
			where
				prop_val_yr = @lYear and
				sup_num = @sup_num and
				sale_id = 0 and -- Profile is only calc'ed when recalculating sale_id 0 so this is hardcoded
				prop_id = @lPropID and
				imprv_id = @imprv_id_highvalue and
				imprv_det_id = @imprv_det_id_highvalue
		end
	end
	
	update property_profile with(rowlock)
	set
		sup_num = @sup_num,
		school_id = isnull(@school_id, 0),
		city_id = isnull(@city_id, 0),
		state_cd = @state_cd,
		yr_blt = isnull(@yr_blt, 0),
		living_area = isnull(@living_area, 0),
		imprv_unit_price = isnull(@imprv_unit_price, 0),
		imprv_add_val = isnull(@imprv_add_val, 0),
		class_cd = @class_cd,
		land_acres = isnull(@land_acres, 0),
		land_sqft = isnull(@land_sqft, 0),
		land_front_feet = isnull(@land_front_feet, 0),
		land_depth = isnull(@land_depth, 0),
		land_unit_price = isnull(@land_unit_price, 0),
		land_type_cd = @land_type_cd,

		region = @region,
		abs_subdv = @abs_subdv,
		neighborhood = @neighborhood,
		subset = @subset,
		map_id = @map_id,
		appraised_val = isnull(@appraised_val, 0),

		land_appr_method = isnull(@land_appr_method, ''),
		land_num_lots = isnull(@land_num_lots, 0),
		land_total_sqft = isnull(@land_total_sqft, 0),
		eff_yr_blt = isnull(@eff_yr_blt, 0),
		condition_cd = @condition_cd,
		percent_complete = @percent_complete,
		ls_table = @ls_table,
		main_land_unit_price = @main_land_unit_price,
		main_land_total_adj = @main_land_total_adj,
		size_adj_pct = @size_adj_pct,
		heat_ac_code = @heat_ac_code,
		land_total_acres = @land_total_acres,

		zoning = @zoning,
		visibility_access_cd = @visibility_access_cd,
		sub_market_cd = @sub_market_cd,
		road_access = @road_access,
		land_useable_acres = @land_useable_acres,
		land_useable_sqft = @land_useable_sqft,
		property_use_cd = @property_use_cd,
		last_appraisal_dt = @last_appraisal_dt,
		utilities = @utilities,
		topography = @topography,
		num_imprv = @num_imprv,
		imprv_type_cd = @imprv_type_cd,
		imprv_det_sub_class_cd = @imprv_det_sub_class_cd,
		land_lot = @land_lot,
		class_cd_highvalueimprov = @class_cd_highvalueimprov,
		imprv_det_sub_class_cd_highvalueimprov = @imprv_det_sub_class_cd_highvalueimprov,
		living_area_highvalueimprov = @living_area_highvalueimprov,
		actual_year_built = @actual_year_built,
		characteristic_zoning1 = @characteristic_zoning1,
		characteristic_zoning2 = @characteristic_zoning2,
		characteristic_view = @characteristic_view,
		actual_age = @actual_age,
		mbl_hm_make = @mbl_hm_make,
		mbl_hm_model = @mbl_hm_model,
		mbl_hm_sn = @mbl_hm_sn,
		mbl_hm_hud_num = @mbl_hm_hud_num,
		mbl_hm_title_num = @mbl_hm_title_num,
		imprv_det_meth_cd_highvalueimprov = @imprv_det_meth_cd_highvalueimprov,
		imprv_building_name_highvalueimprov = @imprv_building_name_highvalueimprov,
		imprv_det_lease_class_highvalueimprov = @imprv_det_lease_class_highvalueimprov
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear

	if ( @@rowcount = 0 )
	begin
		/* Not all property layers will have a property_profile row, so add those that do not */
		insert property_profile with(rowlock) (
			prop_id, prop_val_yr, sup_num,
			school_id, city_id, state_cd,
			yr_blt, living_area,
			imprv_unit_price, imprv_add_val, class_cd,
			land_acres, land_sqft, land_front_feet, land_depth, land_unit_price, land_type_cd,
			region, abs_subdv, neighborhood, subset, map_id, appraised_val,
			land_appr_method, land_num_lots, land_total_sqft,
			eff_yr_blt, condition_cd, percent_complete,
			ls_table, main_land_unit_price, main_land_total_adj, size_adj_pct, heat_ac_code, land_total_acres,
			zoning, visibility_access_cd, sub_market_cd, road_access,
			land_useable_acres, land_useable_sqft,
			property_use_cd, last_appraisal_dt, utilities, topography, num_imprv, imprv_type_cd, imprv_det_sub_class_cd, land_lot,
			class_cd_highvalueimprov, imprv_det_sub_class_cd_highvalueimprov, living_area_highvalueimprov, actual_year_built,
			characteristic_zoning1, characteristic_zoning2, characteristic_view, actual_age,
			mbl_hm_make, mbl_hm_model, mbl_hm_sn, mbl_hm_hud_num, mbl_hm_title_num,
			imprv_det_meth_cd_highvalueimprov, imprv_building_name_highvalueimprov, imprv_det_lease_class_highvalueimprov
		) values (
			@lPropID, @lYear, @sup_num,
			isnull(@school_id, 0), isnull(@city_id, 0), @state_cd,
			isnull(@yr_blt, 0), isnull(@living_area, 0),
			isnull(@imprv_unit_price, 0), isnull(@imprv_add_val, 0), @class_cd,
			isnull(@land_acres, 0), isnull(@land_sqft, 0), isnull(@land_front_feet, 0), isnull(@land_depth, 0), isnull(@land_unit_price, 0), @land_type_cd,
			@region, @abs_subdv, @neighborhood, @subset, @map_id, isnull(@appraised_val, 0),
			isnull(@land_appr_method, ''), isnull(@land_num_lots, 0), isnull(@land_total_sqft, 0),
			isnull(@eff_yr_blt, 0), @condition_cd, @percent_complete,
			@ls_table, @main_land_unit_price, @main_land_total_adj, @size_adj_pct, @heat_ac_code, @land_total_acres,
			@zoning, @visibility_access_cd, @sub_market_cd, @road_access,
			@land_useable_acres, @land_useable_sqft,
			@property_use_cd, @last_appraisal_dt, @utilities, @topography, @num_imprv, @imprv_type_cd, @imprv_det_sub_class_cd, @land_lot,
			@class_cd_highvalueimprov, @imprv_det_sub_class_cd_highvalueimprov, @living_area_highvalueimprov, @actual_year_built,
			@characteristic_zoning1, @characteristic_zoning2, @characteristic_view, @actual_age,
			@mbl_hm_make, @mbl_hm_model, @mbl_hm_sn, @mbl_hm_hud_num, @mbl_hm_title_num,
			@imprv_det_meth_cd_highvalueimprov, @imprv_building_name_highvalueimprov, @imprv_det_lease_class_highvalueimprov
		)
	end

GO

