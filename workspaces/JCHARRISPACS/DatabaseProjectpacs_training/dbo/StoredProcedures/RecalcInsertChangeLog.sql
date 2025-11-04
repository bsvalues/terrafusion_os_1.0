
create procedure RecalcInsertChangeLog
	@szBCPFile varchar(512),
	@lPacsUserID int,
	@dtChange datetime
as

set nocount on

	declare @szSQL varchar(512)

	set @szSQL = 'bulk insert #recalc_bcp_market_value_change from ''' + @szBCPFile + ''' with (maxerrors = 0, tablock)'
	exec(@szSQL)

	declare
		@lPropID int,
		@lYear numeric(4,0),
		@lSupNum int,
		@lMarketOld numeric(14,0),
		@lMarketNew numeric(14,0)

	declare
		@lChangeID int,
		@szOldValue varchar(255),
		@szNewValue varchar(255),
		@szRefID varchar(255)

	declare curMarketValueChangedProps cursor
	for
		select prop_id, prop_val_yr, sup_num, market_old, market_new
		from #recalc_bcp_market_value_change
		order by 1 asc, 2 asc, 3 asc
	for read only

	open curMarketValueChangedProps
	fetch next from curMarketValueChangedProps into @lPropID, @lYear, @lSupNum, @lMarketOld, @lMarketNew

	while ( @@fetch_status = 0 )
	begin
		set @szOldValue = convert(varchar(255), isnull(@lMarketOld, 0))
		set @szNewValue = convert(varchar(255), isnull(@lMarketNew, 0))
		
		set @szRefID =
			'Property: ' + convert(varchar(12), @lPropID) + '-' +
			convert(varchar(4), @lYear) + '-' +
			convert(varchar(12), @lSupNum)

		insert change_log with(rowlock) (
			lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType,
			iTableID, iColumnID, szOldValue, szNewValue, szRefID
		) values (
			@lPacsUserID, system_user, host_name(), @dtChange, 'U',
			658, 3010, @szOldValue, @szNewValue, @szRefID
		)
		set @lChangeID = @@identity

		insert change_log_keys with(rowlock) (
			lChangeID, iColumnID, szKeyValue, lKeyValue
		) values (
			@lChangeID, 4026, @lPropID, @lPropID
		)
		insert change_log_keys with(rowlock) (
			lChangeID, iColumnID, szKeyValue, lKeyValue
		) values (
			@lChangeID, 4083, @lYear, @lYear
		)
		insert change_log_keys with(rowlock) (
			lChangeID, iColumnID, szKeyValue, lKeyValue
		) values (
			@lChangeID, 5002, @lSupNum, @lSupNum
		)

		fetch next from curMarketValueChangedProps into @lPropID, @lYear, @lSupNum, @lMarketOld, @lMarketNew
	end

	close curMarketValueChangedProps
	deallocate curMarketValueChangedProps

GO

