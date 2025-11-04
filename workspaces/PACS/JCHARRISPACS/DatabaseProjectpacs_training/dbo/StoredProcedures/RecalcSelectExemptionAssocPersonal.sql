
create procedure RecalcSelectExemptionAssocPersonal
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				eap.prop_id,
				convert(smallint, eap.prop_val_yr),
				convert(smallint, eap.sup_num),
				eap.pp_seg_id,
				eap.owner_id,
				eap.entity_id,
				upper(rtrim(eap.exmpt_type_cd)),
				eap.amount,
				eap.exempt_pct,
				upper(rtrim(eap.value_type))
			from #recalc_prop_list as rpl with(nolock)
			join pers_prop_exemption_assoc as eap with(nolock) on
				rpl.prop_id = eap.prop_id and
				rpl.sup_yr = eap.prop_val_yr and
				rpl.sup_num = eap.sup_num
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				eap.prop_id,
				convert(smallint, eap.prop_val_yr),
				convert(smallint, eap.sup_num),
				eap.pp_seg_id,
				eap.owner_id,
				eap.entity_id,
				upper(rtrim(eap.exmpt_type_cd)),
				eap.amount,
				eap.exempt_pct,
				upper(rtrim(eap.value_type))
			from pers_prop_exemption_assoc as eap with(nolock)
			where
				eap.prop_val_yr = @lYear and
				eap.sup_num = @lSupNum and
				eap.sale_id = @lSaleID
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
		end
		else
		begin
			select
				eap.prop_id,
				convert(smallint, eap.prop_val_yr),
				convert(smallint, eap.sup_num),
				eap.pp_seg_id,
				eap.owner_id,
				eap.entity_id,
				upper(rtrim(eap.exmpt_type_cd)),
				eap.amount,
				eap.exempt_pct,
				upper(rtrim(eap.value_type))
			from pers_prop_exemption_assoc as eap with(nolock)
			where
				eap.prop_id = @lPropID and
				eap.prop_val_yr = @lYear and
				eap.sup_num = @lSupNum and
				eap.sale_id = @lSaleID
			order by
				1 asc, 2 asc, 3 asc, 4 asc, 5 asc, 6 asc, 7 asc
		end
	end

	return( @@rowcount )

GO

