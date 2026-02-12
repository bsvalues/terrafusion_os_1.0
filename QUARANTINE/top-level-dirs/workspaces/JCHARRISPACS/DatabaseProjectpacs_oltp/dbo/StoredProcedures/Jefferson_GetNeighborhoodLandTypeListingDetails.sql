
CREATE PROCEDURE [dbo].[Jefferson_GetNeighborhoodLandTypeListingDetails]
  @AssessmentYear char(4),
  @cycle VARCHAR(3)
AS
DECLARE
  @AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

CREATE TABLE #Neighborhood_Listing
(cycle int,
 hood_cd varchar(10),
 hood_desc varchar(100),
 hood_yr numeric(4,0),
 hood_land_pct numeric(5,2) null,
 hood_imprv_pct numeric(5,2) null,
 parcel_cnt int null,
 comments varchar(500) null,
 phys_comment varchar(500) null,
 eco_comment varchar(500) null,
 gov_comment varchar(500) null,
 soc_comment varchar(500) null
)

IF @cycle = 'ALL' OR @cycle = ''
BEGIN
INSERT INTO #Neighborhood_Listing (hood_cd, hood_desc, hood_yr, cycle, hood_land_pct, hood_imprv_pct, parcel_cnt, comments, phys_comment, eco_comment, gov_comment, soc_comment)
SELECT hood_cd, hood_name, hood_yr, cycle, hood_land_pct, hood_imprv_pct, 0, comments, phys_comment, eco_comment, gov_comment, soc_comment
FROM neighborhood
WHERE hood_yr = @AssessYear
END

IF @cycle <> 'ALL' AND @cycle <> ''
BEGIN
INSERT INTO #Neighborhood_Listing (hood_cd, hood_desc, hood_yr, cycle, hood_land_pct, hood_imprv_pct, parcel_cnt, comments, phys_comment, eco_comment, gov_comment, soc_comment)
SELECT hood_cd, hood_name, hood_yr, cycle, hood_land_pct, hood_imprv_pct, 0, comments, phys_comment, eco_comment, gov_comment, soc_comment
FROM neighborhood
WHERE hood_yr = @AssessYear AND cycle = Cast(@cycle As Int)
END

UPDATE #Neighborhood_Listing SET parcel_cnt = PropTally
FROM #Neighborhood_Listing As a, (SELECT hood_cd, Count(prop_id) As PropTally FROM property_val
 WHERE prop_val_yr = @AssessYear AND sup_num = 0 AND isnull(prop_inactive_dt, '1/1/1900') = '1/1/1900'
 GROUP BY hood_cd) As b
WHERE a.hood_cd = b.hood_cd 

CREATE TABLE #Neighborhood_Abstract_Listing
(cycle int,
 hood_cd varchar(10),
 abs_subdv_cd varchar(10)
 )

INSERT INTO #Neighborhood_Abstract_Listing
SELECT DISTINCT cycle, hood_cd, abs_subdv_cd
FROM property_val
WHERE prop_val_yr = @AssessYear AND prop_inactive_dt IS NULL 


CREATE TABLE #Neighborhood_LandCodeListing
(type_cycle int,
 type_hood_cd varchar(10),
 code_type varchar (10),
 land_type varchar(10),
 land_type_desc varchar(50),
 land_type_unit_value numeric(16,2),
 appraisal_method_type varchar (50),
 appraisal_matrix_table varchar(50),
 activelinesegments int
 )
 
-- Add Market Value Matrixes for Cycle 1 that have the neigborhood code in the Land_Type or Exempt or Tidelands
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 1, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id BETWEEN 270 AND 273 OR b.matrix_id = 276)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND (Left(a.hood_cd,4) = Left(b.axis_2_value,4) OR b.axis_2_value = 'COMAREA' OR b.axis_2_value = 'EXEMPT' OR b.axis_2_value LIKE '930%')

-- Add Market Value Matrixes for Cycle 1 Territorial Acres
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 1, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND b.matrix_id = 270
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND Len(b.axis_2_value) = 5
AND (b.axis_2_value Like '157%A' OR b.axis_2_value Like '167%A' OR b.axis_2_value Like '177%A' OR b.axis_2_value Like '187%A'  OR b.axis_2_value Like '197%A')

-- Add Market Value Matrixes for Cycle 1 that have the abs/subdv code in the Land_Type
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 1, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e, #Neighborhood_Abstract_Listing As f
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id BETWEEN 270 AND 273 OR b.matrix_id = 276)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd AND a.hood_cd = f.hood_cd
AND Left(f.abs_subdv_cd,4) = Left(b.axis_2_value,4)

