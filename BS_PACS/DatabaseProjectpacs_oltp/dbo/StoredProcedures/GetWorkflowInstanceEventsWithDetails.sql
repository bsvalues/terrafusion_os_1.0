
CREATE PROCEDURE [dbo].[GetWorkflowInstanceEventsWithDetails]		@WorkflowInstanceInternalId		bigint
														,@BeginDateTime					datetime
														,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetWorkflowInstanceEventsWithDetails_Failed_GetWorkflowInstanceEvents nvarchar(256)
	set @localized_string_GetWorkflowInstanceEventsWithDetails_Failed_GetWorkflowInstanceEvents = N'GetWorkflowInstanceEventsWithDetails failed calling GetWorkflowInstanceEvents.'

	declare @localized_string_GetWorkflowInstanceEventsWithDetails_Failed_GetWorkflowInsertEventAnnotations nvarchar(256)
	set @localized_string_GetWorkflowInstanceEventsWithDetails_Failed_GetWorkflowInsertEventAnnotations = N'GetWorkflowInstanceEventsWithDetails failed calling GetWorkflowInsertEventAnnotations.'


	DECLARE @ret int, @error_desc nvarchar(256), @error int

	EXEC @ret = [dbo].[GetWorkflowInstanceEvents] 		@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
														,@BeginDateTime = @BeginDateTime
														,@EndDateTime = @EndDateTime

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetWorkflowInstanceEventsWithDetails_Failed_GetWorkflowInstanceEvents
		GOTO FAILED
	 END
	

	EXEC @ret = [dbo].[GetWorkflowInsertEventAnnotations] 	@WorkflowInstanceInternalId = @WorkflowInstanceInternalId
														,@BeginDateTime = @BeginDateTime
														,@EndDateTime = @EndDateTime

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetWorkflowInstanceEventsWithDetails_Failed_GetWorkflowInsertEventAnnotations
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
    ON OBJECT::[dbo].[GetWorkflowInstanceEventsWithDetails] TO [tracking_reader]
    AS [dbo];


GO

