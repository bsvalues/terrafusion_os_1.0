
CREATE VIEW [dbo].[vw_TrackingDataItem]
AS
SELECT		[TrackingDataItemId]
			,[WorkflowInstanceInternalId]
			,[EventId]
			,[EventTypeId]
			,[FieldName]
			,[FieldTypeId]
			,[Data_Str]
			,[Data_Blob]
			,[DataNonSerializable]
FROM		[dbo].[TrackingDataItem]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_TrackingDataItem] TO [tracking_reader]
    AS [dbo];


GO

