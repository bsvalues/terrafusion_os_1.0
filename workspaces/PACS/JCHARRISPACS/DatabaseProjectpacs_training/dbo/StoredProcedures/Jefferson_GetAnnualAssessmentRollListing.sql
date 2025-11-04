
CREATE PROCEDURE [dbo].[Jefferson_GetAnnualAssessmentRollListing]
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

--Used if just wanting the Assessment Roll temp table.
SELECT * FROM [##PACS_Assessment_Roll] ORDER BY Prop_Type_Code, Parcel_Number

-- Used for filtering specific criteria as well as joining temp table for Roll with temp table for Owner 3/28/2014
/*
SELECT a.*, b.* 
FROM [##PACS_Assessment_Roll] As a, [##PACS_Assessment_Owner] As b
WHERE a.PACSowner_id = b.PACSowner_id AND a.Taxable_Value > 0 AND a.tax_area_number Like '07%' AND a.taxable_adjustment <> 'SNR/DSBL'
ORDER BY Prop_Type_Code, Parcel_Number
*/


GRANT EXECUTE ON [dbo].[Jefferson_GetAnnualAssessmentRollListing] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetAnnualAssessmentRollListing] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetAnnualAssessmentRollListing] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetAnnualAssessmentRollListing] TO PUBLIC
    AS [dbo];


GO

