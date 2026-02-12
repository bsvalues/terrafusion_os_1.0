CREATE   PROCEDURE CreateFY_NY_SL_land_sched_matrix_assoc
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
    land_sched_matrix_assoc
(
    ls_id
   ,ls_year
   ,matrix_id
   ,matrix_order
   ,adj_factor
)
SELECT 
    lsma.ls_id
    ,@lCopyToYear
    ,lsma.matrix_id
    ,lsma.matrix_order
    ,lsma.adj_factor
 FROM 
    land_sched_matrix_assoc as lsma LEFT JOIN 
     (select ls_id,@lInputFromYear as ls_year,matrix_id,matrix_order
        from land_sched_matrix_assoc with (nolock) 
       where ls_year = @lCopyToYear) as fy_lsma
   on lsma.ls_id = fy_lsma.ls_id
 and lsma.ls_year = fy_lsma.ls_year
 and lsma.matrix_id = fy_lsma.matrix_id
 and lsma.matrix_order = fy_lsma.matrix_order

  where lsma.ls_year = @lInputFromYear
 and fy_lsma.ls_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

