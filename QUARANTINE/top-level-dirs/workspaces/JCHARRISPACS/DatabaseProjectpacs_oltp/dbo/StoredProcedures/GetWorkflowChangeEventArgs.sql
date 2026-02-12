
CREATE PROCEDURE [dbo].[GetWorkflowChangeEventArgs]		@WorkflowInstanceInternalId		bigint
														,@BeginDateTime					datetime
														,@WorkflowInstanceEventId		bigint
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetWorkflowChangeEventArgs_Failed nvarchar(256)
	set @localized_string_GetWorkflowChangeEventArgs_Failed = N'GetWorkflowChangeEventArgs failed.'

	declare @localized_string_GetWorkflowChangeEventArgs_Failed_GetDef nvarchar(256)
	set @localized_string_GetWorkflowChangeEventArgs_Failed_GetDef = N'GetWorkflowChangeEventArgs failed calling stored proceedure GetWorkflowDefinition.'

	declare @localized_string_GetWorkflowChangeEventArgs_Failed_GetChanges nvarchar(256)
	set @localized_string_GetWorkflowChangeEventArgs_Failed_GetChanges = N'GetWorkflowChangeEventArgs failed calling stored proceedure GetWorkflowChanges.'

	DECLARE @ret int, @error_desc nvarchar(256), @error int, @EventOrder int, @DbEventDateTime datetime
	--
	-- Get the base definition
	EXEC @ret = [dbo].[GetWorkflowDefinition]	@WorkflowInstanceInternalId	= @WorkflowInstanceInternalId

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetWorkflowChangeEventArgs_Failed_GetDef
		GOTO FAILED
	 END
	--
	-- Get changes
	SELECT		@EventOrder = [EventOrder]
				,@DbEventDateTime = [DbEventDateTime]
	FROM		[dbo].[WorkflowInstanceEvent] [wie]
	WHERE		[wie].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND			[wie].[WorkflowInstanceEventId] = @WorkflowInstanceEventId

	SELECT @error = @@ERROR 

	IF @error IS NULL OR @error <> 0 OR @EventOrder IS NULL OR @DbEventDateTime IS NULL
	 BEGIN
		SET @error_desc = @localized_string_GetWorkflowChangeEventArgs_Failed
		GOTO DONE
	 END
	

	EXEC @ret = [dbo].[GetWorkflowChanges]	@WorkflowInstanceInternalId	= @WorkflowInstanceInternalId
											,@BeginDateTime				= @BeginDateTime
											,@EndDateTime				= @DbEventDateTime
											,@MaxEventOrder				= @EventOrder

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_GetWorkflowChangeEventArgs_Failed_GetChanges
		GOTO FAILED
	 END
	
	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	IF OBJECT_ID('tempdb..#Changes') IS NOT NULL
		DROP TABLE #Changes	

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetWorkflowChangeEventArgs] TO [tracking_reader]
    AS [dbo];


GO

