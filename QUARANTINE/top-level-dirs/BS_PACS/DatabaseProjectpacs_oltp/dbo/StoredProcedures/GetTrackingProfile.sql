
CREATE PROCEDURE [dbo].[GetTrackingProfile]	@TypeFullName				nvarchar(128)	-- Type of the Workflow's companion type
												,@AssemblyFullName		nvarchar(256)	-- Assembly of the Workflow's companion type
												,@Version				varchar(32) = NULL		-- Optional Version
												,@CreateDefault			bit	= 1			-- If a profile doesn't exist for this type insert the default and use it going forward
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED


	declare @localized_string_GetTrackingProfile_Failed_GetType nvarchar(256)
	set @localized_string_GetTrackingProfile_Failed_GetType = N'GetTypeId failed'



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
	
	/*
		Can't select an ntext into a local var so using a somewhat inefficient repeated select
	*/
	IF NOT EXISTS (	SELECT		1 
					FROM		[dbo].[TrackingProfile] tp
					INNER JOIN	[dbo].[Type] t
					ON			tp.[WorkflowTypeId] = t.[TypeId]
					WHERE		t.[TypeFullName] = @TypeFullName
					AND			t.[AssemblyFullName] = @AssemblyFullName ) AND @CreateDefault = cast( 1 as bit )
	 BEGIN
		EXEC @ret = [dbo].[InsertDefaultTrackingProfile] @TypeFullName = @TypeFullName, @AssemblyFullName = @AssemblyFullName

		IF @@ERROR <> 0 OR @ret IS NULL OR @ret <> 0
		 BEGIN
			RAISERROR( @localized_string_GetTrackingProfile_Failed_GetType, 16, -1 )
			RETURN -1
		 END
	 END

	/*
		If the profile is null in the tracking table it means that the default tracking profile
		should be used.  Join on Version to get the correct version.
	*/
	SELECT	TOP 1	'TrackingProfile' = 
					CASE 
						WHEN tp.[TrackingProfileXml] IS NULL THEN dtp.[TrackingProfileXml]
						ELSE tp.[TrackingProfileXml]
					END
					,tp.[Version]
	FROM			[dbo].[TrackingProfile] tp
	INNER JOIN		[dbo].[Type] t
	ON				tp.[WorkflowTypeId] = t.[TypeId]
	LEFT OUTER JOIN	[dbo].[DefaultTrackingProfile] dtp
	ON				tp.[Version] = dtp.[Version]
	WHERE			t.[TypeFullName] = @TypeFullName
	AND				t.[AssemblyFullName] = @AssemblyFullName
	AND				tp.[Version] != '-1' -- Deleted indicator
	AND				( tp.[Version] = @Version OR @Version IS NULL ) /* Inefficient - won't use index - but simple */
	ORDER BY		tp.[InsertDateTime] desc

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
	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetTrackingProfile] TO [tracking_writer]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

