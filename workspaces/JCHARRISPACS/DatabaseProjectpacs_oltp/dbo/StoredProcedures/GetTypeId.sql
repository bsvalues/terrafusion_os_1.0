
CREATE PROCEDURE [dbo].[GetTypeId]		@TypeFullName			nvarchar(128)		
										,@AssemblyFullName		nvarchar(256)	
										,@IsInstanceType		bit = 0	
										,@TypeId				int OUTPUT
		
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	declare @localized_string_GetTypeId_Failed_InsertType nvarchar(256)
	set @localized_string_GetTypeId_Failed_InsertType = N'Failed inserting TypeId'

	declare @localized_string_GetTypeId_Failed_SelectType nvarchar(256)
	set @localized_string_GetTypeId_Failed_SelectType = N'Failed selecting TypeId'

	DECLARE @local_tran		bit
			,@error			int
			,@error_desc	nvarchar(256)
			,@ret			int
			,@id			int

	IF @@TRANCOUNT > 0
		SET @local_tran = 0
	ELSE
	 BEGIN
		BEGIN TRANSACTION
		SET @local_tran = 1		
	 END
	/*
		Most of the time this will return a value and we won't attempt the insert
		It's true that since the index specifies ignore dup key we could just insert
		but that acquires more locks.  Since the common case is that the row will
		exist the choice is to do a bit more work when the row doesn't exist.
	*/
	SELECT	@id = TypeId
	FROM	[dbo].[Type]
	WHERE	[TypeFullName]		= @TypeFullName
	AND		[AssemblyFullName]	= @AssemblyFullName

	IF @id IS NULL
	 BEGIN
		INSERT [dbo].[Type](
			[TypeFullName]
			,[AssemblyFullName]
			,[IsInstanceType]
		) 
		VALUES (
			@TypeFullName
			,@AssemblyFullName
			,@IsInstanceType
		)
				
		SELECT @error = @@ERROR, @id = SCOPE_IDENTITY()
		/*
			3604 -	Warning duplicate key ignored - does not raise exception to client
				This occurs when index specifies IGNORE_DUP_KEY
		*/
		IF @error = 3604 OR @id = 0 OR @id IS NULL
		 BEGIN
			SELECT	@id = TypeId
			FROM	[dbo].[Type]
			WHERE	[TypeFullName]		= @TypeFullName
			AND		[AssemblyFullName]	= @AssemblyFullName
	
			IF @@ERROR <> 0
			 BEGIN
				SELECT @error_desc = @localized_string_GetTypeId_Failed_SelectType
				GOTO FAILED
			 END
		 END
		ELSE IF @error NOT IN ( 3604, 0 )
		 BEGIN
			/*
				If we have an error (not 0) and 
				the error number is not 3604
				Then we have a fatal error situation
			*/
			SELECT @error_desc = @localized_string_GetTypeId_Failed_InsertType
			GOTO FAILED
		 END
	 END
	
	SELECT @TypeId = @id

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
    ON OBJECT::[dbo].[GetTypeId] TO [tracking_writer]
    AS [dbo];


GO

