
CREATE PROCEDURE [dbo].[GetUpdatedTrackingProfiles] @LastCheckDateTime datetime, @MaxCheckDateTime datetime OUTPUT
AS
 BEGIN
	SET NOCOUNT ON
	/*
		If the profile has been deleted (signified by Version=-1
		then the TrackingProfile column will be null in the resultset

		@MaxCheckDateTime will become @LastCheckDateTime in the next call
	*/
	SELECT @MaxCheckDateTime = getutcdate()

	SELECT			t.[TypeFullName]
					,t.[AssemblyFullName]
					,'TrackingProfile' = 
					CASE 
						WHEN tp.[TrackingProfileXml] IS NULL THEN dtp.[TrackingProfileXml]
						ELSE tp.[TrackingProfileXml]
					END
					,tp.[InsertDateTime]
	FROM			[dbo].[TrackingProfile] tp
	INNER JOIN		[dbo].[Type] t
	ON				tp.[WorkflowTypeId] = t.TypeId
	LEFT OUTER JOIN	[dbo].[DefaultTrackingProfile] dtp
	ON				tp.[Version] = dtp.[Version]
	WHERE			tp.[InsertDateTime] >= @LastCheckDateTime AND tp.[InsertDateTime] < @MaxCheckDateTime
	AND				tp.[TrackingProfileId] IN (	SELECT		max( [TrackingProfileId] )
												FROM		[dbo].[TrackingProfile]
												GROUP BY	[WorkflowTypeId] )

	RETURN 0

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetUpdatedTrackingProfiles] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetUpdatedTrackingProfiles] TO [tracking_writer]
    AS [dbo];


GO

