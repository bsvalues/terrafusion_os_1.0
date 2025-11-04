
create procedure RecalcUpdateLand
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_land_detail
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
		update land_detail
		set
			land_detail.land_seg_mkt_val = tld.land_seg_mkt_val,
			land_detail.mkt_unit_price = tld.mkt_unit_price,
			land_detail.ag_val = tld.ag_val,
			land_detail.ag_unit_price = tld.ag_unit_price,

			land_detail.land_adj_amt = tld.land_adj_amt,
			land_detail.land_adj_factor = tld.land_adj_factor,
			land_detail.land_mass_adj_factor = tld.land_mass_adj_factor,

			land_detail.mkt_calc_val = tld.mkt_calc_val,
			land_detail.mkt_adj_val = tld.mkt_adj_val,

			land_detail.ag_calc_val = tld.ag_calc_val,
			land_detail.ag_loss = tld.ag_loss,

			land_detail.oa_mkt_val = tld.oa_mkt_val,
			land_detail.oa_ag_val = tld.oa_ag_val,
			
			land_detail.timber_78_val = tld.timber_78_val,
			land_detail.timber_78_val_pct = tld.timber_78_val_pct,
			land_detail.ls_mkt_id = tld.ls_mkt_id,
			land_detail.land_new_val = tld.land_new_val,
			land_detail.new_construction_value = tld.land_new_val,
			land_detail.misc_value = tld.misc_value,
			land_detail.primary_use_cd = tld.primary_use_cd,
			land_detail.mktappr_val = tld.mktappr_val
		from land_detail
		join #recalc_bcp_land_detail as tld with(nolock) on
			land_detail.prop_id = tld.prop_id and
			land_detail.prop_val_yr = tld.prop_val_yr and
			land_detail.sup_num = tld.sup_num and
			land_detail.sale_id = tld.sale_id and
			land_detail.land_seg_id = tld.land_seg_id and
			tld.lRecalcBCPRowID >= @lMinBCPRowID and tld.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

