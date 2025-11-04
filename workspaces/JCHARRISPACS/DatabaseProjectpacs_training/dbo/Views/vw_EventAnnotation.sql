

CREATE VIEW [dbo].[vw_EventAnnotation]
AS
SELECT		[WorkflowInstanceInternalId]
			,[EventId]
			,[EventTypeId]
			,[Annotation]
FROM		[dbo].[EventAnnotation]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_EventAnnotation] TO [tracking_reader]
    AS [dbo];


GO

