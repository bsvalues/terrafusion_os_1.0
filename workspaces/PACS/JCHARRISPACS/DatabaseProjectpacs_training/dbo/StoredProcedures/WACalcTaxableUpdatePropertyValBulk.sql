
create procedure WACalcTaxableUpdatePropertyValBulk
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	truncate table #taxable_bcp_wash_property_val
	
	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #taxable_bcp_wash_property_val
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
		update wpv
		set
			wpv.appraised_classified = twpv.appraised_classified,
			wpv.appraised_non_classified = twpv.appraised_non_classified,
			wpv.snr_imprv = twpv.snr_imprv,
			wpv.snr_land = twpv.snr_land,
			wpv.snr_new_val = twpv.snr_new_val,
			wpv.snr_qualify_yr = twpv.snr_qualify_yr,
			wpv.snr_frz_imprv_hs = twpv.snr_frz_imprv_hs,
			wpv.snr_frz_land_hs = twpv.snr_frz_land_hs,
			wpv.snr_taxable_portion = twpv.snr_taxable_portion,
			wpv.snr_exempt_loss = twpv.snr_exempt_loss,
			wpv.snr_portion_applied = twpv.snr_portion_applied,
			wpv.snr_imprv_lesser = twpv.snr_imprv_lesser,
			wpv.snr_land_lesser = twpv.snr_land_lesser
		from wash_property_val as wpv
		join #taxable_bcp_wash_property_val as twpv with(nolock) on
			twpv.prop_val_yr = wpv.prop_val_yr and
			twpv.sup_num = wpv.sup_num and
			twpv.prop_id = wpv.prop_id and
			twpv.lBCPRowID >= @lMinBCPRowID and twpv.lBCPRowID <= @lMaxBCPRowID
		where wpv.tsRowVersion <= @tsRowVersion

		update pv
		set
			pv.recalc_flag = 'E'
		from property_val as pv
		join #taxable_bcp_wash_property_val as twpv with(nolock) on
			twpv.prop_val_yr = pv.prop_val_yr and
			twpv.sup_num = pv.sup_num and
			twpv.prop_id = pv.prop_id and
			twpv.set_recalc_error = 1 and
			twpv.lBCPRowID >= @lMinBCPRowID and twpv.lBCPRowID <= @lMaxBCPRowID
		where pv.tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

