CREATE   PROCEDURE CreateFY_NY_SL_matrix_operator
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
    matrix_operator
(
    matrix_yr
   ,operator_cd
   ,operator_desc
)
SELECT 
    @lCopyToYear
    ,mo.operator_cd
    ,mo.operator_desc
 FROM 
    matrix_operator as mo LEFT JOIN 
     (select @lInputFromYear as matrix_yr,operator_cd
        from matrix_operator with (nolock) 
       where matrix_yr = @lCopyToYear) as fy_mo
   on mo.matrix_yr = fy_mo.matrix_yr
 and mo.operator_cd = fy_mo.operator_cd

  where mo.matrix_yr = @lInputFromYear
 and fy_mo.matrix_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

