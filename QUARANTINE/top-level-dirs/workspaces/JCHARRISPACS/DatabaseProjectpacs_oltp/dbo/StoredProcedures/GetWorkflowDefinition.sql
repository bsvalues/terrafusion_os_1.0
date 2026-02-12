
CREATE PROCEDURE [dbo].[GetWorkflowDefinition]		@WorkflowInstanceInternalId		bigint
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetWorkflowDefinition_Failed nvarchar(256)
	set @localized_string_GetWorkflowDefinition_Failed = N'GetWorkflowDefinition failed.'

	DECLARE @error int, @ret int, @textsize int

	SELECT @textsize = @@TEXTSIZE

	SET TEXTSIZE 2147483647

	SELECT		[w].[WorkflowDefinition]
	FROM		[dbo].[vw_Workflow] [w]
	INNER JOIN	[dbo].[vw_WorkflowInstance] [wi]
	ON			[w].[WorkflowTypeId] = [wi].[WorkflowTypeId]
	WHERE		[wi].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0
	 BEGIN
		GOTO FAILED
	 END	
	
	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @localized_string_GetWorkflowDefinition_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	IF @textsize < 0
		SET TEXTSIZE 0
	ELSE
	 BEGIN
		DECLARE @str varchar(64)
		SELECT @str = 'SET TEXTSIZE ' + cast( @textsize as varchar(32) )
		EXEC( @str )
	 END

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetWorkflowDefinition] TO [tracking_reader]
    AS [dbo];


GO

