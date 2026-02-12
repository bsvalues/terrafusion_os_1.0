
create procedure CalculateTaxableSelectEntityPropAssoc
	@lYear numeric(4,0),
	@lSupNum int,
	@bUseList bit
as

	if ( @bUseList = 1 )
	begin
		select
			epa.prop_id,
			epa.entity_id,
			isnull(epa.entity_prop_pct, 100.0),
			isnull(epa.pct_imprv_hs, 100.0),
			isnull(epa.pct_imprv_nhs, 100.0),
			isnull(epa.pct_land_hs, 100.0),
			isnull(epa.pct_land_nhs, 100.0),
			isnull(epa.pct_ag_use, 100.0),
			isnull(epa.pct_ag_mkt, 100.0),
			isnull(epa.pct_tim_use, 100.0),
			isnull(epa.pct_tim_mkt, 100.0),
			case when epa.new_val_hs_override = 0 then isnull(epa.new_val_hs, 0) else isnull(epa.new_val_hs_override_amount, 0) end,
			case when epa.new_val_nhs_override = 0 then isnull(epa.new_val_nhs, 0) else isnull(epa.new_val_nhs_override_amount, 0) end,
			case when epa.new_val_p_override = 0 then isnull(epa.new_val_p, 0) else isnull(epa.new_val_p_override_amount, 0) end
		from entity_prop_assoc as epa with(nolock)
		where
			epa.prop_id in (
				select prop_id from #totals_prop_list
			) and
			epa.tax_yr = @lYear and
			epa.sup_num = @lSupNum and
			epa.entity_id in (
				select entity_id from #totals_entity_list
			)
		order by epa.entity_id asc, epa.prop_id asc
	end
	else
	begin
		select
			epa.prop_id,
			epa.entity_id,
			isnull(epa.entity_prop_pct, 100.0),
			isnull(epa.pct_imprv_hs, 100.0),
			isnull(epa.pct_imprv_nhs, 100.0),
			isnull(epa.pct_land_hs, 100.0),
			isnull(epa.pct_land_nhs, 100.0),
			isnull(epa.pct_ag_use, 100.0),
			isnull(epa.pct_ag_mkt, 100.0),
			isnull(epa.pct_tim_use, 100.0),
			isnull(epa.pct_tim_mkt, 100.0),
			case when epa.new_val_hs_override = 0 then isnull(epa.new_val_hs, 0) else isnull(epa.new_val_hs_override_amount, 0) end,
			case when epa.new_val_nhs_override = 0 then isnull(epa.new_val_nhs, 0) else isnull(epa.new_val_nhs_override_amount, 0) end,
			case when epa.new_val_p_override = 0 then isnull(epa.new_val_p, 0) else isnull(epa.new_val_p_override_amount, 0) end
		from entity_prop_assoc as epa with(nolock)
		where
			epa.tax_yr = @lYear and
			epa.sup_num = @lSupNum
		order by epa.entity_id asc, epa.prop_id asc
	end

	return(@@rowcount)

GO

