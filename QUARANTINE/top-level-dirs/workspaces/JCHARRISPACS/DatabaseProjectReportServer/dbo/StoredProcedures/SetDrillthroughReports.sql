CREATE PROCEDURE [dbo].[SetDrillthroughReports]
@ReportID uniqueidentifier,
@ModelID uniqueidentifier,
@ModelItemID nvarchar(425),
@Type tinyint
AS
 SET NOCOUNT OFF
 INSERT INTO ModelDrill (ModelDrillID, ModelID, ReportID, ModelItemID, [Type])
 VALUES (newid(), @ModelID, @ReportID, @ModelItemID, @Type)

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetDrillthroughReports] TO [RSExecRole]
    AS [dbo];


GO

