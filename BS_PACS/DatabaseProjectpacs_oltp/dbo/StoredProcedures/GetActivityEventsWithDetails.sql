
CREATE PROCEDURE [dbo].[GetActivityEventsWithDetails]		@WorkflowInstanceInternalId		bigint
															,@BeginDateTime					datetime
															,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetActivityEventsWithDetails_Failed_GetActivityEvents nvarchar(256)
	set @localized_string_GetActivityEventsWithDetails_Failed_GetActivityEvents = N'GetActivityEventsWithDetails failed calling GetActivityEvents.'

	declare @localized_string_GetActivityEventsWithDetails_Failed_GetActivityEventAnnotations nvarchar(256)
	set @localized_string_GetActivityEventsWithDetails_Failed_GetActivityEventAnnotations = N'GetActivityEventsWithDetails failed calling GetActivityEventAnnotations.'

	declare @localized_string_GetActivityEventsWithDetails_Failed_GetActivityTrackingDataItems nvarchar(256)
	set @localized_string_GetActivityEventsWithDetails_Failed_GetActivityTrackingDataItems = N'GetActivityEventsWithDetails failed calling GetTrackingDataItems.'

	declare @localized_string_GetActivityEventsWithDetails_Failed_GetActivityTrackingDataItemAnnotations nvarchar(256)
	set @localized_string_GetActivityEventsWithDetails_Failed_GetActivityTrackingDataItemAnnotations = N'GetActivityEventsWithDetails failed calling GetActivityTrackingDataItemAnnotations.'


	DECLARE @ret int, @error_desc nvarchar(256), @error int

	EXEC @ret = [dbo].[GetActivityEvents] 		@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
												,@BeginDateTime = @BeginDateTime
												,@EndDateTime = @EndDateTime

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetActivityEventsWithDetails_Failed_GetActivityEvents
		GOTO FAILED
	 END

	EXEC @ret = [dbo].[GetActivityEventAnnotations] 		@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
															,@BeginDateTime = @BeginDateTime
															,@EndDateTime = @EndDateTime

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetActivityEventsWithDetails_Failed_GetActivityEventAnnotations
		GOTO FAILED
	 END
		

	EXEC @ret = [dbo].[GetActivityTrackingDataItems]			@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
														,@BeginDateTime = @BeginDateTime
														,@EndDateTime = @EndDateTime

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetActivityEventsWithDetails_Failed_GetActivityTrackingDataItems
		GOTO FAILED
	 END
	
	EXEC @ret = [dbo].[GetActivityTrackingDataItemAnnotations]	@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
														,@BeginDateTime = @BeginDateTime
														,@EndDateTime = @EndDateTime

	
	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetActivityEventsWithDetails_Failed_GetActivityTrackingDataItemAnnotations
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
    ON OBJECT::[dbo].[GetActivityEventsWithDetails] TO [tracking_reader]
    AS [dbo];


GO

