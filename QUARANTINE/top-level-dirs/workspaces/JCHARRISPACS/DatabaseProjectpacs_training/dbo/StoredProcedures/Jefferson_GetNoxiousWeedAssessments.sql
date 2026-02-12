
CREATE PROCEDURE [dbo].[Jefferson_GetNoxiousWeedAssessments]
  @AssessmentYear char(4)
 
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..#PACS_NoxiousWeed_Assessment') is not null
BEGIN
    DROP TABLE [#PACS_NoxiousWeed_Assessment]
END

CREATE TABLE #PACS_NoxiousWeed_Assessment
(
 [Owner]			varchar(70) null,
 Owner_id			int null,
 Prop_id			int null,
 Parcel_Number	    varchar(12) null,
 PACSyear_av		int null,
 PACSsup_num        int null,
 Agency_id		    int null,
 NWA_Type			varchar(3) null,
 NWA_Aggregate_PID  int null,
 NWA_Acres			int null,
 NWA_Supplemental   numeric(18,4) null,
 NWA_NTB_Parcel_Rate numeric(18,4) null,
 NWA_NTB_Acre_Rate   numeric(18,4) null,
 NWA_TBR_Parcel_Rate numeric(18,4) null,
 NWA_TBR_Acre_Rate   numeric(18,4) null,
 NWA_SAG_NTB_Count	int null,
 NWA_SAG_TBR_Count	int null,
 NWA_SAG_NTB_Acres	int null,
 NWA_SAG_TBR_Acres	int null,
 Land_Use_Cd        varchar(10) null,
 Exemption_Type_Cd  varchar(30),
 NWA_Assessment     numeric(18,4) null
)
 
  INSERT INTO #PACS_NoxiousWeed_Assessment 
  ([Owner], Owner_id, Prop_id, Parcel_Number, PACSyear_av, PACSsup_num, Agency_id, NWA_type, NWA_Aggregate_PID, NWA_Acres, NWA_Supplemental, NWA_NTB_Parcel_Rate, NWA_NTB_Acre_Rate, NWA_TBR_Parcel_Rate, NWA_TBR_Acre_Rate, NWA_SAG_NTB_Count, NWA_SAG_TBR_Count, NWA_SAG_NTB_Acres, NWA_SAG_TBR_Acres, Land_Use_Cd, Exemption_Type_Cd, NWA_Assessment)
  SELECT b.file_as_name, b.acct_id, a.prop_id, Left(a.geo_id,12), e.year, c.sup_num, e.agency_id, d.nwa_type, IsNull(d.nwa_aggregate_pid,0), d.nwa_acres, IsNull(d.nwa_supplemental,0), 0, 0, 0, 0, 0, 0, 0, 0, c.property_use_cd, '', 0
  FROM property As a, account As b, property_val  As c, user_property_val As d, property_special_assessment As e
  WHERE a.col_owner_id = b.acct_id AND a.prop_id = c.prop_id AND c.prop_id = d.prop_id AND d.prop_id = e.prop_id
  AND c.sup_num = 0 AND c.sup_num = d.sup_num AND d.sup_num = e.sup_num
  AND c.prop_val_yr = @AssessYear AND c.prop_val_yr = d.prop_val_yr AND d.prop_val_yr = e.year
  AND e.agency_id = 117
  AND IsNull(c.prop_inactive_dt,'1/1/1900') = '1/1/1900'
  ORDER BY b.file_as_name

  UPDATE #PACS_NoxiousWeed_Assessment
  SET NWA_SAG_NTB_Count = b.nwa_nonforestparcel_count, NWA_SAG_TBR_Count = b.nwa_forestparcel_count, NWA_SAG_NTB_Acres = b.nwa_nonforestacres_sum, NWA_SAG_TBR_Acres = b.nwa_forestacres_sum
  FROM #PACS_NoxiousWeed_Assessment As a, user_property_special_assessment As b
  WHERE a.Prop_id = b.prop_id AND a.PACSYear_av = b.year AND a.PACSsup_num = b.sup_num AND a.NWA_type = 'SAG'

  UPDATE #PACS_NoxiousWeed_Assessment
  SET NWA_NTB_Parcel_Rate = IsNull(b.nwa_nonforestparcel_rate,0), NWA_NTB_Acre_Rate = IsNull(b.nwa_nonforestacre_rate,0), NWA_TBR_Parcel_Rate = IsNull(b.nwa_forestparcel_rate,0), NWA_TBR_Acre_Rate = IsNull(b.nwa_forestacre_rate,0)
  FROM #PACS_NoxiousWeed_Assessment As a, user_special_assessment As b
  WHERE b.agency_id = 117 AND a.PACSYear_av = b.year
    
  UPDATE #PACS_NoxiousWeed_Assessment
  SET Exemption_Type_Cd = b.exmpt_type_cd + '  ' + IsNull(exmpt_subtype_cd,'')
  FROM #PACS_NoxiousWeed_Assessment As a, property_exemption As b
  WHERE a.Prop_id = b.prop_id AND a.PACSYear_av = b.exmpt_tax_yr AND a.PACSsup_num = b.sup_num
  
  UPDATE #PACS_NoxiousWeed_Assessment SET NWA_Assessment = NWA_NTB_Parcel_Rate + NWA_NTB_Acre_Rate * NWA_Acres
  WHERE NWA_Type = 'NTB' AND IsNull(NWA_Aggregate_PID, 0) = 0
  UPDATE #PACS_NoxiousWeed_Assessment SET NWA_Assessment = NWA_TBR_Parcel_Rate + NWA_TBR_Acre_Rate * NWA_Acres
  WHERE NWA_Type = 'TBR' AND IsNull(NWA_Aggregate_PID, 0) = 0
  UPDATE #PACS_NoxiousWeed_Assessment SET NWA_Assessment = NWA_Supplemental + NWA_NTB_Parcel_Rate * NWA_SAG_NTB_Count + NWA_NTB_Acre_Rate * NWA_SAG_NTB_Acres + NWA_TBR_Parcel_Rate * NWA_SAG_TBR_Count + NWA_TBR_Acre_Rate * NWA_SAG_TBR_Acres
  WHERE NWA_Type = 'SAG' AND IsNull(NWA_Aggregate_PID, 0) = 0
  
  SELECT * FROM #PACS_NoxiousWeed_Assessment  ORDER BY [Owner]
  
  --TOP AGGREGATE RATE PAYERS
  
--CREATE TABLE #Top_Rate_Payers (Owner_id int null, Owner varchar(70) null, Amount decimal(18,4) null)

--INSERT INTO #Top_Rate_Payers (Owner_id, Owner)
--SELECT Distinct Owner_id, Owner FROM #PACS_NoxiousWeed_Assessment
--WHERE IsNull(NWA_Aggregate_PID, 0) = 0

--UPDATE #Top_Rate_Payers SET Amount = b.AggregateAmt
--FROM #Top_Rate_Payers As a, (SELECT Owner_id, Sum(NWA_Assessment) As AggregateAmt FROM #PACS_NoxiousWeed_Assessment GROUP BY Owner_id) As b
--WHERE a.owner_id = b.owner_id 

--SELECT * FROM #Top_Rate_Payers ORDER BY Amount DESC

-- TOP SINGLE ASSESSMENT RATE PAYER

   --SELECT a.Owner_id, a.Owner, a.NWA_Assessment, a.NWA_Acres, a.Parcel_Number, b.legal_desc
   --FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
   --WHERE a.NWA_Type <> 'SAG'
   --AND a.Prop_id = b.prop_id AND a.PACSsup_num = b.sup_num AND a.PACSyear_av = b.prop_val_yr
   --ORDER BY NWA_Assessment DESC
  
GRANT EXECUTE ON [dbo].[Jefferson_GetNoxiousWeedAssessments] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetNoxiousWeedAssessments] TO [PUBLIC]

GO

