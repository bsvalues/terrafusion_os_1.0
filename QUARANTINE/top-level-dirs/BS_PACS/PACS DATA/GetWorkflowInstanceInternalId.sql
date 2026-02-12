
CREATE PROCEDURE [dbo].[GetWorkflowInstanceInternalId]		@WorkflowInstanceId					uniqueidentifier
															,@ContextGuid						uniqueidentifier
															,@WorkflowInstanceInternalId		bigint				OUTPUT
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	DECLARE @error			int
			,@rowcount		int
			,@id			bigint

	SELECT			@WorkflowInstanceInternalId	= [WorkflowInstanceInternalId]
	FROM			[dbo].[WorkflowInstance]
	WHERE			[WorkflowInstanceId]		= @WorkflowInstanceId
	AND				[ContextGuid]				= @ContextGuid

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0
		return -1
	ELSE
		return 0

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetWorkflowInstanceInternalId] TO [tracking_writer]
    AS [dbo];


GO

