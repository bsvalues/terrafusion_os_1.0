
create procedure ArbitrationInsertEvent
	@lYear numeric(4,0),
	@lArbitrationID int,
	@szEventTypeCode varchar(10),
	@lPacsUserID int,
	@szEventComment varchar(500),
	@dtEvent datetime = null
as

set nocount on

	set @dtEvent = isnull(@dtEvent, getdate())

	insert arbitration_event (
		prop_val_yr, arbitration_id, event_cd, event_dt, pacs_user_id, event_comment
	) values (
		@lYear, @lArbitrationID, @szEventTypeCode, @dtEvent, @lPacsUserID, @szEventComment
	)

set nocount off

	select
		lEventID = @@identity, dtEvent = @dtEvent

GO

