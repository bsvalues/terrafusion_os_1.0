
CREATE PROCEDURE [dbo].[Jefferson_GetAnnualPrimaryOwnerRoll]
  @AssessYear int
AS

SET NOCOUNT ON

IF object_id('TEMPDB..##PACS_Assessment_Roll') is not null
BEGIN
    DROP TABLE [##PACS_Assessment_Roll]
END

IF object_id('TEMPDB..##PACS_Assessment_Owner') is not null
BEGIN
    DROP TABLE [##PACS_Assessment_Owner]
END

EXEC Jefferson_CompileAnnualAssessmentRollListing @AssessYear

SELECT * FROM [##PACS_Assessment_Owner] ORDER BY PACSowner_id

GRANT EXECUTE ON [dbo].[Jefferson_GetAnnualPrimaryOwnerRoll] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetAnnualPrimaryOwnerRoll] TO [PUBLIC]

GO

