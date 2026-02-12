
CREATE PROCEDURE [dbo].[PartitionCompletedWorkflowInstances]
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int
			,@IID			bigint
			,@failed		bit

	declare @localized_string_PartitionCompletedWorkflowInstances_Failed nvarchar(256)
	set @localized_string_PartitionCompletedWorkflowInstances_Failed = N'PartitionCompletedWorkflowInstances failed'

	declare @localized_string_PartitionCompletedWorkflowInstances_Failed_OpenCursor nvarchar(256)
	set @localized_string_PartitionCompletedWorkflowInstances_Failed_OpenCursor = N'PartitionCompletedWorkflowInstances failed opening cursor'

	declare @localized_string_PartitionCompletedWorkflowInstances_Failed_Partition nvarchar(256)
	set @localized_string_PartitionCompletedWorkflowInstances_Failed_Partition = N'PartitionCompletedWorkflowInstances failed moving some workflow instances.'

	SELECT @failed = 0

	-- Get the instance that are ready to be moved to a completed partition
	-- It is important that this cursor is ordered oldest to most recent
	-- as the list may span multiple partitions.  Despite the fact that this is a batched
	-- activity we want to always maintain only one active partition to copy to.  
	-- All partitions that are not the most recent must be read-only.  
	-- The ordering of the cursor perserves this semantic.
	DECLARE iid_cursor INSENSITIVE CURSOR FOR
	SELECT 	[WorkflowInstanceInternalId]
	FROM	[dbo].[WorkflowInstance]
	WHERE	[EndDateTime] IS NOT NULL
	ORDER BY [EndDateTime] asc

	OPEN iid_cursor

	IF @@ERROR <> 0
	 BEGIN
		SET @error_desc = @localized_string_PartitionCompletedWorkflowInstances_Failed_OpenCursor
		GOTO FAILED
	 END

	FETCH NEXT FROM iid_cursor INTO @IID

	WHILE @@FETCH_STATUS = 0
	 BEGIN
		-- Each Workflow instance "batch" gets its own transaction
		BEGIN TRANSACTION

		EXEC @ret  = PartitionWorkflowInstance @WorkflowInstanceInternalId = @IID

		SELECT @error = @@ERROR

		IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
		 BEGIN
			ROLLBACK TRANSACTION
			SELECT @failed = 1
		 END
		ELSE
		 BEGIN
			COMMIT TRANSACTION
		 END

		FETCH NEXT FROM iid_cursor INTO @IID
	 END

	CLOSE iid_cursor
	DEALLOCATE iid_cursor

	IF @failed = 1
	 BEGIN
		SET @error_desc = @localized_string_PartitionCompletedWorkflowInstances_Failed_Partition
		GOTO FAILED
	 END
	ELSE
	 BEGIN
		SET @ret = 0
		GOTO DONE
	 END

FAILED:
	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[PartitionCompletedWorkflowInstances] TO [tracking_writer]
    AS [dbo];


GO

