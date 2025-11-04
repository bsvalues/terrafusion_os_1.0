CREATE PROCEDURE [dbo].[GetDrillthroughReports]
@ModelID uniqueidentifier,
@ModelItemID nvarchar(425)
AS
 SELECT
 ModelDrill.Type,
 Catalog.Path
 FROM ModelDrill INNER JOIN Catalog ON ModelDrill.ReportID = Catalog.ItemID
 WHERE ModelID = @ModelID
 AND ModelItemID = @ModelItemID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetDrillthroughReports] TO [RSExecRole]
    AS [dbo];


GO

