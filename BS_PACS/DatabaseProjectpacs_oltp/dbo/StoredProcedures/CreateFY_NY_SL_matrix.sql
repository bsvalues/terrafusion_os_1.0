CREATE   PROCEDURE CreateFY_NY_SL_matrix
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
    matrix
(
    matrix_id
   ,matrix_yr
   ,label
   ,axis_1
   ,axis_2
   ,matrix_description
   ,operator
   ,default_cell_value
   ,bInterpolate
   ,matrix_type
	 ,matrix_sub_type_cd
)
SELECT 
    m.matrix_id
    ,@lCopyToYear
    ,m.label
    ,m.axis_1
    ,m.axis_2
    ,m.matrix_description
    ,m.operator
    ,m.default_cell_value
    ,m.bInterpolate
    ,m.matrix_type
		,m.matrix_sub_type_cd
 FROM 
    matrix as m LEFT JOIN 
     (select matrix_id,@lInputFromYear as matrix_yr
        from matrix with (nolock) 
       where matrix_yr = @lCopyToYear) as fy_m
   on m.matrix_id = fy_m.matrix_id
 and m.matrix_yr = fy_m.matrix_yr

  where m.matrix_yr = @lInputFromYear
 and fy_m.matrix_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

