
create procedure RecalcSelectExemptionAssocLand
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				eal.prop_id,
				convert(smallint, eal.prop_val_yr),
				convert(smallint, eal.sup_num),
				eal.land_seg_id,
				eal.owner_id,
				eal.entity_id,
				upper(rtrim(eal.exmpt_type_cd)),
				eal.amount,
				eal.exempt_pct,
				upper(rtrim(eal.value_type))
			from #recalc_prop_list as rpl with(nolock)
			join land_exemption_assoc as eal with(nolock) on
				rpl.prop_id = eal.prop_id and
				rpl.sup_yr = eal.prop_val_yr and
				rpl.sup_num = eal.sup_num and
				eal.sale_id = @lSaleID
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				eal.prop_id,
				convert(smallint, eal.prop_val_yr),
				convert(smallint, eal.sup_num),
				eal.land_seg_id,
				eal.owner_id,
				eal.entity_id,
				upper(rtrim(eal.exmpt_type_cd)),
				eal.amount,
				eal.exempt_pct,
				upper(rtrim(eal.value_type))
			from land_exemption_assoc as eal with(nolock)
			where
				eal.prop_val_yr = @lYear and
				eal.sup_num = @lSupNum and
				eal.sale_id = @lSaleID
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
		end
		else
		begin
			select
				eal.prop_id,
				convert(smallint, eal.prop_val_yr),
				convert(smallint, eal.sup_num),
				eal.land_seg_id,
				eal.owner_id,
				eal.entity_id,
				upper(rtrim(eal.exmpt_type_cd)),
				eal.amount,
				eal.exempt_pct,
				upper(rtrim(eal.value_type))
			from land_exemption_assoc as eal with(nolock)
			where
				eal.prop_id = @lPropID and
				eal.prop_val_yr = @lYear and
				eal.sup_num = @lSupNum and
				eal.sale_id = @lSaleID
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
		end
	end

	return( @@rowcount )

GO

