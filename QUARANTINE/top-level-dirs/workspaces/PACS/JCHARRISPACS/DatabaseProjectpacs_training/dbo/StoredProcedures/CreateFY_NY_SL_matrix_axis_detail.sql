CREATE   PROCEDURE CreateFY_NY_SL_matrix_axis_detail
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
    matrix_axis_detail
(
    matrix_id
   ,matrix_yr
   ,axis_value
   ,axis_number
   ,axis_order
)
SELECT 
    md.matrix_id
    ,@lCopyToYear
    ,md.axis_value
    ,md.axis_number
    ,md.axis_order
 FROM 
    matrix_axis_detail as md LEFT JOIN 
     (select matrix_id,@lInputFromYear as matrix_yr,axis_value,axis_number
        from matrix_axis_detail with (nolock) 
       where matrix_yr = @lCopyToYear) as fy_md
   on md.matrix_id = fy_md.matrix_id
 and md.matrix_yr = fy_md.matrix_yr
 and md.axis_value = fy_md.axis_value
 and md.axis_number = fy_md.axis_number

  where md.matrix_yr = @lInputFromYear
 and fy_md.matrix_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

