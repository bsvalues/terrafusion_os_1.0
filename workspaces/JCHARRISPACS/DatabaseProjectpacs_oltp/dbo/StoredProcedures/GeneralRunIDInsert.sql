
create procedure GeneralRunIDInsert
	@szProcessName varchar(23),
	@lPacsUserID int,

	@bRecordset bit = 0,
	@lGeneralRunID int = null output
as

set nocount on

	insert dbo.general_run_id (szProcessName, dtRun, lPacsUserID)
	values (@szProcessName, getdate(), @lPacsUserID)

	set @lGeneralRunID = scope_identity()

set nocount off

	if ( @bRecordset = 1 )
	begin
		select lGeneralRunID = @lGeneralRunID
	end

	return(@lGeneralRunID)

GO

