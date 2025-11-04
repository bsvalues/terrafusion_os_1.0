
CREATE PROCEDURE [dbo].[PartitionWorkflowInstance]	@WorkflowInstanceInternalId	bigint
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_PartitionWorkflowInstance_Failed nvarchar(256)
	set @localized_string_PartitionWorkflowInstance_Failed = N'PartitionWorkflowInstance failed'

	declare @localized_string_PartitionWorkflowInstance_Failed_Copy nvarchar(256)
	set @localized_string_PartitionWorkflowInstance_Failed_Copy = N'PartitionWorkflowInstance failed calling CopyWorkflowInstanceToPartition'

	declare @localized_string_PartitionWorkflowInstance_Failed_Delete nvarchar(256)
	set @localized_string_PartitionWorkflowInstance_Failed_Delete = N'PartitionWorkflowInstance failed calling DeleteWorkflowInstance'

	declare @localized_string_PartitionWorkflowInstance_Failed_Invalid nvarchar(256)
	set @localized_string_PartitionWorkflowInstance_Failed_Invalid = N'PartitionWorkflowInstance failed - @WorkflowInstanceInternalId is not an active workflow'

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END

	-- Check if the instance exists, if it does we own it until the tx is done
	IF NOT EXISTS ( SELECT 1 FROM [dbo].[WorkflowInstance] WITH ( XLOCK, HOLDLOCK ) WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId ) 
	 BEGIN
		SET @error_desc = @localized_string_PartitionWorkflowInstance_Failed_Invalid
		GOTO FAILED
	 END

	EXEC @ret = [dbo].[CopyWorkflowInstanceToPartition] @WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_PartitionWorkflowInstance_Failed_Copy
		GOTO FAILED
	 END

	EXEC @ret = [dbo].[DeleteWorkflowInstance] @WorkflowInstanceInternalId = @WorkflowInstanceInternalId

	IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SET @error_desc = @localized_string_PartitionWorkflowInstance_Failed_Delete
		GOTO FAILED
	 END

	IF @local_tran = 1
		COMMIT TRANSACTION

	SET @ret = 0
	GOTO DONE

FAILED:
	IF @local_tran = 1
		ROLLBACK TRANSACTION

	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[PartitionWorkflowInstance] TO [tracking_writer]
    AS [dbo];


GO

