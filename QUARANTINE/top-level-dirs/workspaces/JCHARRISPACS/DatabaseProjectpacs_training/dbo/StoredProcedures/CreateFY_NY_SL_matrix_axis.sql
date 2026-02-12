CREATE   PROCEDURE CreateFY_NY_SL_matrix_axis
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
    matrix_axis
(
    matrix_yr
   ,axis_cd
   ,data_type
   ,lookup_query
   ,matrix_type
)
SELECT 
    @lCopyToYear
    ,ma.axis_cd
    ,ma.data_type
    ,ma.lookup_query
    ,ma.matrix_type
 FROM 
    matrix_axis as ma LEFT JOIN 
     (select @lInputFromYear as matrix_yr,axis_cd,matrix_type
        from matrix_axis with (nolock) 
       where matrix_yr = @lCopyToYear) as fy_ma
   on ma.matrix_yr = fy_ma.matrix_yr
 and ma.axis_cd = fy_ma.axis_cd
 and ma.matrix_type = fy_ma.matrix_type

  where ma.matrix_yr = @lInputFromYear
 and fy_ma.matrix_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

