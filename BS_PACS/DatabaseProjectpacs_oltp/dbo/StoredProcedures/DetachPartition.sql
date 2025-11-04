
CREATE PROCEDURE [dbo].[DetachPartition] @PartitionName varchar(32) = NULL OUT, @PartitionId int = NULL
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_DetachPartition_Failed nvarchar(256)
	set @localized_string_DetachPartition_Failed = N'DetachPartition failed.'

	declare @localized_string_DetachPartition_Failed_NullArgs nvarchar(256)
	set @localized_string_DetachPartition_Failed_NullArgs = N'DetachPartition failed - either @PartitionName or @PartitionId must be non null.'

	declare @localized_string_DetachPartition_Failed_InvalidName nvarchar(256)
	set @localized_string_DetachPartition_Failed_InvalidName = N'DetachPartition failed - @PartitionName does not exist.'

	declare @localized_string_DetachPartition_Failed_InvalidId nvarchar(256)
	set @localized_string_DetachPartition_Failed_InvalidId = N'DetachPartition failed - @PartitionId does not exist.'

	declare @localized_string_DetachPartition_Failed_IdNameMismatch nvarchar(256)
	set @localized_string_DetachPartition_Failed_IdNameMismatch = N'DetachPartition failed - @PartitionName does not match @PartitionId.'

	declare @localized_string_DetachPartition_Failed_IntervalCreated nvarchar(256)
	set @localized_string_DetachPartition_Failed_IntervalCreated = N'DetachPartition failed selecting the partition record.'

	declare @localized_string_DetachPartition_Failed_Rebuild nvarchar(256)
	set @localized_string_DetachPartition_Failed_Rebuild = N'DetachPartition failed calling RebuildPartitionViews.'

	declare @localized_string_DetachPartition_Failed_DropViews nvarchar(256)
	set @localized_string_DetachPartition_Failed_DropViews = N'DetachPartition failed calling TrackingPartition_DropPartitionViews.'

	declare @localized_string_DetachPartition_Failed_DeleteSet nvarchar(256)
	set @localized_string_DetachPartition_Failed_DeleteSet = N'DetachPartition failed deleting the partition set record.'

	declare @localized_string_DetachPartition_Failed_Active nvarchar(256)
	set @localized_string_DetachPartition_Failed_Active = N'DetachPartition failed - the partition is currently active or is in the rollover period.'

	DECLARE @local_tran		bit
			,@error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int
	
	SELECT @local_tran = 0

	IF @PartitionName IS NULL AND @PartitionId IS NULL
	 BEGIN
		SET @error_desc = @localized_string_DetachPartition_Failed_NullArgs
		GOTO FAILED
	 END

	DECLARE @interval char(1), @created datetime, @end datetime
	-- Validate name or get name from id
	IF @PartitionName IS NOT NULL AND @PartitionId IS NOT NULL
	 BEGIN
		IF NOT EXISTS (	SELECT 1 FROM [dbo].[TrackingPartitionSetName] WHERE [Name] = @PartitionName AND [PartitionId] = @PartitionId )
		 BEGIN
			SELECT @error_desc = @localized_string_DetachPartition_Failed_IdNameMismatch
			GOTO FAILED
		 END

		SELECT 	@interval 	= [PartitionInterval]
				,@created 	= [CreatedDateTime]
				,@end		= [EndDateTime]
		FROM	[dbo].[TrackingPartitionSetName]
		WHERE	[PartitionId] = @PartitionId
		
		IF @created IS NULL OR @interval IS NULL
		 BEGIN
				SELECT @error_desc = @localized_string_DetachPartition_Failed_IntervalCreated
				GOTO FAILED
		 END
	 END
	ELSE IF @PartitionName IS NOT NULL
	 BEGIN
		SELECT	@PartitionId= [PartitionId]
				,@interval 	= [PartitionInterval]
				,@created 	= [CreatedDateTime]
				,@end		= [EndDateTime]
		FROM 	[dbo].[TrackingPartitionSetName] 
		WHERE 	[Name] = @PartitionName

		IF @PartitionId IS NULL
		 BEGIN
				SELECT @error_desc = @localized_string_DetachPartition_Failed_InvalidName
				GOTO FAILED
		 END
	 END
	ELSE
	 BEGIN
		SELECT 	@PartitionName = [Name]
				,@interval 	= [PartitionInterval]
				,@created 	= [CreatedDateTime]
				,@end		= [EndDateTime]
		FROM	[dbo].[TrackingPartitionSetName]
		WHERE	[PartitionId] = @PartitionId

		IF @PartitionName IS NULL
		 BEGIN
			SELECT @error_desc = @localized_string_DetachPartition_Failed_InvalidId
			GOTO FAILED
		 END
	 END

	-- Make sure this isn't the active partition or in the rollover period
	DECLARE @dt datetime
	SELECT @dt = getutcdate()
	IF @end IS NULL OR dateadd( hour, 1, @end ) > @dt
	 BEGIN
		SELECT @error_desc = @localized_string_DetachPartition_Failed_Active
		GOTO FAILED
	 END

	-- @PartitionName is valid
	IF @@TRANCOUNT = 0
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END

	DELETE [dbo].[TrackingPartitionSetName] WHERE [Name] = @PartitionName
	
	SELECT @error = @@ERROR, @rowcount = @@ROWCOUNT

	IF @error IS NULL OR @error <> 0 OR @rowcount IS NULL OR @rowcount <> 1
	 BEGIN
		SELECT @error_desc = @localized_string_DetachPartition_Failed_DeleteSet
		GOTO FAILED
	 END
	
	EXEC @ret = [dbo].[RebuildPartitionViews]

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0 OR @ret IS NULL OR @ret <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_DetachPartition_Failed_Rebuild
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
    ON OBJECT::[dbo].[DetachPartition] TO [tracking_writer]
    AS [dbo];


GO

