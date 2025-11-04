
create procedure RecalcRowUpdateEntityPropAssoc
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lEntityID int,
	@bUpdate_EntityPropPct bit,
	@entity_prop_pct numeric(13,10),
	@pct_imprv_hs numeric(13,10),
	@pct_imprv_nhs numeric(13,10),
	@pct_land_hs numeric(13,10),
	@pct_land_nhs numeric(13,10),
	@pct_ag_use numeric(13,10),
	@pct_ag_mkt numeric(13,10),
	@pct_tim_use numeric(13,10),
	@pct_tim_mkt numeric(13,10),
	@bUpdate_NewValHS bit,
	@new_val_hs numeric(14,0),
	@new_val_hs_override bit,
	@new_val_hs_override_amount numeric(14,0),
	@bUpdate_NewValNHS bit,
	@new_val_nhs numeric(14,0),
	@new_val_nhs_override bit,
	@new_val_nhs_override_amount numeric(14,0),
	@bUpdate_NewValP bit,
	@new_val_p numeric(14,0),
	@new_val_p_override bit,
	@new_val_p_override_amount numeric(14,0)
as

set nocount on

	update entity_prop_assoc
	set
		entity_prop_pct = case
			when @bUpdate_EntityPropPct = 1
			then @entity_prop_pct
			else entity_prop_pct
		end,
		pct_imprv_hs = @pct_imprv_hs,
		pct_imprv_nhs = @pct_imprv_nhs,
		pct_land_hs = @pct_land_hs,
		pct_land_nhs = @pct_land_nhs,
		pct_ag_use = @pct_ag_use,
		pct_ag_mkt = @pct_ag_mkt,
		pct_tim_use = @pct_tim_use,
		pct_tim_mkt = @pct_tim_mkt,
		new_val_hs = case
			when @bUpdate_NewValHS = 1
			then @new_val_hs
			else new_val_hs
		end,
		new_val_hs_override = case
			when @bUpdate_NewValHS = 1
			then @new_val_hs_override
			else new_val_hs_override
		end,
		new_val_hs_override_amount = case
			when @bUpdate_NewValHS = 1
			then @new_val_hs_override_amount
			else new_val_hs_override_amount
		end,
		new_val_nhs = case
			when @bUpdate_NewValNHS = 1
			then @new_val_nhs
			else new_val_nhs
		end,
		new_val_nhs_override = case
			when @bUpdate_NewValNHS = 1
			then @new_val_nhs_override
			else new_val_nhs_override
		end,
		new_val_nhs_override_amount = case
			when @bUpdate_NewValNHS = 1
			then @new_val_nhs_override_amount
			else new_val_nhs_override_amount
		end,
		new_val_p = case
			when @bUpdate_NewValP = 1
			then @new_val_p
			else new_val_p
		end,
		new_val_p_override = case
			when @bUpdate_NewValP = 1
			then @new_val_p_override
			else new_val_p_override
		end,
		new_val_p_override_amount = case
			when @bUpdate_NewValP = 1
			then @new_val_p_override_amount
			else new_val_p_override_amount
		end
	where
		prop_id = @lPropID and
		tax_yr = @lYear and
		sup_num = @lSupNum and
		entity_id = @lEntityID

GO

