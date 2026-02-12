
CREATE PROCEDURE [dbo].[DropPartition] @PartitionName varchar(32) = NULL, @PartitionId int = NULL
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_DropPartition_Failed nvarchar(256)
	set @localized_string_DropPartition_Failed = N'TrackingPartition_RebuildPartition failed.'
		
	declare @localized_string_DropPartition_Failed_DetachPartition nvarchar(256)
	set @localized_string_DropPartition_Failed_DetachPartition = N'TrackingPartition_RebuildPartition failed calling DetachPartition.'
		
	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int
	
	IF @@TRANCOUNT = 0
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END
	ELSE
	 BEGIN		
		SELECT @local_tran = 0
	 END

	-- Detach the partition and rebuild the views
	EXEC @ret = [dbo].[DetachPartition] @PartitionId = @PartitionId, @PartitionName = @PartitionName OUT

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_DropPartition_Failed_DetachPartition
		GOTO FAILED
	 END

	-- Tables are no longer part of the views, drop them
	EXEC( '
	IF OBJECT_ID(''[dbo].[AddedActivity_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[AddedActivity_' + @PartitionName +']' )
	
	EXEC( '
	IF OBJECT_ID(''[dbo].[RemovedActivity_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[RemovedActivity_' + @PartitionName +']' )
	
	EXEC( '	
	IF OBJECT_ID(''[dbo].[TrackingDataItemAnnotation_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[TrackingDataItemAnnotation_' + @PartitionName +']' )
	
	EXEC( '
	IF OBJECT_ID(''[dbo].[EventAnnotation_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[EventAnnotation_' + @PartitionName +']' )
	
	EXEC( '
	IF OBJECT_ID(''[dbo].[TrackingDataItem_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[TrackingDataItem_' + @PartitionName +']' )

	EXEC( '	
	IF OBJECT_ID(''[dbo].[ActivityExecutionStatusEvent_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[ActivityExecutionStatusEvent_' + @PartitionName +']' )
	
	EXEC( '
	IF OBJECT_ID(''[dbo].[UserEvent_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[UserEvent_' + @PartitionName +']' )
	
	EXEC( '
	IF OBJECT_ID(''[dbo].[ActivityInstance_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[ActivityInstance_' + @PartitionName +']' )
	
	EXEC( '
	IF OBJECT_ID(''[dbo].[WorkflowInstanceEvent_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[WorkflowInstanceEvent_' + @PartitionName +']' )
	
	EXEC( '
	IF OBJECT_ID(''[dbo].[WorkflowInstance_' + @PartitionName +']'') IS NOT NULL
		DROP TABLE [dbo].[WorkflowInstance_' + @PartitionName +']' )



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
    ON OBJECT::[dbo].[DropPartition] TO [tracking_writer]
    AS [dbo];


GO

