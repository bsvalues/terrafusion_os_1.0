

create procedure LitigationInsertEvent
	@lLitigationID int,
	@szEventCode varchar(10),
	@szDescription varchar(255),
	@lPacsUserID int,
	@dtEvent datetime = null,
	@lEventID int = null output,
	@bOutputRS bit = 1
as

set nocount on

	set @dtEvent = isnull(@dtEvent, getdate())

	insert litigation_events with(rowlock) (
		litigation_id, event_cd, event_dt, event_description, pacs_user_id
	) values (
		@lLitigationID, @szEventCode, @dtEvent, @szDescription, @lPacsUserID
	)
	set @lEventID = @@identity

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select litigation_event_id = @lEventID
	end

GO

