Create Procedure [dbo].[RetrieveAllInstanceDescriptions]
As
	SELECT uidInstanceID, status, blocked, info, nextTimer
	FROM [dbo].[InstanceState]

GO

