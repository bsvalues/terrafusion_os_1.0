
create procedure RecalcSelectIncomeLandAssoc
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
		select
			i.prop_id,
			convert(smallint, i.income_yr),
			convert(smallint, i.sup_num),
			i.land_seg_id,
			i.income_id,
			i.included,
			i.value
		from #recalc_worktable_income_id_assoc as ril with(nolock)
		join income_land_detail_assoc as i with(nolock) on
			ril.income_yr = i.income_yr and
			ril.sup_num = i.sup_num and
			ril.income_id = i.income_id
		join property_val as pv with(nolock) on
			pv.prop_val_yr = i.income_yr and
			pv.sup_num = i.sup_num and
			pv.prop_id = i.prop_id and
			(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
		order by 1, 2, 3, 4, 5
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				i.prop_id,
				convert(smallint, i.income_yr),
				convert(smallint, i.sup_num),
				i.land_seg_id,
				i.income_id,
				i.included,
				i.value
			from income_land_detail_assoc as i with(nolock)
			join property_val as pv with(nolock) on
				pv.prop_val_yr = i.income_yr and
				pv.sup_num = i.sup_num and
				pv.prop_id = i.prop_id and
				(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
			where
				i.income_yr = @lYear and
				i.sup_num = @lSupNum
			order by 1, 2, 3, 4, 5
		end
		else
		begin
			select
				i.prop_id,
				convert(smallint, i.income_yr),
				convert(smallint, i.sup_num),
				i.land_seg_id,
				i.income_id,
				i.included,
				i.value
			from income_land_detail_assoc as i with(nolock)
			join property_val as pv with(nolock) on
				pv.prop_val_yr = i.income_yr and
				pv.sup_num = i.sup_num and
				pv.prop_id = i.prop_id and
				(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
			where
				i.prop_id = @lPropID and
				i.income_yr = @lYear and
				i.sup_num = @lSupNum
			order by 1, 2, 3, 4, 5
		end
	end

	return( @@rowcount )

GO

