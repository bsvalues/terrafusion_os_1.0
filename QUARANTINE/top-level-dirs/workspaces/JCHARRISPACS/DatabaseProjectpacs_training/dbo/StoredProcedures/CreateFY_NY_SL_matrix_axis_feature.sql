CREATE   PROCEDURE CreateFY_NY_SL_matrix_axis_feature
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)

declare @proc varchar(500)
    set @proc = object_name(@@procid)

SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    matrix_axis_feature
(
    lYear
   ,szAxisCd
   ,lAttributeID
)
SELECT 
    @lCopyToYear
    ,maf.szAxisCd
    ,maf.lAttributeID
 FROM 
    matrix_axis_feature as maf LEFT JOIN 
     (select @lInputFromYear as lYear,szAxisCd
        from matrix_axis_feature with (nolock) 
       where lYear = @lCopyToYear) as fy_maf
   on maf.lYear = fy_maf.lYear
 and maf.szAxisCd = fy_maf.szAxisCd

  where maf.lYear = @lInputFromYear
 and fy_maf.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

