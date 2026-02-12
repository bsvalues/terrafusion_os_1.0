
create procedure RecalcRowInsertChangeLog
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lMarketOld numeric(14,0),
	@lMarketNew numeric(14,0),
	@lPacsUserID int
as

set nocount on

	declare
		@lChangeID int,
		@szOldValue varchar(255),
		@szNewValue varchar(255),
		@szRefID varchar(255)

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
		@lPacsUserID, system_user, host_name(), getdate(), 'U',
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

GO

