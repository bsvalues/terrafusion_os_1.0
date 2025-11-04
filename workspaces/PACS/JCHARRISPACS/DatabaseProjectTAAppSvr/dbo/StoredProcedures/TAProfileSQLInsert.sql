
create procedure TAProfileSQLInsert
	@l64TransactionQueueID bigint,
	@lSPID int,
	@dtBegin datetime,
	@dtEnd datetime,
	@szSQL text,
	@szError text
as
set nocount on

	insert tb_ta_profile_sql (l64TransactionQueueID, lSPID, dtBegin, dtEnd, szSQL, szError)
	values (@l64TransactionQueueID, @lSPID, @dtBegin, @dtEnd, @szSQL, @szError)

GO

