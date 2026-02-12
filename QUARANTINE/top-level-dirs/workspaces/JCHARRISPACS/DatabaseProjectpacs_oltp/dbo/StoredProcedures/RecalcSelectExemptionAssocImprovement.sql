
create procedure RecalcSelectExemptionAssocImprovement
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				eai.prop_id,
				convert(smallint, eai.prop_val_yr),
				convert(smallint, eai.sup_num),
				eai.imprv_id,
				eai.owner_id,
				eai.entity_id,
				upper(rtrim(eai.exmpt_type_cd)),
				eai.amount,
				eai.exempt_pct,
				upper(rtrim(eai.value_type))
			from #recalc_prop_list as rpl with(nolock)
			join imprv_exemption_assoc as eai with(nolock) on
				rpl.prop_id = eai.prop_id and
				rpl.sup_yr = eai.prop_val_yr and
				rpl.sup_num = eai.sup_num and
				eai.sale_id = @lSaleID
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				eai.prop_id,
				convert(smallint, eai.prop_val_yr),
				convert(smallint, eai.sup_num),
				eai.imprv_id,
				eai.owner_id,
				eai.entity_id,
				upper(rtrim(eai.exmpt_type_cd)),
				eai.amount,
				eai.exempt_pct,
				upper(rtrim(eai.value_type))
			from imprv_exemption_assoc as eai with(nolock)
			where
				eai.prop_val_yr = @lYear and
				eai.sup_num = @lSupNum and
				eai.sale_id = @lSaleID
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
		end
		else
		begin
			select
				eai.prop_id,
				convert(smallint, eai.prop_val_yr),
				convert(smallint, eai.sup_num),
				eai.imprv_id,
				eai.owner_id,
				eai.entity_id,
				upper(rtrim(eai.exmpt_type_cd)),
				eai.amount,
				eai.exempt_pct,
				upper(rtrim(eai.value_type))
			from imprv_exemption_assoc as eai with(nolock)
			where
				eai.prop_id = @lPropID and
				eai.prop_val_yr = @lYear and
				eai.sup_num = @lSupNum and
				eai.sale_id = @lSaleID
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
		end
	end

	return( @@rowcount )

GO

