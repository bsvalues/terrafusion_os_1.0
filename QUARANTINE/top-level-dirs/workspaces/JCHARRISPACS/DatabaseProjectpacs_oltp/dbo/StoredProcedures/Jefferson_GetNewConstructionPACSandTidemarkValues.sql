
CREATE PROCEDURE [dbo].[Jefferson_GetNewConstructionPACSandTidemarkValues]
   @AssessmentYear char(4),
   @NewConst_PropGroupCode varchar(10)
   
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

CREATE TABLE #newconstruction
(prop_group_cd varchar(20),
hood_cd varchar(10),
prop_id int,
geo_id varchar(10),
csm_caseno varchar(14),
csp_updated datetime,
bld_imp varchar(3),
bld_type varchar(3),
bld_proj_valu numeric(11,2),
PACS_ImpsAV numeric(14,0),
PACS_NC_AV numeric(14,0),
bld_sewer varchar(6),
bld_water varchar(10),
legal_desc varchar(255),
file_as_name varchar(70),
last_appraiser_id int,
last_appraiser varchar(30))

INSERT INTO #newconstruction
(prop_group_cd, hood_cd, prop_id, geo_id, csm_caseno, csp_updated, bld_imp, bld_type, bld_proj_valu, PACS_ImpsAV, PACS_NC_AV, bld_sewer, bld_water, legal_desc, file_as_name, last_appraiser_id, last_appraiser)
SELECT b.prop_group_cd, a.hood_cd, a.prop_id, c.geo_id, d.csm_caseno, d.csp_updated, e.bld_imp, e.bld_type, e.bld_proj_valu, (a.imprv_non_hstd_val + a.imprv_hstd_val) As PACS_ImpsAV, 0, e.bld_sewer, e.bld_water, a.legal_desc, '', Isnull(a.next_appraiser_id,0), ''
FROM property_val As a, prop_group_assoc As b, property As c, tidemark.pplan.dbo.case_parcel As d, tidemark.pplan.dbo.case_bld As e, wash_prop_owner_val As f
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = @AssessYear AND b.prop_group_cd = @NewConst_PropGroupCode
AND a.prop_id = c.prop_id AND c.geo_id = d.prc_parcel_no AND d.csm_caseno = e.csm_caseno
AND csp_updated > '1/1/2010' AND ISNULL(a.prop_inactive_dt,'1/1/1900') = '1/1/1900'
AND a.prop_id = f.prop_id AND a.prop_val_yr = f.year AND a.sup_num = f.sup_num
ORDER BY a.hood_cd, a.prop_id, d.csm_caseno

INSERT INTO #newconstruction
(prop_group_cd, hood_cd, prop_id, geo_id, csm_caseno, bld_imp, bld_type, bld_proj_valu, PACS_ImpsAV, PACS_NC_AV, bld_sewer, bld_water, legal_desc, file_as_name, last_appraiser_id, last_appraiser)
SELECT b.prop_group_cd, a.hood_cd, a.prop_id, c.geo_id, 'PACS', '', '', 0, (a.imprv_non_hstd_val + a.imprv_hstd_val) As PACS_ImpsAV, (d.new_val_hs + d.new_val_nhs) As PACS_NC_AV,  '', '', a.legal_desc, '', Isnull(a.next_appraiser_id,0), ''
FROM property_val As a, prop_group_assoc As b, property As c, wash_prop_owner_val As d
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = @AssessYear AND d.new_val_hs + d.new_val_nhs = 0
AND a.prop_id = c.prop_id AND b.prop_group_cd = @NewConst_PropGroupCode AND ISNULL(a.prop_inactive_dt,'1/1/1900') = '1/1/1900'
AND a.prop_id = d.prop_id AND a.prop_val_yr = d.year AND a.sup_num = d.sup_num AND a.sup_num = 0
ORDER BY a.hood_cd, a.prop_id

INSERT INTO #newconstruction
(prop_group_cd, hood_cd, prop_id, geo_id, csm_caseno, bld_imp, bld_type, bld_proj_valu, PACS_ImpsAV, PACS_NC_AV, bld_sewer, bld_water, legal_desc, file_as_name, last_appraiser_id, last_appraiser)
SELECT 'newconst', a.hood_cd, a.prop_id, b.geo_id, 'PACS', '', '', 0, (a.imprv_non_hstd_val + a.imprv_hstd_val) As PACS_ImpsAV, (c.new_val_hs + c.new_val_nhs) As PACS_NC_AV,  '', '', a.legal_desc, '', Isnull(a.next_appraiser_id,0), ''
FROM property_val As a, property As b, wash_prop_owner_val As c
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = @AssessYear AND c.new_val_hs + c.new_val_nhs > 0
AND a.prop_id = c.prop_id AND a.prop_val_yr = c.year AND a.sup_num = c.sup_num AND ISNULL(a.prop_inactive_dt,'1/1/1900') = '1/1/1900'
ORDER BY a.hood_cd, a.prop_id

UPDATE #newconstruction SET file_as_name = c.file_as_name
FROM #newconstruction As a, owner As b, account As c
WHERE a.prop_id = b.prop_id AND b.owner_id = c.acct_id AND b.owner_tax_yr = @AssessYear

UPDATE #newconstruction SET last_appraiser_id = Isnull(b.last_appraiser_id,0)
FROM #newconstruction As a, property_val As b
WHERE a.prop_id = b.prop_id AND b.prop_val_yr = @AssessYear AND a.last_appraiser_id = 0

UPDATE #newconstruction SET last_appraiser = b.appraiser_nm
FROM #newconstruction As a, appraiser As b
WHERE a.last_appraiser_id = b.appraiser_id

SELECT * FROM #newconstruction

GRANT EXECUTE ON [dbo].[Jefferson_GetNewConstructionPACSandTidemarkValues] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetNewConstructionPACSandTidemarkValues] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNewConstructionPACSandTidemarkValues] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNewConstructionPACSandTidemarkValues] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

