
CREATE PROCEDURE [dbo].[InsertTrackingDataItem]		@WorkflowInstanceInternalId		bigint
													,@EventId						bigint
													,@EventTypeId					char(1)
													,@FieldName						nvarchar(256)
													,@TypeFullName					nvarchar(128)	= NULL
													,@AssemblyFullName				nvarchar(256)	= NULL
													,@Data_Str						nvarchar(512)	= NULL
													,@Data_Blob						image			= NULL
													,@DataNonSerializable			bit			
													,@TrackingDataItemId			bigint OUTPUT
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	declare @localized_string_InsertTrackingDataItem_Failed_Params nvarchar(256)
	set @localized_string_InsertTrackingDataItem_Failed_Params = N'@TypeFullName and @AssemblyFullName must be non null if @Data_Str or @Data_Blob is non null'

	declare @localized_string_InsertTrackingDataItem_Failed_GetType nvarchar(256)
	set @localized_string_InsertTrackingDataItem_Failed_GetType = N'GetTypeId failed'

	declare @localized_string_InsertTrackingDataItem_Failed_TrackingDataItemInsert nvarchar(256)
	set @localized_string_InsertTrackingDataItem_Failed_TrackingDataItemInsert = N'Failed inserting into TrackingDataItem'

		
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

	/*
		Look up or insert the type of the data
		If no type and data is not null 
	*/
	IF ( @TypeFullName IS NULL OR @AssemblyFullName IS NULL ) AND ( @Data_Str IS NOT NULL OR @Data_Blob IS NOT NULL )
	 BEGIN
			SELECT @error_desc = @localized_string_InsertTrackingDataItem_Failed_Params
			GOTO FAILED
	 END

	IF @TypeFullName IS NOT NULL AND @AssemblyFullName IS NOT NULL
	 BEGIN
		EXEC @ret = [dbo].[GetTypeId]	@TypeFullName		= @TypeFullName
										,@AssemblyFullName	= @AssemblyFullName
										,@TypeId			= @TypeId OUTPUT
				
		IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0 OR @TypeId IS NULL
		 BEGIN
			SELECT @error_desc = @localized_string_InsertTrackingDataItem_Failed_GetType
			GOTO FAILED
		 END
	END

	INSERT [dbo].[TrackingDataItem] (
			[WorkflowInstanceInternalId]
			,[EventId]
			,[EventTypeId]
			,[FieldName]
			,[FieldTypeId]
			,[Data_Str]
			,[Data_Blob]
			,[DataNonSerializable]
	) VALUES (
			@WorkflowInstanceInternalId
			,@EventId
			,@EventTypeId
			,@FieldName
			,@TypeId
			,@Data_Str
			,@Data_Blob
			,@DataNonSerializable
	)

	IF @@ERROR <> 0 OR @@ROWCOUNT <> 1
	 BEGIN
		SELECT @error_desc = @localized_string_InsertTrackingDataItem_Failed_TrackingDataItemInsert
		GOTO FAILED		
	 END

	SET @TrackingDataItemId = scope_identity()
	
	IF @local_tran = 1
		COMMIT TRANSACTION

	SET @ret = 0
	GOTO DONE

FAILED:
	SET @ret = -1
	IF @local_tran = 1
		ROLLBACK TRANSACTION

	RAISERROR( @error_desc, 16, -1 )

	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertTrackingDataItem] TO [tracking_writer]
    AS [dbo];


GO

