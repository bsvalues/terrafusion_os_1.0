
create procedure RecalcSelectLandMiscCode
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
		select
			lmc.prop_id,
			convert(smallint, lmc.prop_val_yr),
			convert(smallint, lmc.sup_num),
			lmc.misc_id,
			convert(int, lmc.county_indicator),
			convert(int, lmc.cycle),
			upper(rtrim(lmc.region_cd)),
			upper(rtrim(lmc.hood_cd)),
			upper(rtrim(lmc.subset_cd)),
			upper(rtrim(lmc.misc_code))
		from #recalc_prop_list as rpl with(nolock)
		join property_land_misc_code as lmc with(nolock) on
			rpl.prop_id = lmc.prop_id and
			rpl.sup_yr = lmc.prop_val_yr and
			rpl.sup_num = lmc.sup_num and
			lmc.sale_id = @lSaleID
		order by
			lmc.prop_id asc,
			lmc.prop_val_yr asc,
			lmc.sup_num asc,
			lmc.misc_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				lmc.prop_id,
				convert(smallint, lmc.prop_val_yr),
				convert(smallint, lmc.sup_num),
				lmc.misc_id,
				convert(int, lmc.county_indicator),
				convert(int, lmc.cycle),
				upper(rtrim(lmc.region_cd)),
				upper(rtrim(lmc.hood_cd)),
				upper(rtrim(lmc.subset_cd)),
				upper(rtrim(lmc.misc_code))
			from property_land_misc_code as lmc with(nolock)
			where
				lmc.prop_val_yr = @lYear and
				lmc.sup_num = @lSupNum and
				lmc.sale_id = @lSaleID
			order by
				lmc.prop_id asc,
				lmc.prop_val_yr asc,
				lmc.sup_num asc,
				lmc.misc_id asc
		end
		else
		begin
			select
				lmc.prop_id,
				convert(smallint, lmc.prop_val_yr),
				convert(smallint, lmc.sup_num),
				lmc.misc_id,
				convert(int, lmc.county_indicator),
				convert(int, lmc.cycle),
				upper(rtrim(lmc.region_cd)),
				upper(rtrim(lmc.hood_cd)),
				upper(rtrim(lmc.subset_cd)),
				upper(rtrim(lmc.misc_code))
			from property_land_misc_code as lmc with(nolock)
			where
				lmc.prop_id = @lPropID and
				lmc.prop_val_yr = @lYear and
				lmc.sup_num = @lSupNum and
				lmc.sale_id = @lSaleID
			order by
				lmc.prop_id asc,
				lmc.prop_val_yr asc,
				lmc.sup_num asc,
				lmc.misc_id asc
		end
	end

	return( @@rowcount )

GO

