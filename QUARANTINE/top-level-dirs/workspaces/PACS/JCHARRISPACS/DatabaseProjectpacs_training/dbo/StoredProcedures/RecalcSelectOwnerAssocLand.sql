
create procedure RecalcSelectOwnerAssocLand
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				oa.prop_id,
				convert(smallint, oa.prop_val_yr),
				convert(smallint, oa.sup_num),
				oa.land_seg_id,
				oa.owner_id,
				oa.owner_pct
			from #recalc_prop_list as rpl with(nolock)
			join land_owner_assoc as oa with(nolock) on
				rpl.prop_id = oa.prop_id and
				rpl.sup_yr = oa.prop_val_yr and
				rpl.sup_num = oa.sup_num
			order by
				oa.prop_id asc,
				oa.prop_val_yr asc,
				oa.sup_num asc,
				oa.land_seg_id asc,
				oa.owner_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				oa.prop_id,
				convert(smallint, oa.prop_val_yr),
				convert(smallint, oa.sup_num),
				oa.land_seg_id,
				oa.owner_id,
				oa.owner_pct
			from land_owner_assoc as oa with(nolock)
			where
				oa.prop_val_yr = @lYear and
				oa.sup_num = @lSupNum
			order by
				oa.prop_id asc,
				oa.prop_val_yr asc,
				oa.sup_num asc,
				oa.land_seg_id asc,
				oa.owner_id asc
		end
		else
		begin
			select
				oa.prop_id,
				convert(smallint, oa.prop_val_yr),
				convert(smallint, oa.sup_num),
				oa.land_seg_id,
				oa.owner_id,
				oa.owner_pct
			from land_owner_assoc as oa with(nolock)
			where
				oa.prop_id = @lPropID and
				oa.prop_val_yr = @lYear and
				oa.sup_num = @lSupNum
			order by
				oa.prop_id asc,
				oa.prop_val_yr asc,
				oa.sup_num asc,
				oa.land_seg_id asc,
				oa.owner_id asc
		end
	end

	return(@@rowcount)

GO

