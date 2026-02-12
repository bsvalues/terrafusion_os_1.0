
create procedure RecalcSelectEntityAssocLand
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				ea.prop_id,
				convert(smallint, ea.prop_val_yr),
				convert(smallint, ea.sup_num),
				ea.land_seg_id,
				ea.entity_id,
				ea.entity_pct
			from #recalc_prop_list as rpl with(nolock)
			join land_entity_assoc as ea with(nolock) on
				rpl.prop_id = ea.prop_id and
				rpl.sup_yr = ea.prop_val_yr and
				rpl.sup_num = ea.sup_num
			order by
				ea.prop_id asc,
				ea.prop_val_yr asc,
				ea.sup_num asc,
				ea.land_seg_id asc,
				ea.entity_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				ea.prop_id,
				convert(smallint, ea.prop_val_yr),
				convert(smallint, ea.sup_num),
				ea.land_seg_id,
				ea.entity_id,
				ea.entity_pct
			from land_entity_assoc as ea with(nolock)
			where
				ea.prop_val_yr = @lYear and
				ea.sup_num = @lSupNum
			order by
				ea.prop_id asc,
				ea.prop_val_yr asc,
				ea.sup_num asc,
				ea.land_seg_id asc,
				ea.entity_id asc
		end
		else
		begin
			select
				ea.prop_id,
				convert(smallint, ea.prop_val_yr),
				convert(smallint, ea.sup_num),
				ea.land_seg_id,
				ea.entity_id,
				ea.entity_pct
			from land_entity_assoc as ea with(nolock)
			where
				ea.prop_id = @lPropID and
				ea.prop_val_yr = @lYear and
				ea.sup_num = @lSupNum
			order by
				ea.prop_id asc,
				ea.prop_val_yr asc,
				ea.sup_num asc,
				ea.land_seg_id asc,
				ea.entity_id asc
		end
	end

	return(@@rowcount)

GO

