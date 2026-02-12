
CREATE PROCEDURE [dbo].[SetPartitionInterval]	@Interval char(1)
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_SetPartitionInterval_Failed nvarchar(256)
	set @localized_string_SetPartitionInterval_Failed = N'CreatePartition failed setting the partition interval'
 
	declare @localized_string_SetPartitionInterval_Failed_InvalidInterval nvarchar(256)
	set @localized_string_SetPartitionInterval_Failed_InvalidInterval = N'CreatePartition failed - @Interval must be ''h'' (hourly), ''d'' (daily), ''w'' (weekly), ''m'' (monthly), ''y'' (yearly), ''u'' (user defined - partitions manually created using TrackingPartition_CreateUserDefinedPartition)'
 
	SELECT @Interval = lower(@Interval)

	IF @Interval NOT IN ( 'd', 'w', 'm', 'y' )
	 BEGIN
		SET @error_desc = @localized_string_SetPartitionInterval_Failed_InvalidInterval
		GOTO DONE
	 END

	IF EXISTS ( SELECT 1 FROM [dbo].[TrackingPartitionInterval] )
	 BEGIN
		UPDATE [dbo].[TrackingPartitionInterval] SET [Interval] = @Interval

		SELECT @error = @@ERROR

		IF @error IS NULL OR @error <> 0
		 BEGIN
			SET @error_desc = @localized_string_SetPartitionInterval_Failed_InvalidInterval
			GOTO DONE
		 END
	 END
	ELSE
	 BEGIN
		INSERT [dbo].[TrackingPartitionInterval] VALUES ( @Interval )

		SELECT @error = @@ERROR

		IF @error IS NULL OR @error <> 0
		 BEGIN
			SET @error_desc = @localized_string_SetPartitionInterval_Failed_InvalidInterval
			GOTO DONE
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
    ON OBJECT::[dbo].[SetPartitionInterval] TO [tracking_writer]
    AS [dbo];


GO

