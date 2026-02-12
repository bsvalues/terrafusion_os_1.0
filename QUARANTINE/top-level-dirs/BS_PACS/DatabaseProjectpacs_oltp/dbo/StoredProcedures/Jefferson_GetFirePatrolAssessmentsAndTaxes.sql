
CREATE PROCEDURE [dbo].[Jefferson_GetFirePatrolAssessmentsAndTaxes]
  @AssessmentYear char(4),
  @OwnerID int
 
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)
SET @OwnerID = IsNull(@OwnerID, 0)

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
 [PACSyear_tax]		int null,
 [Statement_id]     int null,
 [FP_Assessment_fee_id] int null,
 [FP_Assessment_fee_amt] numeric(14,2) null,
 [FPAdmin_Assessment_fee_id] int null,
 [FPAdmin_Assessment_fee_amt] numeric(14,2) null,
 [Run_id]            int null,
 [Statement_date]    datetime
 )
 
  INSERT INTO #PACS_FirePatrol_Assessment ([Owner], Owner_id, Prop_id, PACSyear_av, PACSsup_num, Agency_id, Assessment_amt, Additionalfee_amt, Legal_acres, Benefit_acres, Benefit_acres_sum, Is_primary, PACSyear_tax, Statement_id, FP_Assessment_fee_id, FP_Assessment_fee_amt, FPAdmin_Assessment_fee_id, FPAdmin_Assessment_fee_amt, Run_id)
  SELECT b.file_as_name, b.acct_id, a.prop_id, d.year, c.sup_num, d.agency_id, d.assessment_amt, d.additional_fee_amt, c.legal_acreage, 0, 0, 0, @AssessYear + 1, 0, 0, 0, 0, 0, 0
  FROM property As a, account As b, property_val  As c, property_special_assessment As d
  WHERE a.col_owner_id = b.acct_id AND a.prop_id = c.prop_id AND c.sup_num = d.sup_num AND a.prop_id = d.prop_id
  AND c.prop_val_yr = @AssessYear AND c.prop_val_yr = d.year
  AND IsNull(d.assessment_amt,-99) <> -99 AND d.agency_id = 102
  AND IsNull(c.prop_inactive_dt,'1/1/1900') = '1/1/1900'
  AND c.sup_num = 0 --Only include initial closing
  ORDER BY b.file_as_name

  IF @OwnerID <> 0 
  BEGIN
  DELETE FROM #PACS_FirePatrol_Assessment WHERE Owner_id <> @OwnerID
  END 

  UPDATE #PACS_FirePatrol_Assessment
  SET Benefit_acres = b.benefit_acres
  FROM #PACS_FirePatrol_Assessment As a, property_assessment_attribute_val As b
  WHERE a.Prop_id = b.prop_id AND a.PACSYear_av = b.prop_val_yr AND a.PACSsup_num = b.sup_num

  UPDATE #PACS_FirePatrol_Assessment
  SET Benefit_acres_sum = IsNull(b.benefit_acre_sum,0), Is_primary = b.is_primary
  FROM #PACS_FirePatrol_Assessment As a, user_property_val As b
  WHERE a.Prop_id = b.prop_id AND a.PACSYear_av = b.prop_val_yr AND a.PACSsup_num = b.sup_num

  UPDATE #PACS_FirePatrol_Assessment
  SET Statement_id = b.statement_id, FP_Assessment_fee_id = c.assessment_fee_id, FP_Assessment_fee_amt = c.assessment_fee_amount, Run_id = b.run_id
  FROM #PACS_FirePatrol_Assessment As a, wa_tax_statement As b, wa_tax_statement_assessment_fee As c
  WHERE a.Prop_id = b.prop_id AND a.PACSyear_av = b.year AND a.PACSsup_num = b.sup_num 
  AND b.statement_id = c.statement_id AND b.run_id = c.run_id AND c.agency_id = 102 AND Isnull(c.fee_cd, '') <> 'FP ADMIN'
 
 UPDATE #PACS_FirePatrol_Assessment
  SET FPAdmin_Assessment_fee_id = c.assessment_fee_id, FPAdmin_Assessment_fee_amt = c.assessment_fee_amount, Run_id = b.run_id
  FROM #PACS_FirePatrol_Assessment As a, wa_tax_statement As b, wa_tax_statement_assessment_fee As c
  WHERE a.Prop_id = b.prop_id AND a.PACSyear_av = b.year AND a.PACSsup_num = b.sup_num
  AND b.statement_id = c.statement_id AND b.run_id = c.run_id AND c.agency_id = 102 AND Isnull(c.fee_cd, '') = 'FP ADMIN'

  UPDATE #PACS_FirePatrol_Assessment
  SET Statement_date = b.statement_date
  FROM #PACS_FirePatrol_Assessment As a, wa_tax_statement_run As b
  WHERE a.Run_id = b.run_id AND a.PACSyear_av = b.year

  /*
  UPDATE property_special_assessment SET assessment_amt = 17.40, additional_fee_amt = .50
  FROM property_special_assessment As a, #PACS_FirePatrol_Assessment As b
  WHERE a.prop_id = b.prop_id AND a.year = b.PACSyear_av AND a.assessment_amt = 0
  AND b.Is_primary = 1 AND b.Benefit_acres_sum <= 50 AND a.Agency_id = 102

  UPDATE property_special_assessment SET assessment_amt = 17.40 + ((b.Benefit_acres_sum - 50) * .31), additional_fee_amt = .50
  FROM property_special_assessment As a, #PACS_FirePatrol_Assessment As b
  WHERE a.prop_id = b.prop_id AND a.year = b.PACSyear_av AND a.assessment_amt = 0
  AND b.Is_primary = 1 AND b.Benefit_acres_sum > 50 AND a.Agency_id = 102
  */ 

  SELECT * FROM #PACS_FirePatrol_Assessment  ORDER BY [Owner]

GRANT EXECUTE ON [dbo].[Jefferson_GetFirePatrolAssessmentsAndTaxes] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetFirePatrolAssessmentsAndTaxes] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetFirePatrolAssessmentsAndTaxes] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetFirePatrolAssessmentsAndTaxes] TO PUBLIC
    AS [dbo];


GO

