
CREATE PROCEDURE [dbo].[Jefferson_GetFirePatrolAssessments]
  @AssessmentYear char(4)
 
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..#PACS_FirePatrol_Assessment') is not null
BEGIN
    DROP TABLE [#PACS_FirePatrol_Assessment]
END

CREATE TABLE #PACS_FirePatrol_Assessment
(
 [Owner]			varchar(70) null,
 [Owner_id]			int null,
 [Prop_id]			int null,
 [PACSyear_av]		int null,
 [PACSsup_num]      int null,
 [Agency_id]		int null,
 [Assessment_amt]	 numeric(14,2) null,
 [Additionalfee_amt] numeric(14,2) null,
 [Legal_acres]		numeric(18,4) null,
 [Benefit_acres]	 numeric(18,4) null,
 [Benefit_acres_sum] numeric(18,4) null,
 [Is_primary]		 bit null,
 [Land_Use_Cd]      varchar(10) null,
 [Exemption_Type_Cd]   varchar(10)
)
 
  INSERT INTO #PACS_FirePatrol_Assessment ([Owner], Owner_id, Prop_id, PACSyear_av, PACSsup_num, Agency_id, Assessment_amt, Additionalfee_amt, Legal_acres, Benefit_acres, Benefit_acres_sum, Is_primary, Land_Use_Cd, Exemption_Type_Cd)
  SELECT b.file_as_name, b.acct_id, a.prop_id, d.year, c.sup_num, d.agency_id, d.assessment_amt, d.additional_fee_amt, c.legal_acreage, 0, 0, 0, c.property_use_cd, ''
  FROM property As a, account As b, property_val  As c, property_special_assessment As d
  WHERE a.col_owner_id = b.acct_id AND a.prop_id = c.prop_id  AND c.sup_num = d.sup_num AND a.prop_id = d.prop_id
  AND c.prop_val_yr = @AssessYear AND c.prop_val_yr = d.year
  AND IsNull(d.assessment_amt,-99) <> -99 AND d.agency_id = 102
  AND IsNull(c.prop_inactive_dt,'1/1/1900') = '1/1/1900'
  AND c.sup_num = 0 --Only include initial closing
  ORDER BY b.file_as_name

  UPDATE #PACS_FirePatrol_Assessment
  SET Benefit_acres = b.benefit_acres
  FROM #PACS_FirePatrol_Assessment As a, property_assessment_attribute_val As b
  WHERE a.Prop_id = b.prop_id AND a.PACSYear_av = b.prop_val_yr AND a.PACSsup_num = b.sup_num

  UPDATE #PACS_FirePatrol_Assessment
  SET Benefit_acres_sum = IsNull(b.benefit_acre_sum,0), Is_primary = b.is_primary
  FROM #PACS_FirePatrol_Assessment As a, user_property_val As b
  WHERE a.Prop_id = b.prop_id AND a.PACSYear_av = b.prop_val_yr AND a.PACSsup_num = b.sup_num
    
  UPDATE #PACS_FirePatrol_Assessment
  SET Exemption_Type_Cd = b.exmpt_type_cd
  FROM #PACS_FirePatrol_Assessment As a, property_exemption As b
  WHERE a.Prop_id = b.prop_id AND a.PACSYear_av = b.exmpt_tax_yr AND a.PACSsup_num = b.sup_num
 
  SELECT * FROM #PACS_FirePatrol_Assessment  ORDER BY [Owner]
  --SELECT * FROM #PACS_FirePatrol_Assessment WHERE Exemption_Type_Cd = 'EX'  ORDER BY [Owner]

GRANT EXECUTE ON [dbo].[Jefferson_GetFirePatrolAssessments] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetFirePatrolAssessments] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetFirePatrolAssessments] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetFirePatrolAssessments] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

