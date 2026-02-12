
create procedure ComparableSearchResidentialSales
	@szSelectProperty varchar(8000),
	@szUpdateSales varchar(8000)
as

set nocount on

	truncate table #comp_search_res_sales_sold_unsold

	declare @szSQL varchar(8000)

	set @szSQL =
		'insert #comp_search_res_sales_sold_unsold (' +
		'prop_id,school_id,city_id,state_cd,region,abs_subdv,neighborhood,' +
		'subset,map_id,class,subclass,livingarea,yr_blt,imprv_unit_price,imprv_add_val,' +
		'land_type_cd,land_sqft,land_front_feet,land_acres,land_lot,land_unit_price,' +
		'condition_cd,percent_complete,ls_table,main_land_unit_price,main_land_total_adj,' +
		'size_adj_pct,heat_ac_code,imprv_type_cd,' +
		'imprv_hstd_val,imprv_non_hstd_val,land_hstd_val,land_non_hstd_val,ag_market,timber_market,market,' +
		'geo_id,file_as_name,situs_street,situs_display,udi_parent,udi_status,udi_parent_prop_id,' +
		'situs_street_sufix,situs_street_prefx,situs_num,situs_unit,' +
		'bExclude_ImprovType,bExclude_ImprovDetailClass,bExclude_Entity,' +
		'tax_area_id,gis_real_coord_x,gis_real_coord_y,actual_year_built' +
		') '
		+
		@szSelectProperty

	exec(@szSQL)

	declare @lPropID int
	declare @lChgOfOwnerID int

	declare curProps cursor
	for
		select prop_id
		from #comp_search_res_sales_sold_unsold
	for read only

	open curProps
	fetch next from curProps into @lPropID

	while ( @@fetch_status = 0 )
	begin
		set @lChgOfOwnerID = null

		set @szSQL =
			'declare curSales cursor ' +
			'for ' +
			'select cs.chg_of_owner_id ' +
			'from comp_sales_prop_sale_vw as cs with(nolock) ' +
			'join chg_of_owner_prop_count_vw as coopcv with(nolock) on coopcv.chg_of_owner_id = cs.chg_of_owner_id ' +
			'where cs.prop_id = ' + convert(varchar(12), @lPropID) + ' ' +
			@szUpdateSales +
			' order by cs.sl_dt desc ' +
			'for read only'

		exec(@szSQL)

		open curSales

		fetch next from curSales into @lChgOfOwnerID

		if ( @@fetch_status <> 0 )
		begin
			set @lChgOfOwnerID = 0
		end

		close curSales
		deallocate curSales

		if ( @lChgOfOwnerID > 0 )
		begin
			update t
			set
				t.chg_of_owner_id = @lChgOfOwnerID,
				t.sl_type_cd = upper(rtrim(cs.sl_type_cd)),
				t.sl_dt = cs.sl_dt,
				t.sl_price = cs.sl_price,
				t.adjusted_sl_price = cs.adjusted_sl_price,
				t.sl_ratio_type_cd = upper(rtrim(cs.sl_ratio_type_cd))
			from #comp_search_res_sales_sold_unsold as t
			join sale as cs on
				cs.chg_of_owner_id = @lChgOfOwnerID
			where
				t.prop_id = @lPropID
		end

		fetch next from curProps into @lPropID
	end

	close curProps
	deallocate curProps

set nocount off

	select * from #comp_search_res_sales_sold_unsold with(nolock)

	return( @@rowcount )

GO

