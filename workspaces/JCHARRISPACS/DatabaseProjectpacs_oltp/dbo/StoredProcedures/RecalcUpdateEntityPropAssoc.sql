
create procedure RecalcUpdateEntityPropAssoc
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_entity_prop_assoc
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 0,
			tablock
		)
	'
	exec(@szSQL)
	set @lBCPRowCount = @@rowcount

	/* Update all rows at once if requested */
	if ( @lRowsPerUpdate = 0 )
	begin
		set @lRowsPerUpdate = @lBCPRowCount
	end

	declare @lMinBCPRowID int
	declare @lMaxBCPRowID int

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lBCPRowCount > 0 )
	begin
		update entity_prop_assoc
		set
			entity_prop_assoc.entity_prop_pct = case
				when tepa.bUpdate_EntityPropPct = 1
				then tepa.entity_prop_pct
				else entity_prop_assoc.entity_prop_pct
			end,
			entity_prop_assoc.pct_imprv_hs = tepa.pct_imprv_hs,
			entity_prop_assoc.pct_imprv_nhs = tepa.pct_imprv_nhs,
			entity_prop_assoc.pct_land_hs = tepa.pct_land_hs,
			entity_prop_assoc.pct_land_nhs = tepa.pct_land_nhs,
			entity_prop_assoc.pct_ag_use = tepa.pct_ag_use,
			entity_prop_assoc.pct_ag_mkt = tepa.pct_ag_mkt,
			entity_prop_assoc.pct_tim_use = tepa.pct_tim_use,
			entity_prop_assoc.pct_tim_mkt = tepa.pct_tim_mkt,
			entity_prop_assoc.new_val_hs = case
				when tepa.bUpdate_NewValHS = 1
				then tepa.new_val_hs
				else entity_prop_assoc.new_val_hs
			end,
			entity_prop_assoc.new_val_hs_override = case
				when tepa.bUpdate_NewValHS = 1
				then tepa.new_val_hs_override
				else entity_prop_assoc.new_val_hs_override
			end,
			entity_prop_assoc.new_val_hs_override_amount = case
				when tepa.bUpdate_NewValHS = 1
				then tepa.new_val_hs_override_amount
				else entity_prop_assoc.new_val_hs_override_amount
			end,
			entity_prop_assoc.new_val_nhs = case
				when tepa.bUpdate_NewValNHS = 1
				then tepa.new_val_nhs
				else entity_prop_assoc.new_val_nhs
			end,
			entity_prop_assoc.new_val_nhs_override = case
				when tepa.bUpdate_NewValNHS = 1
				then tepa.new_val_nhs_override
				else entity_prop_assoc.new_val_nhs_override
			end,
			entity_prop_assoc.new_val_nhs_override_amount = case
				when tepa.bUpdate_NewValNHS = 1
				then tepa.new_val_nhs_override_amount
				else entity_prop_assoc.new_val_nhs_override_amount
			end,
			entity_prop_assoc.new_val_p = case
				when tepa.bUpdate_NewValP = 1
				then tepa.new_val_p
				else entity_prop_assoc.new_val_p
			end,
			entity_prop_assoc.new_val_p_override = case
				when tepa.bUpdate_NewValP = 1
				then tepa.new_val_p_override
				else entity_prop_assoc.new_val_p_override
			end,
			entity_prop_assoc.new_val_p_override_amount = case
				when tepa.bUpdate_NewValP = 1
				then tepa.new_val_p_override_amount
				else entity_prop_assoc.new_val_p_override_amount
			end
		from entity_prop_assoc
		join #recalc_bcp_entity_prop_assoc as tepa with(nolock) on
			entity_prop_assoc.prop_id = tepa.prop_id and
			entity_prop_assoc.tax_yr = tepa.tax_yr and
			entity_prop_assoc.sup_num = tepa.sup_num and
			entity_prop_assoc.entity_id = tepa.entity_id and
			tepa.lRecalcBCPRowID >= @lMinBCPRowID and tepa.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

