
CREATE PROCEDURE [dbo].[InsertTrackingDataItemAnnotation]	@TrackingDataItemId				bigint
															,@WorkflowInstanceInternalId	bigint
													,@Annotation				nvarchar(1024)
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_InsertTrackingDataItemAnnotation_Failed_TrackingDataItemAnnotationInsert nvarchar(256)
	set @localized_string_InsertTrackingDataItemAnnotation_Failed_TrackingDataItemAnnotationInsert = N'Failed inserting into TrackingDataItemAnnotation'

		
	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			smallint

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END


	INSERT [dbo].[TrackingDataItemAnnotation] (
			[TrackingDataItemId]
			,[WorkflowInstanceInternalId]
			,[Annotation]
	) VALUES (
			@TrackingDataItemId
			,@WorkflowInstanceInternalId
			,@Annotation
	)

	IF @@ERROR <> 0 OR @@ROWCOUNT <> 1
	 BEGIN
		SELECT @error_desc = @localized_string_InsertTrackingDataItemAnnotation_Failed_TrackingDataItemAnnotationInsert
		GOTO FAILED		
	 END

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
    ON OBJECT::[dbo].[InsertTrackingDataItemAnnotation] TO [tracking_writer]
    AS [dbo];


GO

