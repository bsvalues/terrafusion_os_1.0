
CREATE PROCEDURE [dbo].[GetUserEventsWithDetails]		@WorkflowInstanceInternalId		bigint
														,@BeginDateTime					datetime
														,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetUserEventsWithDetails_Failed_GetUserEvents nvarchar(256)
	set @localized_string_GetUserEventsWithDetails_Failed_GetUserEvents = N'GetUserEventsWithDetails failed calling GetUserEvents.'

	declare @localized_string_GetUserEventsWithDetails_Failed_GetUserEventAnnotations nvarchar(256)
	set @localized_string_GetUserEventsWithDetails_Failed_GetUserEventAnnotations = N'GetUserEventsWithDetails failed calling GetUserEventAnnotations.'

	declare @localized_string_GetUserEventsWithDetails_Failed_GetUserTrackingDataItems nvarchar(256)
	set @localized_string_GetUserEventsWithDetails_Failed_GetUserTrackingDataItems = N'GetUserEventsWithDetails failed calling GetUserTrackingDataItems.'

	declare @localized_string_GetUserEventsWithDetails_Failed_GetUserTrackingDataItemAnnotations nvarchar(256)
	set @localized_string_GetUserEventsWithDetails_Failed_GetUserTrackingDataItemAnnotations = N'GetUserEventsWithDetails failed calling GetUserTrackingDataItemAnnotations.'


	DECLARE @ret int, @error_desc nvarchar(256), @error int

	EXEC @ret = [dbo].[GetUserEvents] 				@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
													,@BeginDateTime = @BeginDateTime
													,@EndDateTime = @EndDateTime

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetUserEventsWithDetails_Failed_GetUserEvents
		GOTO FAILED
	 END
	

	EXEC @ret = [dbo].[GetUserEventAnnotations] 	@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
													,@BeginDateTime = @BeginDateTime
													,@EndDateTime = @EndDateTime

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetUserEventsWithDetails_Failed_GetUserEventAnnotations
		GOTO FAILED
	 END
		

	EXEC @ret = [dbo].[GetUserTrackingDataItems]			@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
													,@BeginDateTime = @BeginDateTime
													,@EndDateTime = @EndDateTime

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetUserEventsWithDetails_Failed_GetUserTrackingDataItems
		GOTO FAILED
	 END
	
	EXEC @ret = [dbo].[GetUserTrackingDataItemAnnotations]	@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
													,@BeginDateTime = @BeginDateTime
													,@EndDateTime = @EndDateTime

	
	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetUserEventsWithDetails_Failed_GetUserTrackingDataItemAnnotations
		GOTO FAILED
	 END
	
	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetUserEventsWithDetails] TO [tracking_reader]
    AS [dbo];


GO

