
CREATE PROCEDURE [dbo].[GetInstanceTrackingProfile]	@InstanceId			uniqueidentifier
AS
 BEGIN
	SET NOCOUNT ON

	SELECT	[TrackingProfileXml]
	FROM	[dbo].[TrackingProfileInstance]
	WHERE	[InstanceId] = @InstanceId


 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetInstanceTrackingProfile] TO [tracking_writer]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetInstanceTrackingProfile] TO [tracking_profilereaderwriter]
    AS [dbo];


GO