-- Add Market Value Matrixes for Cycle 2 that have the neigborhood code in the Land_Type or Exempt or Tidelands
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 2, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id BETWEEN 279 AND 281 OR b.matrix_id BETWEEN 283 AND 284)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND (Left(a.hood_cd,4) = Left(b.axis_2_value,4) OR b.axis_2_value = 'COMAREA' OR b.axis_2_value = 'EXEMPT' OR b.axis_2_value LIKE '930%')

-- Add Market Value Matrixes for Cycle 2 Territorial Acres
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 1, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND b.matrix_id = 279
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND Len(b.axis_2_value) = 5
AND (b.axis_2_value Like '157%A' OR b.axis_2_value Like '167%A' OR b.axis_2_value Like '177%A' OR b.axis_2_value Like '187%A'  OR b.axis_2_value Like '197%A')

-- Add Market Value Matrixes for Cycle 2 that have the abs/subdv code in the Land_Type
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 2, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e, #Neighborhood_Abstract_Listing As f
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id BETWEEN 279 AND 281 OR b.matrix_id BETWEEN 283 AND 284)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd AND a.hood_cd = f.hood_cd
AND Left(f.abs_subdv_cd,4) = Left(b.axis_2_value,4)

-- Add Market Value Matrixes for Cycle 2 that are West End neigborhoods and have a Land Type of WEST or Exempt or Tidelands
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 2, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND ((b.matrix_id BETWEEN 280 AND 281) OR (b.matrix_id BETWEEN 323 AND 324))
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND (a.hood_cd BETWEEN '2700' AND '2800') AND ((b.axis_2_value = 'COMAREA' or b.axis_2_value = 'EXEMPT' OR Left(b.axis_2_value,4) = 'WEST'))

-- Add Market Value Matrixes for Cycle 3 that have the neigborhood code in the Land_Type or Exempt or Tidelands
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 3, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id = 294 OR b.matrix_id BETWEEN 296 AND 299)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND (Left(a.hood_cd,4) = Left(b.axis_2_value,4) OR b.axis_2_value = 'COMAREA' OR b.axis_2_value = 'EXEMPT' OR b.axis_2_value = '9301')

-- Add Market Value Matrixes for Cycle 3 that have the abs/subdv code in the Land_Type
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 3, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e, #Neighborhood_Abstract_Listing As f
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id = 294 OR b.matrix_id BETWEEN 296 AND 299)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd AND a.hood_cd = f.hood_cd
AND Left(f.abs_subdv_cd,4) = Left(b.axis_2_value,4)

-- Add Market Value Matrixes for Cycle 4 that have the neigborhood code in the Land_Type or Exempt or Tidelands
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 4, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id = 301 OR b.matrix_id BETWEEN 303 AND 306)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND (Left(a.hood_cd,4) = Left(b.axis_2_value,4) OR b.axis_2_value = 'COMAREA' OR b.axis_2_value = 'EXEMPT' OR b.axis_2_value = '9301')

-- Add Market Value Matrixes for Cycle 4 that have the abs/subdv code in the Land_Type
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 4, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e, #Neighborhood_Abstract_Listing As f
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id = 301 OR b.matrix_id BETWEEN 303 AND 306)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd AND a.hood_cd = f.hood_cd
AND Left(f.abs_subdv_cd,4) = Left(b.axis_2_value,4)

-- Add Market Value Matrixes for Cycle 5 that have the neigborhood code in the Land_Type or Exempt or Tidelands
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 5, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id = 308 OR b.matrix_id BETWEEN 310 AND 313)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND (Left(a.hood_cd,4) = Left(b.axis_2_value,4) OR b.axis_2_value = 'COMAREA' OR b.axis_2_value = 'EXEMPT' OR b.axis_2_value = '9301')

-- Add Market Value Matrixes for Cycle 5 that have the abs/subdv code in the Land_Type
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 5, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e, #Neighborhood_Abstract_Listing As f
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id = 308 OR b.matrix_id BETWEEN 310 AND 313)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd AND a.hood_cd = f.hood_cd
AND Left(f.abs_subdv_cd,4) = Left(b.axis_2_value,4)

-- Add Market Value Matrixes for Cycle 6 that have the neigborhood code in the Land_Type or Exempt or Tidelands
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 6, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id = 315 OR b.matrix_id BETWEEN 317 AND 320)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND (Left(a.hood_cd,4) = Left(b.axis_2_value,4) OR b.axis_2_value = 'COMAREA' OR b.axis_2_value = 'EXEMPT' OR b.axis_2_value = '9301')

-- Add Market Value Matrixes for Cycle 6 that have the abs/subdv code in the Land_Type
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 6, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e, #Neighborhood_Abstract_Listing As f
WHERE a.hood_yr = b.matrix_yr AND a.cycle = Cast(Isnull(b.axis_1_value,'0') As int)
AND (b.matrix_id = 315 OR b.matrix_id BETWEEN 317 AND 320)
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd AND a.hood_cd = f.hood_cd
AND Left(f.abs_subdv_cd,4) = Left(b.axis_2_value,4)

