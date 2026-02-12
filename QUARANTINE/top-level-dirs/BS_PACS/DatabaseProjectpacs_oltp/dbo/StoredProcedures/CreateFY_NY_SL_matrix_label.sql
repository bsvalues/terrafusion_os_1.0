CREATE   PROCEDURE CreateFY_NY_SL_matrix_label
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
    matrix_label
(
    matrix_yr
   ,label_cd
   ,label_desc
   ,matrix_type
)
SELECT 
    @lCopyToYear
    ,ml.label_cd
    ,ml.label_desc
    ,ml.matrix_type
 FROM 
    matrix_label as ml LEFT JOIN 
     (select @lInputFromYear as matrix_yr,label_cd,matrix_type
        from matrix_label with (nolock) 
       where matrix_yr = @lCopyToYear) as fy_ml
   on ml.matrix_yr = fy_ml.matrix_yr
 and ml.label_cd = fy_ml.label_cd
 and ml.matrix_type = fy_ml.matrix_type

  where ml.matrix_yr = @lInputFromYear
 and fy_ml.matrix_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

