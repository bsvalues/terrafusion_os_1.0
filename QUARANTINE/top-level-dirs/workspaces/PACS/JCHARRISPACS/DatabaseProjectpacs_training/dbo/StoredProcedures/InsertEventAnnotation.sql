
CREATE PROCEDURE [dbo].[InsertEventAnnotation]		@WorkflowInstanceInternalId	bigint
													,@EventId					bigint
													,@EventTypeId				char(1)
													,@Annotation				nvarchar(1024) = NULL
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_InsertEventAnnotation_Failed_InsertEventAnnotation nvarchar(256)
	set @localized_string_InsertEventAnnotation_Failed_InsertEventAnnotation = N'Failed inserting into EventAnnotation'

		
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


	INSERT [dbo].[EventAnnotation] (
			[WorkflowInstanceInternalId]
			,[EventId]
			,[EventTypeId]
			,[Annotation]
	) VALUES (
			@WorkflowInstanceInternalId
			,@EventId
			,@EventTypeId
			,@Annotation
	)

	IF @@ERROR <> 0 OR @@ROWCOUNT <> 1
	 BEGIN
		SELECT @error_desc = @localized_string_InsertEventAnnotation_Failed_InsertEventAnnotation
		GOTO FAILED		
	 END

	IF @local_tran = 1
		COMMIT TRANSACTION

	SET @ret = 0
	GOTO DONE

FAILED:
	IF @local_tran = 1
		ROLLBACK TRANSACTION
	
	SET @ret = -1
	RAISERROR( @error_desc, 16, -1 )

	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertEventAnnotation] TO [tracking_writer]
    AS [dbo];


GO

