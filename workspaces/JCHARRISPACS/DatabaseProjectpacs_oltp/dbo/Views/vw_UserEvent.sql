

CREATE VIEW [dbo].[vw_UserEvent]
AS
SELECT		[UserEventId]
			,[WorkflowInstanceInternalId]
			,[EventOrder]
			,[ActivityInstanceId]
			,[EventDateTime]
			,[UserDataKey]
			,[UserDataTypeId]
			,[UserData_Str]
			,[UserData_Blob]
			,[UserDataNonSerializable]					
			,[DbEventDateTime]
FROM		[dbo].[UserEvent]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_UserEvent] TO [tracking_reader]
    AS [dbo];


GO

