

create procedure LitigationInsertEventObject
	@lLitigationEventID int,
	@lPacsUserID int,
	@szObjectPath varchar(512),
	@szObjectDesc varchar(512),
	@dtCreated datetime = null,
	@lLitigationEventObjectID int = null output,
	@bOutputRS bit = 1
as

set nocount on

	if ( @dtCreated is null )
	begin
		set @dtCreated = getdate()
	end

	insert litigation_event_objects (
		litigation_event_id, date_created, pacs_user_id, object_path, object_desc
	) values (
		@lLitigationEventID, @dtCreated, @lPacsUserID, @szObjectPath, @szObjectDesc
	)
	set @lLitigationEventObjectID = @@identity

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select litigation_event_object_id = @lLitigationEventObjectID
	end

GO

