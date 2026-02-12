CREATE   PROCEDURE CreateFY_NY_SL_imprv_sched_matrix_assoc
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
    imprv_sched_matrix_assoc
(
    imprv_det_meth_cd
   ,imprv_det_type_cd
   ,imprv_det_class_cd
   ,imprv_yr
   ,matrix_id
   ,matrix_order
   ,adj_factor
   ,imprv_det_sub_class_cd
)
SELECT 
    isma.imprv_det_meth_cd
    ,isma.imprv_det_type_cd
    ,isma.imprv_det_class_cd
    ,@lCopyToYear
    ,isma.matrix_id
    ,isma.matrix_order
    ,isma.adj_factor
    ,isma.imprv_det_sub_class_cd
 FROM 
    imprv_sched_matrix_assoc as isma LEFT JOIN 
     (select @lInputFromYear as imprv_yr,imprv_det_meth_cd,imprv_det_type_cd,imprv_det_class_cd,imprv_det_sub_class_cd,matrix_id,matrix_order
        from imprv_sched_matrix_assoc with (nolock) 
       where imprv_yr = @lCopyToYear) as fy_isma
   on isma.imprv_yr = fy_isma.imprv_yr
 and isma.imprv_det_meth_cd = fy_isma.imprv_det_meth_cd
 and isma.imprv_det_type_cd = fy_isma.imprv_det_type_cd
 and isma.imprv_det_class_cd = fy_isma.imprv_det_class_cd
 and isma.imprv_det_sub_class_cd = fy_isma.imprv_det_sub_class_cd
 and isma.matrix_id = fy_isma.matrix_id
 and isma.matrix_order = fy_isma.matrix_order

  where isma.imprv_yr = @lInputFromYear
 and fy_isma.imprv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

