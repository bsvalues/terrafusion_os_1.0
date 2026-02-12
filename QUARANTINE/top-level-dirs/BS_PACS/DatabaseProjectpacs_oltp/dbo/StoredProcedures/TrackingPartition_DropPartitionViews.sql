
CREATE PROCEDURE [dbo].[TrackingPartition_DropPartitionViews]
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_TrackingPartition_DropPartitionViews_Failed nvarchar(256)
	set @localized_string_TrackingPartition_DropPartitionViews_Failed = N'RebuildPartitionViews failed'
		
	IF OBJECT_ID('[dbo].[vw_AddedActivity]') IS NOT NULL
		DROP VIEW [dbo].[vw_AddedActivity]
	
	IF OBJECT_ID('[dbo].[vw_RemovedActivity]') IS NOT NULL
		DROP VIEW [dbo].[vw_RemovedActivity]
	
	IF OBJECT_ID('[dbo].[vw_TrackingDataItemAnnotation]') IS NOT NULL
		DROP VIEW [dbo].[vw_TrackingDataItemAnnotation]
	
	IF OBJECT_ID('[dbo].[vw_EventAnnotation]') IS NOT NULL
		DROP VIEW [dbo].[vw_EventAnnotation]
	
	IF OBJECT_ID('[dbo].[vw_TrackingDataItem]') IS NOT NULL
		DROP VIEW [dbo].[vw_TrackingDataItem]
	
	IF OBJECT_ID('[dbo].[vw_ActivityExecutionStatusEvent]') IS NOT NULL
		DROP VIEW [dbo].[vw_ActivityExecutionStatusEvent]
	
	IF OBJECT_ID('[dbo].[vw_UserEvent]') IS NOT NULL
		DROP VIEW [dbo].[vw_UserEvent]
	
	IF OBJECT_ID('[dbo].[vw_ActivityInstance]') IS NOT NULL
		DROP VIEW [dbo].[vw_ActivityInstance]
	
	IF OBJECT_ID('[dbo].[vw_WorkflowInstanceEvent]') IS NOT NULL
		DROP VIEW [dbo].[vw_WorkflowInstanceEvent]
	
	IF OBJECT_ID('[dbo].[vw_WorkflowInstance]') IS NOT NULL
		DROP VIEW [dbo].[vw_WorkflowInstance]
	

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
    ON OBJECT::[dbo].[TrackingPartition_DropPartitionViews] TO [tracking_writer]
    AS [dbo];


GO

