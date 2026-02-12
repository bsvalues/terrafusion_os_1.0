
CREATE PROCEDURE [dbo].[Jefferson_GetDrainageDistrictAssessmentsAndTaxes]
  @AssessmentYear char(4)
 
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..##PACS_PLDrainage_Assessment') is not null
BEGIN
    DROP TABLE [#PACS_PLDrainage_Assessment]
END

CREATE TABLE #PACS_PLDrainage_Assessment
(
 PACSprop_id		int null,
 Parcel_Number		varchar(12) null,
 prop_val_yr		numeric(4,0) null,
 Owner_id			int null,
 Taxpayer			varchar(70) null,
 Legal_Description  varchar(255) null,
 PLDD_acres			numeric(18,4) null,
 Agency_id		    int null,
 Assess_amt_previous numeric(14,2) null,
 Additional_fee_previous numeric(14,2) null,
 Assess_amt_current numeric(14,2) null,
 Additional_fee_current numeric(14,2) null,
 Imported_amt_current  numeric(14,2) null
)

  INSERT INTO #PACS_PLDrainage_Assessment (PACSprop_id, Parcel_Number, prop_val_yr, Owner_id, Taxpayer, Legal_Description, PLDD_acres, Agency_id, Assess_amt_previous, Additional_fee_previous, Assess_amt_current, Additional_fee_current, Imported_amt_current)
  SELECT a.prop_id, a.geo_id, c.prop_val_yr, b.acct_id, b.file_as_name, c.legal_desc, 0, 100, 0, 0, 0, 0, 0
  FROM property As a, account As b, property_val  As c, prop_characteristic_assoc As d
  WHERE a.col_owner_id = b.acct_id AND a.prop_id = c.prop_id AND c.sup_num = d.sup_num AND a.prop_id = d.prop_id
  AND c.prop_val_yr = @AssessYear AND c.prop_val_yr = d.prop_val_yr
   AND IsNull(c.prop_inactive_dt,'1/1/1900') = '1/1/1900'
  AND c.sup_num = 0 AND d.characteristic_cd = 'PLDD'

  UPDATE #PACS_PLDrainage_Assessment SET PLDD_acres = b.pldd_acreage_assessed
  FROM #PACS_PLDrainage_Assessment As a, user_property As b
  WHERE a.PACSprop_id = b.prop_id

  UPDATE #PACS_PLDrainage_Assessment SET Assess_amt_previous = b.assessment_amt, Additional_fee_previous = additional_fee_amt
  FROM #PACS_PLDrainage_Assessment As a, property_special_assessment As b
  WHERE a.PACSprop_id = b.prop_id AND b.year = @AssessYear - 1 AND b.agency_id = 100

  UPDATE #PACS_PLDrainage_Assessment SET Assess_amt_current = b.assessment_amt, Additional_fee_current = additional_fee_amt, Imported_amt_current = imported_assessment_amt
  FROM #PACS_PLDrainage_Assessment As a, property_special_assessment As b
  WHERE a.PACSprop_id = b.prop_id AND b.year = @AssessYear AND b.agency_id = 100

  SELECT * FROM #PACS_PLDrainage_Assessment  ORDER BY Parcel_Number

GRANT EXECUTE ON [dbo].[Jefferson_GetDrainageDistrictAssessmentsAndTaxes] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetDrainageDistrictAssessmentsAndTaxes] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetDrainageDistrictAssessmentsAndTaxes] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetDrainageDistrictAssessmentsAndTaxes] TO PUBLIC
    AS [dbo];


GO

