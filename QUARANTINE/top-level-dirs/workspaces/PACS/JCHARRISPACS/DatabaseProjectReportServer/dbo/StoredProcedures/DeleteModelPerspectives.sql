CREATE PROCEDURE [dbo].[DeleteModelPerspectives]
@ModelID as uniqueidentifier
AS

DELETE
FROM [ModelPerspective]
WHERE [ModelID] = @ModelID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteModelPerspectives] TO [RSExecRole]
    AS [dbo];


GO

