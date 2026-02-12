
CREATE PROCEDURE [dbo].[InsertTrackingDataItemMultiple]	@WorkflowInstanceInternalId		bigint
														,@EventTypeId					char(1)
														,@EventId1						bigint
														,@FieldName1					nvarchar(256)
														,@TypeFullName1					nvarchar(128)	= NULL
														,@AssemblyFullName1				nvarchar(256)	= NULL
														,@Data_Str1						nvarchar(512)	= NULL
														,@Data_Blob1					image			= NULL
														,@DataNonSerializable1			bit			
														,@TrackingDataItemId1			bigint OUTPUT
														,@EventId2						bigint			= NULL
														,@FieldName2					nvarchar(256)	= NULL
														,@TypeFullName2					nvarchar(128)	= NULL
														,@AssemblyFullName2				nvarchar(256)	= NULL
														,@Data_Str2						nvarchar(512)	= NULL
														,@Data_Blob2					image			= NULL
														,@DataNonSerializable2			bit				= NULL
														,@TrackingDataItemId2			bigint 			= NULL OUTPUT
														,@EventId3						bigint			= NULL
														,@FieldName3					nvarchar(256)	= NULL
														,@TypeFullName3					nvarchar(128)	= NULL
														,@AssemblyFullName3				nvarchar(256)	= NULL
														,@Data_Str3						nvarchar(512)	= NULL
														,@Data_Blob3					image			= NULL
														,@DataNonSerializable3			bit				= NULL
														,@TrackingDataItemId3			bigint			= NULL OUTPUT
														,@EventId4						bigint			= NULL
														,@FieldName4					nvarchar(256)	= NULL
														,@TypeFullName4					nvarchar(128)	= NULL
														,@AssemblyFullName4				nvarchar(256)	= NULL
														,@Data_Str4						nvarchar(512)	= NULL
														,@Data_Blob4					image			= NULL
														,@DataNonSerializable4			bit				= NULL
														,@TrackingDataItemId4			bigint			= NULL OUTPUT
														,@EventId5						bigint			= NULL
														,@FieldName5					nvarchar(256)	= NULL
														,@TypeFullName5					nvarchar(128)	= NULL
														,@AssemblyFullName5				nvarchar(256)	= NULL
														,@Data_Str5						nvarchar(512)	= NULL
														,@Data_Blob5					image			= NULL
														,@DataNonSerializable5			bit				= NULL
														,@TrackingDataItemId5			bigint			= NULL OUTPUT
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			smallint
			,@TypeId		int

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END

	DECLARE	@TrackingDataItemId		bigint

	IF @FieldName1 IS NOT NULL
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItem]	@WorkflowInstanceInternalId		= @WorkflowInstanceInternalId
													,@EventId						= @EventId1
													,@EventTypeId					= @EventTypeId
													,@FieldName						= @FieldName1
													,@TypeFullName					= @TypeFullName1
													,@AssemblyFullName				= @AssemblyFullName1
													,@Data_Str						= @Data_Str1
													,@Data_Blob						= @Data_Blob1
													,@DataNonSerializable			= @DataNonSerializable1
													,@TrackingDataItemId			= @TrackingDataItemId1 OUTPUT

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TrackingDataItemId1 IS NULL OR @TrackingDataItemId1 <= 0
			GOTO FAILED
	 END


	IF @FieldName2 IS NOT NULL
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItem]	@WorkflowInstanceInternalId		= @WorkflowInstanceInternalId
													,@EventId						= @EventId2
													,@EventTypeId					= @EventTypeId
													,@FieldName						= @FieldName2
													,@TypeFullName					= @TypeFullName2
													,@AssemblyFullName				= @AssemblyFullName2
													,@Data_Str						= @Data_Str2
													,@Data_Blob						= @Data_Blob2
													,@DataNonSerializable			= @DataNonSerializable2
													,@TrackingDataItemId			= @TrackingDataItemId2 OUTPUT

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TrackingDataItemId2 IS NULL OR @TrackingDataItemId2 <= 0
			GOTO FAILED
	 END

	IF @FieldName3 IS NOT NULL
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItem]	@WorkflowInstanceInternalId		= @WorkflowInstanceInternalId
													,@EventId						= @EventId3
													,@EventTypeId					= @EventTypeId
													,@FieldName						= @FieldName3
													,@TypeFullName					= @TypeFullName3
													,@AssemblyFullName				= @AssemblyFullName3
													,@Data_Str						= @Data_Str3
													,@Data_Blob						= @Data_Blob3
													,@DataNonSerializable			= @DataNonSerializable3
													,@TrackingDataItemId			= @TrackingDataItemId3 OUTPUT

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TrackingDataItemId3 IS NULL OR @TrackingDataItemId3 <= 0
			GOTO FAILED
	 END

	IF @FieldName4 IS NOT NULL
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItem]	@WorkflowInstanceInternalId		= @WorkflowInstanceInternalId
													,@EventId						= @EventId4
													,@EventTypeId					= @EventTypeId
													,@FieldName						= @FieldName4
													,@TypeFullName					= @TypeFullName4
													,@AssemblyFullName				= @AssemblyFullName4
													,@Data_Str						= @Data_Str4
													,@Data_Blob						= @Data_Blob4
													,@DataNonSerializable			= @DataNonSerializable4
													,@TrackingDataItemId			= @TrackingDataItemId4 OUTPUT

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TrackingDataItemId4 IS NULL OR @TrackingDataItemId4 <= 0
			GOTO FAILED
	 END

	IF @FieldName5 IS NOT NULL
	 BEGIN
		EXEC @ret = [dbo].[InsertTrackingDataItem]	@WorkflowInstanceInternalId		= @WorkflowInstanceInternalId
													,@EventId						= @EventId5
													,@EventTypeId					= @EventTypeId
													,@FieldName						= @FieldName5
													,@TypeFullName					= @TypeFullName5
													,@AssemblyFullName				= @AssemblyFullName5
													,@Data_Str						= @Data_Str5
													,@Data_Blob						= @Data_Blob5
													,@DataNonSerializable			= @DataNonSerializable5
													,@TrackingDataItemId			= @TrackingDataItemId5 OUTPUT

		IF @@ERROR IS NULL OR @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TrackingDataItemId5 IS NULL OR @TrackingDataItemId5 <= 0
			GOTO FAILED
	 END
	
	
	IF @local_tran = 1
		COMMIT TRANSACTION

	SET @ret = 1
	GOTO DONE

FAILED:
	SET @ret = 0

	IF @local_tran = 1
		ROLLBACK TRANSACTION

	RAISERROR( @error_desc, 16, -1 )

	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertTrackingDataItemMultiple] TO [tracking_writer]
    AS [dbo];


GO

