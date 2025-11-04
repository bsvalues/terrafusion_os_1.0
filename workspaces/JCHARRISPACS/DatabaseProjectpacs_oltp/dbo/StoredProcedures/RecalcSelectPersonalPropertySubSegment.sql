
create procedure RecalcSelectPersonalPropertySubSegment
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				ppss.prop_id,
				convert(smallint, ppss.prop_val_yr),
				convert(smallint, ppss.sup_num),
				ppss.pp_seg_id,
				ppss.pp_sub_seg_id,
				isnull(ppss.pp_orig_cost, 0),
				convert(smallint, isnull(ppss.pp_yr_aquired, 0)),
				ppss.pp_dep_pct,
				ppss.pp_pct_good,
				ppss.pp_economic_pct,
				ppss.pp_physical_pct,
				isnull(ppss.pp_flat_val, 0),
				isnull(ppss.pp_rendered_val, 0),
				upper(rtrim(ppss.calc_method_flag)),
				upper(rtrim(ppss.pp_dep_type_cd)),
				upper(rtrim(ppss.pp_dep_deprec_cd))

			from #recalc_prop_list as rpl with(nolock)
			join pers_prop_sub_seg as ppss with(nolock) on
				rpl.prop_id = ppss.prop_id and
				rpl.sup_yr = ppss.prop_val_yr and
				rpl.sup_num = ppss.sup_num
			join pers_prop_seg as pps with(nolock) on
				pps.prop_val_yr = ppss.prop_val_yr and
				pps.sup_num = ppss.sup_num and
				pps.prop_id = ppss.prop_id and
				pps.pp_seg_id = ppss.pp_seg_id and
				pps.pp_active_flag = 'T'
			order by
				ppss.prop_id asc,
				ppss.prop_val_yr asc,
				ppss.sup_num asc,
				ppss.pp_seg_id asc,
				ppss.pp_sub_seg_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				ppss.prop_id,
				convert(smallint, ppss.prop_val_yr),
				convert(smallint, ppss.sup_num),
				ppss.pp_seg_id,
				ppss.pp_sub_seg_id,
				isnull(ppss.pp_orig_cost, 0),
				convert(smallint, isnull(ppss.pp_yr_aquired, 0)),
				ppss.pp_dep_pct,
				ppss.pp_pct_good,
				ppss.pp_economic_pct,
				ppss.pp_physical_pct,
				isnull(ppss.pp_flat_val, 0),
				isnull(ppss.pp_rendered_val, 0),
				upper(rtrim(ppss.calc_method_flag)),
				upper(rtrim(ppss.pp_dep_type_cd)),
				upper(rtrim(ppss.pp_dep_deprec_cd))

			from pers_prop_sub_seg as ppss with(nolock)
			join pers_prop_seg as pps with(nolock) on
				pps.prop_val_yr = ppss.prop_val_yr and
				pps.sup_num = ppss.sup_num and
				pps.prop_id = ppss.prop_id and
				pps.pp_seg_id = ppss.pp_seg_id and
				pps.pp_active_flag = 'T'
			where
				ppss.prop_val_yr = @lYear and
				ppss.sup_num = @lSupNum
			order by
				ppss.prop_id asc,
				ppss.prop_val_yr asc,
				ppss.sup_num asc,
				ppss.pp_seg_id asc,
				ppss.pp_sub_seg_id asc
		end
		else
		begin
			select
				ppss.prop_id,
				convert(smallint, ppss.prop_val_yr),
				convert(smallint, ppss.sup_num),
				ppss.pp_seg_id,
				ppss.pp_sub_seg_id,
				isnull(ppss.pp_orig_cost, 0),
				convert(smallint, isnull(ppss.pp_yr_aquired, 0)),
				ppss.pp_dep_pct,
				ppss.pp_pct_good,
				ppss.pp_economic_pct,
				ppss.pp_physical_pct,
				isnull(ppss.pp_flat_val, 0),
				isnull(ppss.pp_rendered_val, 0),
				upper(rtrim(ppss.calc_method_flag)),
				upper(rtrim(ppss.pp_dep_type_cd)),
				upper(rtrim(ppss.pp_dep_deprec_cd))

			from pers_prop_sub_seg as ppss with(nolock)
			join pers_prop_seg as pps with(nolock) on
				pps.prop_val_yr = ppss.prop_val_yr and
				pps.sup_num = ppss.sup_num and
				pps.prop_id = ppss.prop_id and
				pps.pp_seg_id = ppss.pp_seg_id and
				pps.pp_active_flag = 'T'
			where
				ppss.prop_id = @lPropID and
				ppss.prop_val_yr = @lYear and
				ppss.sup_num = @lSupNum
			order by
				ppss.prop_id asc,
				ppss.prop_val_yr asc,
				ppss.sup_num asc,
				ppss.pp_seg_id asc,
				ppss.pp_sub_seg_id asc
		end
	end

	return( @@rowcount )

GO

