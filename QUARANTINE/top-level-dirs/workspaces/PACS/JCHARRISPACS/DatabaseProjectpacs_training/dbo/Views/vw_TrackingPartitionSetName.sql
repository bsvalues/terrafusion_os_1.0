
CREATE VIEW [dbo].[vw_TrackingPartitionSetName]
AS
SELECT		[PartitionId]
			,[Name]
			,[CreatedDateTime]
			,[EndDateTime]
			,[PartitionInterval]
FROM		[TrackingPartitionSetName]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_TrackingPartitionSetName] TO [tracking_reader]
    AS [dbo];


GO

