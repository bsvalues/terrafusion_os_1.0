
CREATE PROCEDURE [dbo].[DeleteWorkflowInstance]	@WorkflowInstanceInternalId	bigint
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_DeleteWorkflowInstance_Failed nvarchar(256)
	set @localized_string_DeleteWorkflowInstance_Failed = N'DeleteWorkflowInstance failed'

	declare @localized_string_DeleteWorkflowInstance_Failed_No_Trans nvarchar(256)
	set @localized_string_DeleteWorkflowInstance_Failed_No_Trans = N'DeleteWorkflowInstance failed - a transaction is required.'

	IF @@TRANCOUNT = 0
	 BEGIN
		SET @error_desc = @localized_string_DeleteWorkflowInstance_Failed
		GOTO FAILED
	 END


	IF EXISTS ( SELECT 1 FROM [dbo].[TrackingDataItem] WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId )
	 BEGIN
		DELETE 		TrackingDataItemAnnotation
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	
		DELETE		TrackingDataItem
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	 END

	DELETE		EventAnnotation
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	DELETE		ActivityExecutionStatusEvent
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	DELETE		ActivityInstance
	FROM		ActivityInstance WITH (INDEX([idx_ActivityInstance_WorkflowInstanceInternalId]))
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	IF EXISTS ( SELECT 1 FROM [dbo].[UserEvent] WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId )
	 BEGIN
		DELETE		UserEvent
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	 END


	IF EXISTS ( SELECT 1 FROM [dbo].[WorkflowInstanceEvent] WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId AND TrackingWorkflowEventId=11 /* Changed */)
	 BEGIN
		DELETE		AddedActivity
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	
		DELETE		RemovedActivity
		WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
	 END

	DELETE		WorkflowInstanceEvent
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	DELETE		WorkflowInstance
	WHERE		WorkflowInstanceInternalId = @WorkflowInstanceInternalId
		
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
    ON OBJECT::[dbo].[DeleteWorkflowInstance] TO [tracking_writer]
    AS [dbo];


GO

