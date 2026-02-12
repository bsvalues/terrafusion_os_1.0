
create procedure RecalcSelectPersonalPropertySegmentScheduleAssoc
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0 -- No longer used
as

	if ( @lPacsUserID != 0 )
	begin
			select
				ppssa.prop_id,
				convert(smallint, ppssa.prop_val_yr),
				convert(smallint, ppssa.sup_num),
				ppssa.pp_seg_id,
				ppssa.pp_sched_id,
				ppssa.unit_price,
				convert(
					bit,
					case ppssa.flat_price_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case ppssa.active_flag
						when 'T' then 1
						else 0
					end
				)
			from #recalc_prop_list as rpl with(nolock)
			join pp_seg_sched_assoc as ppssa with(nolock) on
				rpl.prop_id = ppssa.prop_id and
				rpl.sup_yr = ppssa.prop_val_yr and
				rpl.sup_num = ppssa.sup_num
			join pers_prop_seg as pps with(nolock) on
				ppssa.prop_id = pps.prop_id and
				ppssa.prop_val_yr = pps.prop_val_yr and
				ppssa.sup_num = pps.sup_num and
				ppssa.pp_seg_id = pps.pp_seg_id and
				pps.pp_active_flag = 'T'
			order by
				ppssa.prop_id asc,
				ppssa.prop_val_yr asc,
				ppssa.sup_num asc,
				ppssa.pp_seg_id asc,
				ppssa.pp_sched_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				ppssa.prop_id,
				convert(smallint, ppssa.prop_val_yr),
				convert(smallint, ppssa.sup_num),
				ppssa.pp_seg_id,
				ppssa.pp_sched_id,
				ppssa.unit_price,
				convert(
					bit,
					case ppssa.flat_price_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case ppssa.active_flag
						when 'T' then 1
						else 0
					end
				)
			from pp_seg_sched_assoc as ppssa with(nolock)
			join pers_prop_seg as pps with(nolock) on
				ppssa.prop_id = pps.prop_id and
				ppssa.prop_val_yr = pps.prop_val_yr and
				ppssa.sup_num = pps.sup_num and
				ppssa.pp_seg_id = pps.pp_seg_id and
				pps.pp_active_flag = 'T'
			where
				ppssa.prop_val_yr = @lYear and
				ppssa.sup_num = @lSupNum
			order by
				ppssa.prop_id asc,
				ppssa.prop_val_yr asc,
				ppssa.sup_num asc,
				ppssa.pp_seg_id asc,
				ppssa.pp_sched_id asc
		end
		else
		begin
			select
				ppssa.prop_id,
				convert(smallint, ppssa.prop_val_yr),
				convert(smallint, ppssa.sup_num),
				ppssa.pp_seg_id,
				ppssa.pp_sched_id,
				ppssa.unit_price,
				convert(
					bit,
					case ppssa.flat_price_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case ppssa.active_flag
						when 'T' then 1
						else 0
					end
				)
			from pp_seg_sched_assoc as ppssa with(nolock)
			join pers_prop_seg as pps with(nolock) on
				ppssa.prop_id = pps.prop_id and
				ppssa.prop_val_yr = pps.prop_val_yr and
				ppssa.sup_num = pps.sup_num and
				ppssa.pp_seg_id = pps.pp_seg_id and
				pps.pp_active_flag = 'T'
			where
				ppssa.prop_id = @lPropID and
				ppssa.prop_val_yr = @lYear and
				ppssa.sup_num = @lSupNum
			order by
				ppssa.prop_id asc,
				ppssa.prop_val_yr asc,
				ppssa.sup_num asc,
				ppssa.pp_seg_id asc,
				ppssa.pp_sched_id asc
		end
	end

	return( @@rowcount )

GO

