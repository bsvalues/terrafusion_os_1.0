
CREATE PROCEDURE [dbo].[Jefferson_GetNeighborhoodLandTypeValuesComparison]
  @AssessmentYear char(4),
  @cycle VARCHAR(3)
AS
DECLARE
  @AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

CREATE TABLE #Neighborhood_ValueListing
(cycle int,
 hood_cd varchar(10),
 hood_yr numeric(4,0),
 land_type_method varchar(30),
 matrix_id integer,
 land_type_cd varchar(10),
 land_type_cd_short varchar(10),
 land_type_cd_rate numeric(16,2),
 land_type_cd_desc varchar(200)
)

IF @cycle = '1'
BEGIN
INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '1-Lots', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 272 AND b.axis_1_value = 1

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '2-Sites', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 271 AND b.axis_1_value = 1

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '3-Frt Ft', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 273 AND b.axis_1_value = 1
AND b.axis_2_value <> '9301F'

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '4-Sq Ft', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 276 AND b.axis_1_value = 1

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '5-Acres', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 270 AND b.axis_1_value = 1
AND b.axis_2_value <> 'EXEMPT'

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, 'ALL', @AssessYear, '5-Acres', matrix_id, axis_2_value, axis_2_value, cell_value, ''
FROM matrix_detail WHERE matrix_yr = @AssessYear AND matrix_id = 270 AND axis_1_value = 1 AND Right(axis_2_value,1) = 'A' AND Len(axis_2_value) = 5

--INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
--SELECT @cycle, a.hood_cd, a.hood_yr, '5b-Acres Base', b.matrix_id, b.axis_2_value, Left(b.axis_2_value,4), b.cell_value, ''
--FROM neighborhood As a, matrix_detail As b
--WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = b.axis_1_value AND b.matrix_id = 277 and IsNull(b.cell_value,1) > 1

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
VALUES (@cycle, 'ALL', @AssessYear, '6-Other', 273, '9301F', '9301', 20, '')
INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
VALUES (@cycle, 'ALL', @AssessYear, '6-Other', 270, 'EXEMPT', 'EXEM', 0, '')
INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, 'ALL', @AssessYear, '6-Other', matrix_id, axis_2_value, axis_2_value, cell_value, 'Current Use Ag'
FROM matrix_detail WHERE matrix_yr = @AssessYear AND matrix_id = 278 AND axis_1_value = 1
END

IF @cycle = '2'
BEGIN
INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '1-Lots', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 281 AND b.axis_1_value = 2

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '2-Sites', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 283 AND b.axis_1_value = 2

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '3-Frt Ft', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 280 AND b.axis_1_value = 2
AND (b.axis_2_value <> '9301F' AND b.axis_2_value <> '9302F')

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '4-Sq Ft', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 284 AND b.axis_1_value = 2

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, a.hood_cd, a.hood_yr, '5-Acres', b.matrix_id, b.axis_2_value, Substring(b.axis_2_value,6,4), b.cell_value, ''
FROM neighborhood As a, matrix_detail As b
WHERE hood_yr = @AssessYear AND a.hood_yr = b.matrix_yr AND a.hood_cd = Left(b.axis_2_value,4) AND b.matrix_id = 279 AND b.axis_1_value = 2
AND b.axis_2_value <> 'EXEMPT'

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, 'ALL', @AssessYear, '5-Acres', matrix_id, axis_2_value, axis_2_value, cell_value, ''
FROM matrix_detail WHERE matrix_yr = @AssessYear AND matrix_id = 279 AND axis_1_value = 2 AND Right(axis_2_value,1) = 'A' AND Len(axis_2_value) = 5

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
VALUES (@cycle, 'ALL', @AssessYear, '6-Other', 280, '9301F', '9301', 20, '')
INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
VALUES (@cycle, 'ALL', @AssessYear, '6-Other', 280, '9302F', '9302', 10, '')
INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
VALUES (@cycle, 'ALL', @AssessYear, '6-Other', 279, 'EXEMPT', 'EXEM', 0, '')
INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, 'ALL', @AssessYear, '6-Other', matrix_id, axis_2_value, axis_2_value, cell_value, 'Current Use Ag'
FROM matrix_detail WHERE matrix_yr = @AssessYear AND matrix_id = 278 AND axis_1_value = 2
END

INSERT INTO #Neighborhood_ValueListing (cycle, hood_cd, hood_yr, land_type_method, matrix_id, land_type_cd, land_type_cd_short, land_type_cd_rate, land_type_cd_desc)
SELECT @cycle, 'ALL', @AssessYear, '6-Other', matrix_id, axis_1_value, 'DFL-' + axis_1_value, cell_value, 'DFL OS-T'
FROM matrix_detail WHERE matrix_yr = @AssessYear AND matrix_id = 92 AND axis_2_value = '*'

UPDATE #Neighborhood_ValueListing SET land_type_cd_desc = b.land_type_desc
FROM #Neighborhood_ValueListing As a, land_type As b
WHERE a.land_type_cd = b.land_type_cd

SELECT * FROM #Neighborhood_ValueListing
ORDER BY land_type_method, land_type_cd_short, hood_cd

GRANT EXECUTE ON [dbo].[Jefferson_GetNeighborhoodLandTypeValuesComparison] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetNeighborhoodLandTypeValuesComparison] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNeighborhoodLandTypeValuesComparison] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNeighborhoodLandTypeValuesComparison] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

