CREATE PROCEDURE [dbo].[DeleteDrillthroughReports]
@ModelID uniqueidentifier,
@ModelItemID nvarchar(425)
AS
 DELETE ModelDrill WHERE ModelID = @ModelID and ModelItemID = @ModelItemID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteDrillthroughReports] TO [RSExecRole]
    AS [dbo];


GO

