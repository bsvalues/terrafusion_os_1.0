
create procedure RecalcSelectEntityPropAssoc
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				epa.prop_id,
				convert(smallint, epa.tax_yr),
				convert(smallint, epa.sup_num),
				epa.entity_id,
				isnull(epa.new_val_hs_override, 0),
				isnull(epa.new_val_hs_override_amount, 0),
				isnull(epa.new_val_nhs_override, 0),
				isnull(epa.new_val_nhs_override_amount, 0),
				isnull(epa.new_val_p_override, 0),
				isnull(epa.new_val_p_override_amount, 0)
			from #recalc_prop_list as rpl with(nolock)
			join entity_prop_assoc as epa with(nolock) on
				rpl.prop_id = epa.prop_id and
				rpl.sup_yr = epa.tax_yr and
				rpl.sup_num = epa.sup_num
			order by
				1 asc, 2 asc, 3 asc, 4 asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				epa.prop_id,
				convert(smallint, epa.tax_yr),
				convert(smallint, epa.sup_num),
				epa.entity_id,
				isnull(epa.new_val_hs_override, 0),
				isnull(epa.new_val_hs_override_amount, 0),
				isnull(epa.new_val_nhs_override, 0),
				isnull(epa.new_val_nhs_override_amount, 0),
				isnull(epa.new_val_p_override, 0),
				isnull(epa.new_val_p_override_amount, 0)
			from entity_prop_assoc as epa with(nolock)
			where
				epa.tax_yr = @lYear and
				epa.sup_num = @lSupNum
			order by
				1 asc, 2 asc, 3 asc, 4 asc
		end
		else
		begin
			select
				epa.prop_id,
				convert(smallint, epa.tax_yr),
				convert(smallint, epa.sup_num),
				epa.entity_id,
				isnull(epa.new_val_hs_override, 0),
				isnull(epa.new_val_hs_override_amount, 0),
				isnull(epa.new_val_nhs_override, 0),
				isnull(epa.new_val_nhs_override_amount, 0),
				isnull(epa.new_val_p_override, 0),
				isnull(epa.new_val_p_override_amount, 0)
			from entity_prop_assoc as epa with(nolock)
			where
				epa.prop_id = @lPropID and
				epa.tax_yr = @lYear and
				epa.sup_num = @lSupNum
			order by
				1 asc, 2 asc, 3 asc, 4 asc
		end
	end

	return( @@rowcount )

GO

