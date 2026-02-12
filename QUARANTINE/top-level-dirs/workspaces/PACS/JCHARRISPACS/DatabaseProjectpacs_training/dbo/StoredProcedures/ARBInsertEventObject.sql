


create procedure ARBInsertEventObject
	@lEventID int,
	@szObjectPath varchar(512),
	@szObjectDesc varchar(512),
	@lPacsUserID int,
	@dtObject datetime = NULL
as

set nocount on

	set @dtObject = isnull(@dtObject, getdate())

	insert _arb_event_object (
		lEventID, dtObject, szObjectPath, szObjectDesc, lPacsUserID
	) values (
		@lEventID, @dtObject, @szObjectPath, @szObjectDesc, @lPacsUserID
	)

set nocount off

	select
		lObjectID = @@identity,
		dtObject = @dtObject

GO

