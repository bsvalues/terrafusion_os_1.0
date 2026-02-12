
CREATE PROCEDURE [dbo].[Jefferson_CycleFieldBookListing]
  @AssessmentYear char(4)
  
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

CREATE TABLE #PACS_FieldBook_List
( 
 Year_AV		  int null,
 Cycle            int null,
 Neighborhood     varchar(10) null,
 Neighborhood_Desc varchar(100) null,
 School_Dist      varchar(20) null,
 Book             varchar(10) null,
 Field_Book       numeric(14,0) null
 )

INSERT INTO #PACS_FieldBook_List (Year_AV, Cycle, Neighborhood, School_Dist, Book, Field_Book)
SELECT DISTINCT @AssessYear, cycle, hood_cd, '2-WESTEND', Left(book_page,3), 0
FROM property_val WHERE prop_val_yr = @AssessYear AND sup_num = 0
AND hood_cd BETWEEN '2700' AND '2800' AND Left(book_page,3) > '800'

INSERT INTO #PACS_FieldBook_List (Year_AV, Cycle, Neighborhood, School_Dist, Book, Field_Book)
SELECT DISTINCT @AssessYear, cycle, hood_cd, '2-SD48', Left(book_page,3), 0
FROM property_val WHERE prop_val_yr = @AssessYear AND sup_num = 0
AND hood_cd BETWEEN '2000' AND '2660'

INSERT INTO #PACS_FieldBook_List (Year_AV, Cycle, Neighborhood, School_Dist, Book, Field_Book)
SELECT DISTINCT @AssessYear, cycle, hood_cd, '5 / 2-SD50/SD323 *', Left(book_page,3), 0
FROM property_val WHERE prop_val_yr = @AssessYear AND sup_num = 0
AND hood_cd BETWEEN '2665' AND '2695'

INSERT INTO #PACS_FieldBook_List (Year_AV, Cycle, Neighborhood, School_Dist, Book, Field_Book)
SELECT DISTINCT @AssessYear, cycle, hood_cd, '1-SD46', Left(book_page,3), 0
FROM property_val WHERE prop_val_yr = @AssessYear AND sup_num = 0 AND Left(hood_cd,1) = '1'

INSERT INTO #PACS_FieldBook_List (Year_AV, Cycle, Neighborhood, School_Dist, Book, Field_Book)
SELECT DISTINCT @AssessYear, cycle, hood_cd, '3 / 4-SD49', Left(book_page,3), 0
FROM property_val WHERE prop_val_yr = @AssessYear AND sup_num = 0 AND (Left(hood_cd,1) = '3' OR Left(hood_cd,1) = '4')
 --AND Left(book_page,3) < '170'

INSERT INTO #PACS_FieldBook_List (Year_AV, Cycle, Neighborhood, School_Dist, Book, Field_Book)
SELECT DISTINCT @AssessYear, cycle, hood_cd, '5-SD50/SD323 *', Left(book_page,3), 0
FROM property_val WHERE prop_val_yr = @AssessYear AND sup_num = 0
AND Left(hood_cd,1) = '5'

INSERT INTO #PACS_FieldBook_List (Year_AV, Cycle, Neighborhood, School_Dist, Book, Field_Book)
SELECT DISTINCT @AssessYear, cycle, hood_cd, '6-CITYofPT', Left(book_page,3), 0
FROM property_val WHERE prop_val_yr = @AssessYear AND sup_num = 0 AND Left(hood_cd,1) = '6'

DELETE FROM #PACS_FieldBook_List
WHERE Right(book,1) = '/' OR Substring(book,2,1) = '/' OR IsNull(book,'') = '' OR book = '000'

UPDATE #PACS_FieldBook_List SET Field_Book = Cast(Book As Int) FROM #PACS_FieldBook_List


UPDATE #PACS_FieldBook_List SET Neighborhood_Desc = B.hood_name
FROM #PACS_FieldBook_List As a, neighborhood As b
WHERE a.Neighborhood = b.hood_cd AND A.Year_AV = B.hood_yr

SELECT * FROM #PACS_FieldBook_List ORDER By School_Dist, Field_Book, Neighborhood

GRANT EXECUTE ON [dbo].[Jefferson_CycleFieldBookListing] TO [COUNTY\Assesor's Office]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_CycleFieldBookListing] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