-- Add Market Value Large Acreage Matrix for Cycle 1
--INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
--SELECT 1, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
--FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
--WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
--AND (b.matrix_id = 277)
--AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
--AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
--AND d.ls_method = e.land_meth_cd
--AND IsNull(b.cell_value,0) > 1

-- Add Market Value Large Acreage Matrix for Cycle 2
--INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
--SELECT 2, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
--FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
--WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
--AND b.matrix_id = 285
--AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
--AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
--AND d.ls_method = e.land_meth_cd
--AND IsNull(b.cell_value,0) > 1

-- Add Market Value Large Acreage Matrix for Cycle 3
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 3, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 293
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

-- Add Market Value Large Acreage Matrix for Cycle 4
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 4, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 300
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

-- Add Market Value Large Acreage Matrix for Cycle 5
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 5, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 307
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

-- Add Market Value Large Acreage Matrix for Cycle 6
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 6, a.hood_cd, '1-Mkt', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 314
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

UPDATE #Neighborhood_LandCodeListing
SET land_type_desc = b.land_type_desc
FROM #Neighborhood_LandCodeListing As a, land_type As b
WHERE a.land_type = b.land_type_cd

UPDATE #Neighborhood_LandCodeListing
SET activelinesegments = d.linesegcount
FROM #Neighborhood_LandCodeListing As c, 
(SELECT b.hood_cd, a.land_type_cd, count(a.land_seg_id) As linesegcount FROM land_detail As a,property_val As b
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND b.prop_inactive_dt IS NULL AND a.prop_val_yr = @AssessYear
GROUP BY hood_cd, land_type_cd) As d
WHERE c.type_hood_cd = d.hood_cd AND c.land_type = d.land_type_cd

-- Add Current Use Ag Values for Cycle 1
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 1, a.hood_cd, '2-AG', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 278
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

-- Add Current Use Ag Values for Cycle 2
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 2, a.hood_cd, '2-AG', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 282
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

-- Add Current Use Ag Values for Cycle 3
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 3, a.hood_cd, '2-AG', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 295
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

-- Add Current Use Ag Values for Cycle 4
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 4, a.hood_cd, '2-AG', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 302
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

-- Add Current Use Ag Values for Cycle 5
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 5, a.hood_cd, '2-AG', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 309
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

-- Add Current Use Ag Values for Cycle 6
INSERT INTO #Neighborhood_LandCodeListing (type_cycle, type_hood_cd, code_type, land_type, land_type_desc, land_type_unit_value, appraisal_method_type, appraisal_matrix_table, activelinesegments)
SELECT 6, a.hood_cd, '2-AG', b.axis_2_value, '', b.cell_value, RTrim(e.land_meth_cd) + '(' + e.land_meth_desc + ')' , d.ls_code, 0
FROM a.#Neighborhood_Listing as a, matrix_detail As b, land_sched_matrix_assoc As c, land_sched As d, land_meth As e
WHERE a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value
AND b.matrix_id = 316
AND b.matrix_id = c.matrix_id AND b.matrix_yr = c.ls_year
AND c.ls_year = d.ls_year AND c.ls_id = d.ls_id
AND d.ls_method = e.land_meth_cd
AND IsNull(b.cell_value,0) > 1

UPDATE #Neighborhood_LandCodeListing
SET activelinesegments = d.linesegcount
FROM #Neighborhood_LandCodeListing As c, 
(SELECT b.hood_cd, a.land_class_code, count(a.land_seg_id) As linesegcount FROM land_detail As a,property_val As b
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND b.prop_inactive_dt IS NULL AND a.prop_val_yr = @AssessYear
GROUP BY hood_cd, land_class_code) As d
WHERE c.type_hood_cd = d.hood_cd AND c.land_type = d.land_class_code

UPDATE #Neighborhood_LandCodeListing
SET land_type_desc = Left(b.szLandClassDesc,50)
FROM #Neighborhood_LandCodeListing As a, land_class As b
WHERE a.land_type = b.szLandClassCode

SELECT a.*, b.* FROM #Neighborhood_Listing As a, #Neighborhood_LandCodeListing As b
WHERE a.hood_cd = b.type_hood_cd
ORDER BY a.cycle, a.hood_cd, b.land_type

GRANT EXECUTE ON [dbo].[Jefferson_GetNeighborhoodLandTypeListingDetails] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetNeighborhoodLandTypeListingDetails] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNeighborhoodLandTypeListingDetails] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNeighborhoodLandTypeListingDetails] TO PUBLIC
    AS [dbo];


GO

