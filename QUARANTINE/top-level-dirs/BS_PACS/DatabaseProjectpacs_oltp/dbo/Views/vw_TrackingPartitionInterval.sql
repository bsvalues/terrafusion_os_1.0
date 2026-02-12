

CREATE VIEW [dbo].[vw_TrackingPartitionInterval]
AS
SELECT		[Interval]
FROM		[dbo].[TrackingPartitionInterval]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_TrackingPartitionInterval] TO [tracking_reader]
    AS [dbo];


GO

