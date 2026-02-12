
CREATE PROCEDURE [dbo].[GetPartitionSetNameForWorkflowInstance] @WorkflowInstanceInternalId bigint, @PartitionSetName nvarchar(32) OUTPUT
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed = N'GetPartitionSetNameForWorkflowInstance failed'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_Interval_Sel nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_Interval_Sel = N'GetPartitionSetNameForWorkflowInstance failed selecting the partition interval.'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_Invalid_Interval nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_Invalid_Interval = N'GetPartitionSetNameForWorkflowInstance failed - invalid partition interval.'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_BuildPartitionSet nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_BuildPartitionSet = N'GetPartitionSetNameForWorkflowInstance failed calling CreatePartition.'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_InvalidPartitionSet nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_InvalidPartitionSet = N'GetPartitionSetNameForWorkflowInstance failed - partition is not active and rollover period has ended.'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_InvalidInternalId nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_InvalidInternalId = N'GetPartitionSetNameForWorkflowInstance failed - @WorkflowInstanceInternalId %s is not valid or EndDateTime is null.'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_EndDateReset nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_EndDateReset = N'GetPartitionSetNameForWorkflowInstance failed resetting the partition''s end date.'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_MultipleActive nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_MultipleActive = N'GetPartitionSetNameForWorkflowInstance failed - there are multiple partitions with a null end date.'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_No_Trans nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_No_Trans = N'GetPartitionSetNameForWorkflowInstance failed - a transaction is required.'

	declare @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_PreviousPartition nvarchar(256)
	set @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_PreviousPartition = N'GetPartitionSetNameForWorkflowInstance failed - the partition cannot be created because a more recent partition exists for the specified interval.'

	IF @@TRANCOUNT = 0
	 BEGIN
		SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_No_Trans
		GOTO FAILED
	 END

	DECLARE @interval char

	-- Get the current interval and don't let anyone change it while we're doing work
	SELECT 	@interval = [Interval]
	FROM	[dbo].[TrackingPartitionInterval]

	SELECT 	@error = @@ERROR
			,@rowcount = @@ROWCOUNT

	IF @error <> 0 OR @rowcount <> 1 OR @interval IS NULL
	 BEGIN
		SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_Interval_Sel
		GOTO FAILED
	 END

	DECLARE @Date datetime

	SELECT @Date = [EndDateTime] FROM [dbo].[WorkflowInstance] WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId

	IF @Date IS NULL
	 BEGIN
		SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_InvalidInternalId
		GOTO FAILED
	 END

	-- Get the suffix for the current partition set
	IF @interval in ( 'd' ) -- daily
		SELECT @PartitionSetName = cast( datepart( yyyy, @Date ) as varchar ) + '_' + cast( datepart( mm, @Date ) as varchar ) + '_' + cast( datepart( ww, @Date ) as varchar ) + '_' + cast( datepart( dd, @Date ) as varchar )
	ELSE IF @interval in ( 'w' ) -- weekly
		SELECT @PartitionSetName = cast( datepart( yyyy, @Date ) as varchar ) + '_' + cast( datepart( mm, @Date ) as varchar ) + '_' + cast( datepart( ww, @Date ) as varchar )
	ELSE IF @interval in ( 'm' ) -- monthly
		SELECT @PartitionSetName = cast( datepart( yyyy, @Date ) as varchar ) + '_' + cast( datepart( mm, @Date ) as varchar )
	ELSE IF @interval in ( 'y' ) -- yearly
		SELECT @PartitionSetName = cast( datepart( yyyy, @Date ) as varchar )
	ELSE
	 BEGIN
		SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_Invalid_Interval
		GOTO FAILED
	 END

	-- If we touch the TrackPartitionSetName table in the following section this flag is set
	-- If it is set we perform an assert to ensure that the table is in a valid state before we exit.
	DECLARE @validate bit
	SELECT @validate = 0

	-- Check if this partition exists.
	-- Just use a normal read lock as the common case is that the partition will exist.
	-- The read lock will be blocked by the xlock below if we're in the middle of adding a partition.
	IF NOT EXISTS ( SELECT	1 
					FROM 	[dbo].[TrackingPartitionSetName] 
					WHERE 	[Name] = @PartitionSetName 
					AND 	[PartitionInterval] = @interval )
	 BEGIN
		SELECT @validate = 1
		-- Check again with an xlock on the table held through the end of the tx
		IF NOT EXISTS ( SELECT	1 
						FROM 	[dbo].[TrackingPartitionSetName] 
						WITH 	( XLOCK, TABLOCKX, HOLDLOCK ) 
						WHERE 	[Name] = @PartitionSetName 
						AND 	[PartitionInterval] = @interval )
		 BEGIN
			-- Make sure we're not creating a previous partition - this isn't valid
			IF EXISTS ( SELECT 	1 
						FROM 	[dbo].[TrackingPartitionSetName]
						WHERE	[PartitionInterval] = @interval
						AND		[CreatedDateTime] > @Date )
			 BEGIN
				SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_PreviousPartition
				GOTO FAILED
			 END
			-- Build the tables for this partition and rebuild the partition views
			EXEC @ret = [dbo].[CreatePartition] @PartitionSetName, @interval
	
			IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 
			 BEGIN
				SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_BuildPartitionSet
				GOTO FAILED
		 	 END
		 END
	 END
	ELSE
	 BEGIN
		-- Partition exists, validate it
		DECLARE @created datetime, @end datetime
		SELECT 	@created = [CreatedDateTime]
				,@end = [EndDateTime]
		FROM 	[dbo].[TrackingPartitionSetName] 
		WHERE 	[Name] = @PartitionSetName
		-- If EndDateTime for this partition is null (common case) we're valid
		IF @end IS NOT NULL 
		 BEGIN 
			-- There can only be one active partition and this isn't it (EndDateTime has been set)
			-- Two conditions where this is valid:
			-- 1. There is a race between the create new partition branch and this branch wherein
			-- we can create a new partition and deactivate the current while trying to insert into the current.
			-- No corruption will result, the only issue is trying to insert into a logically read-only table.
			-- Instead of adding another layer of locking we allow a rollover time buffer
			-- during which it is OK to continue inserting into the active-1 partition.
			-- 2. It's possible that if the interval is changed (w->m->w) we might end up writing into 
			-- a partition that was previously inactive.  This is valid but we need to reset the end date.
			SELECT 	@rowcount = count(1) 
			FROM 	[dbo].[TrackingPartitionSetName] 
			WHERE 	[PartitionInterval] = @interval
			AND		[CreatedDateTime] > @created

			IF @rowcount <> 0
			 BEGIN 
				-- Case 1
				-- We have a partition with the same interval value ahead of the one we are trying to insert into.
				-- We can insert only if this is the active-1 partition and if we are within the rollover time period.
				DECLARE @dt datetime
				SELECT @dt = getutcdate()

				IF @rowcount > 1 OR dateadd( hour, 1, @end ) < @dt
				 BEGIN
					SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_InvalidPartitionSet
					GOTO FAILED
				 END
			 END
			ELSE
			 BEGIN
				SELECT @validate = 1
				UPDATE [dbo].[TrackingPartitionSetName] SET [EndDateTime] = NULL WHERE [Name] = @PartitionSetName 
	
				IF @@ERROR <> 0
				 BEGIN
					SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_EndDateReset
					GOTO FAILED
				 END
	
				-- Also set the end date for the previously current partition
				UPDATE [dbo].[TrackingPartitionSetName] SET [EndDateTime] = getutcdate() WHERE [EndDateTime] IS NULL
	
				IF @@ERROR <> 0
				 BEGIN
					SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_EndDateReset
					GOTO FAILED
				 END
			 END
		 END -- @end null check
	 END -- Partitions exists branch

	-- If we created a partition or messed with end dates assert that there is still only one active partition
	IF @validate = 1
	 BEGIN
		SELECT @rowcount = count(1) FROM [dbo].[TrackingPartitionSetName] WHERE [EndDateTime] IS NULL
		
		IF @rowcount > 1
		 BEGIN
			SET @error_desc = @localized_string_GetPartitionSetNameForWorkflowInstance_Failed_MultipleActive
			GOTO FAILED
		 END
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
    ON OBJECT::[dbo].[GetPartitionSetNameForWorkflowInstance] TO [tracking_writer]
    AS [dbo];


GO

