
CREATE PROCEDURE [dbo].[CreatePartition]	@PartitionSetName varchar(32), @PartitionInterval char(1)
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_CreatePartition_Failed nvarchar(256)
	set @localized_string_CreatePartition_Failed = N'CreatePartition failed'

	declare @localized_string_CreatePartition_Failed_CreatingTables nvarchar(256)
	set @localized_string_CreatePartition_Failed_CreatingTables = N'CreatePartition failed creating the tables for the new partition.'

	declare @localized_string_CreatePartition_Failed_InsertingPartitionName nvarchar(256)
	set @localized_string_CreatePartition_Failed_InsertingPartitionName = N'CreatePartition failed inserting into TrackingPartitionSetName.'

	declare @localized_string_CreatePartition_Failed_UpdatingPartitionEnd nvarchar(256)
	set @localized_string_CreatePartition_Failed_UpdatingPartitionEnd = N'CreatePartition failed updating the end time for the previous partition.'

	declare @localized_string_CreatePartition_Failed_RebuildPartitionViews nvarchar(256)
	set @localized_string_CreatePartition_Failed_RebuildPartitionViews = N'CreatePartition failed rebuilding the partitioned views.'

	DECLARE	@stmt1 varchar(8000), @stmt2 varchar(8000)
	SELECT	@stmt1 = 			
			'	
			CREATE TABLE [dbo].[WorkflowInstance_' + @PartitionSetName + ']
			(
				[WorkflowInstanceInternalId] bigint				NOT NULL	CONSTRAINT [pk_WorkflowInstance_' + @PartitionSetName + '_WorkflowInstanceInternalId] PRIMARY KEY CLUSTERED
				,[WorkflowInstanceId]		uniqueidentifier	NOT NULL
				,[ContextGuid]				uniqueidentifier	NOT NULL
				,[CallerInstanceId]			uniqueidentifier	NULL
				,[CallPath]					nvarchar(400)		NULL
				,[CallerContextGuid]		uniqueidentifier	NULL
				,[CallerParentContextGuid]	uniqueidentifier	NULL
				,[WorkflowTypeId]			int					NOT NULL
				,[InitializedDateTime]		datetime			NOT NULL
				,[DbInitializedDateTime]	datetime			NOT NULL
				,[EndDateTime]				datetime			NOT NULL -- Not null because only inactive instance should be in partition tables
				,[DbEndDateTime]			datetime			NOT NULL -- Not null because only inactive instance should be in partition tables
			)			
			CREATE NONCLUSTERED INDEX [idx_WorkflowInstance_' + @PartitionSetName + '_WorkflowInstanceId_ContextGuid] ON [dbo].[WorkflowInstance_' + @PartitionSetName + ']([WorkflowInstanceId],[ContextGuid])
			CREATE TABLE [dbo].[ActivityInstance_' + @PartitionSetName + ']
			(
				[WorkflowInstanceInternalId]	bigint				NOT NULL
				,[ActivityInstanceId]			bigint				NOT NULL	CONSTRAINT [pk_ActivityInstance_' + @PartitionSetName + '_ActivityInstanceId] PRIMARY KEY CLUSTERED
				,[QualifiedName]				nvarchar(128)		NOT NULL	
				,[ContextGuid]					uniqueidentifier	NOT NULL
				,[ParentContextGuid]			uniqueidentifier	NULL
				,[WorkflowInstanceEventId]		bigint				NULL
			)			
			CREATE NONCLUSTERED INDEX [idx_ActivityInstance_' + @PartitionSetName + '_WorkflowInstanceInternalId_QualifiedName_ContextGuid_ParentContextGuid] ON [dbo].[ActivityInstance_' + @PartitionSetName + ']([WorkflowInstanceInternalId],[QualifiedName],[ContextGuid],[ParentContextGuid])			
			CREATE TABLE [dbo].[ActivityExecutionStatusEvent_' + @PartitionSetName + ']
			(
				[ActivityExecutionStatusEventId] bigint				NOT NULL
				,[WorkflowInstanceInternalId]	bigint				NOT NULL	
				,[EventOrder]					int					NOT NULL
				,[ActivityInstanceId]			bigint				NOT NULL	
				,[ExecutionStatusId]			tinyint				NOT NULL
				,[EventDateTime]				datetime			NOT NULL
				,[DbEventDateTime]				datetime			NOT NULL
			)			
			CREATE NONCLUSTERED INDEX [idx_ActivityExecutionStatusEvent_' + @PartitionSetName + '_ActivityInstanceId_EventOrder] ON [dbo].[ActivityExecutionStatusEvent_' + @PartitionSetName + ']( [ActivityInstanceId], [EventOrder] )			
			CREATE TABLE [dbo].[UserEvent_' + @PartitionSetName + ']
			(
				[UserEventId]					bigint			NOT NULL
				,[WorkflowInstanceInternalId]	bigint			NOT NULL	
				,[EventOrder]					int				NOT NULL
				,[ActivityInstanceId]			bigint			NOT NULL
				,[EventDateTime]				datetime		NOT NULL
				,[UserDataKey]					nvarchar(512)	NULL
				,[UserDataTypeId]				int				NULL
				,[UserData_Str]					nvarchar(512)	NULL
				,[UserData_Blob]				image			NULL
				,[UserDataNonSerializable]		bit				NOT NULL
				,[DbEventDateTime]				datetime		NOT NULL
			)
			CREATE TABLE [dbo].[WorkflowInstanceEvent_' + @PartitionSetName + ']
			(
				[WorkflowInstanceEventId]		bigint			NOT NULL		CONSTRAINT [pk_WorkflowInstanceEvent_' + @PartitionSetName + '_WorkflowInstanceEventId] PRIMARY KEY CLUSTERED
				,[WorkflowInstanceInternalId]	bigint			NOT NULL
				,[TrackingWorkflowEventId]				tinyint			NOT NULL
				,[EventDateTime]				datetime		NOT NULL
				,[EventOrder]					int				NOT NULL
				,[EventArgTypeId]					int				NULL
				,[EventArg]							image			NULL
				,[DbEventDateTime]				datetime			NOT NULL
			)'
	SELECT @stmt2 = 
			'
			CREATE TABLE [dbo].[TrackingDataItem_' + @PartitionSetName + ']
			(
				[TrackingDataItemId]					bigint			NOT NULL	CONSTRAINT [pk_TrackingDataItem_' + @PartitionSetName + '_TrackingDataItemId] PRIMARY KEY CLUSTERED 
				,[WorkflowInstanceInternalId]	bigint			NOT NULL
				,[EventId]					bigint				NOT NULL
				,[EventTypeId]				char(1)				NOT NULL
				,[FieldName]						nvarchar(256)	NOT NULL
				,[FieldTypeId]						int				NULL
				,[Data_Str]						nvarchar(512)	NULL
				,[Data_Blob]					image			NULL
				,[DataNonSerializable]			bit				NOT NULL
			)			
			CREATE NONCLUSTERED INDEX [idx_TrackingDataItem_' + @PartitionSetName + '_WorkflowInstanceInternalId_EventId_EventTypeId] ON [dbo].[TrackingDataItem_' + @PartitionSetName + ']( [WorkflowInstanceInternalId], [EventId], [EventTypeId] )			
			CREATE TABLE [dbo].[TrackingDataItemAnnotation_' + @PartitionSetName + ']
			(
				[TrackingDataItemId]					bigint			NOT NULL
				,[WorkflowInstanceInternalId]	bigint			NOT NULL
				,[Annotation]					nvarchar(1024)	NOT NULL		
			)			
			CREATE CLUSTERED INDEX [idx_TrackingDataItemAnnotation_' + @PartitionSetName + '_TrackingDataItemId] ON [dbo].[TrackingDataItemAnnotation_' + @PartitionSetName + ']( [TrackingDataItemId] )			
			CREATE TABLE [dbo].[EventAnnotation_' + @PartitionSetName + ']
			(
				[WorkflowInstanceInternalId]	bigint			NOT NULL
				,[EventId]						bigint			NOT NULL
				,[EventTypeId]					char(1)			NOT NULL
				,[Annotation]					nvarchar(1024)	NULL		
			)			
			CREATE CLUSTERED INDEX [idx_EventAnnotation_' + @PartitionSetName + '_WorkflowInstanceInternalId] ON [dbo].[EventAnnotation_' + @PartitionSetName + ']( [WorkflowInstanceInternalId] )			
			CREATE NONCLUSTERED INDEX [idx_EventAnnotation_' + @PartitionSetName + '_EventId_EventTypeId] ON [dbo].[EventAnnotation_' + @PartitionSetName + ']( [EventId], [EventTypeId] )			
	
			CREATE TABLE [dbo].[AddedActivity_' + @PartitionSetName + ']
			(
				[WorkflowInstanceInternalId]	bigint				NOT NULL
				,[WorkflowInstanceEventId]		bigint				NOT NULL
				,[QualifiedName]				nvarchar(128)		NOT NULL
				,[ActivityTypeId]				int					NOT NULL
				,[ParentQualifiedName]			nvarchar(128)		NULL	
				,[AddedActivityAction]			nvarchar(2000)		NULL
				,[Order]						int					NULL
			)			
			CREATE TABLE [dbo].[RemovedActivity_' + @PartitionSetName + ']
			(
				[WorkflowInstanceInternalId]	bigint				NOT NULL
				,[WorkflowInstanceEventId]		bigint				NOT NULL
				,[QualifiedName]				nvarchar(128)		NOT NULL
				,[ParentQualifiedName]			nvarchar(128)		NULL
				,[RemovedActivityAction]		nvarchar(2000)		NULL
				,[Order]						int					NULL
			)
	' 

	-- Build the new tables
	EXEC ( @stmt1 + @stmt2 )

	IF @@ERROR <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_CreatePartition_Failed_CreatingTables
		GOTO FAILED
	 END

	-- Update the end date of the previous partition
	UPDATE [dbo].[TrackingPartitionSetName] SET [EndDateTime] = getutcdate() WHERE [EndDateTime] IS NULL

	SELECT @error = @@ERROR, @rowcount = @@ROWCOUNT

	IF @error IS NULL OR @error <> 0 OR @rowcount IS NULL OR @rowcount > 1
	 BEGIN
		SELECT @error_desc = @localized_string_CreatePartition_Failed_UpdatingPartitionEnd
		GOTO FAILED
	 END
	
	-- Insert a record for the new partition
	DECLARE	@pId int
	INSERT [dbo].[TrackingPartitionSetName] ( [Name], [PartitionInterval] )  VALUES ( @PartitionSetName, @PartitionInterval )

	SELECT @pId = @@IDENTITY, @error = @@ERROR

	IF @pId IS NULL OR @error IS NULL OR @error <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_CreatePartition_Failed_InsertingPartitionName
		GOTO FAILED
	 END
	
	-- Rebuild the views
	EXEC @ret = [dbo].[RebuildPartitionViews]

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_CreatePartition_Failed_RebuildPartitionViews
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
    ON OBJECT::[dbo].[CreatePartition] TO [tracking_writer]
    AS [dbo];


GO

