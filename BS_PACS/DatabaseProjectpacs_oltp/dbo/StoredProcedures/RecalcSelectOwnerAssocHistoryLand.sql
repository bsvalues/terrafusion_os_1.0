
create procedure RecalcSelectOwnerAssocHistoryLand
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0)
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
			from #recalc_history_supp_assoc as rsa with(nolock)
			join land_owner_assoc as oa with(nolock) on
				oa.prop_val_yr = rsa.prop_val_yr and
				oa.sup_num = rsa.sup_num and
				oa.sale_id = 0 and
				oa.prop_id = rsa.prop_id
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
				oa.prop_val_yr < @lYear and
				oa.prop_val_yr >= (@lYear - 3)
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
				oa.prop_val_yr < @lYear and
				oa.prop_val_yr >= (@lYear - 3)
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

