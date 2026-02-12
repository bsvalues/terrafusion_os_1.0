
create procedure RecalcSelectLandAdj
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				la.prop_id,
				convert(smallint, la.prop_val_yr),
				convert(smallint, la.sup_num),
				la.land_seg_id,
				isnull(la.land_value,0),
				isnull(la.land_seg_adj_pc,0),
				upper(rtrim(la.land_seg_adj_type)),
				la.land_seg_adj_method
			from #recalc_prop_list as rpl with(nolock)
			join land_adj as la with(nolock) on
				rpl.prop_id = la.prop_id and
				rpl.sup_yr = la.prop_val_yr and
				rpl.sup_num = la.sup_num and
				la.sale_id = @lSaleID
			order by
				la.prop_id asc,
				la.prop_val_yr asc,
				la.sup_num asc,
				la.land_seg_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				la.prop_id,
				convert(smallint, la.prop_val_yr),
				convert(smallint, la.sup_num),
				la.land_seg_id,
				isnull(la.land_value,0),
				isnull(la.land_seg_adj_pc,0),
				upper(rtrim(la.land_seg_adj_type)),
				la.land_seg_adj_method
			from land_adj as la with(nolock)
			where
				la.prop_val_yr = @lYear and
				la.sup_num = @lSupNum and
				la.sale_id = @lSaleID
			order by
				la.prop_id asc,
				la.prop_val_yr asc,
				la.sup_num asc,
				la.land_seg_id asc
		end
		else
		begin
			select
				la.prop_id,
				convert(smallint, la.prop_val_yr),
				convert(smallint, la.sup_num),
				la.land_seg_id,
				isnull(la.land_value,0),
				isnull(la.land_seg_adj_pc,0),
				upper(rtrim(la.land_seg_adj_type)),
				la.land_seg_adj_method
			from land_adj as la with(nolock)
			where
				la.prop_id = @lPropID and
				la.prop_val_yr = @lYear and
				la.sup_num = @lSupNum and
				la.sale_id = @lSaleID
			order by
				la.prop_id asc,
				la.prop_val_yr asc,
				la.sup_num asc,
				la.land_seg_id asc
		end
	end

	return( @@rowcount )

GO

