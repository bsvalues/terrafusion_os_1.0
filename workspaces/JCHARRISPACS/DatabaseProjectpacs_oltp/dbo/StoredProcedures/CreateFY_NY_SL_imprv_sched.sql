CREATE   PROCEDURE CreateFY_NY_SL_imprv_sched
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
    imprv_sched
(
    imprv_det_meth_cd
   ,imprv_det_type_cd
   ,imprv_det_class_cd
   ,imprv_yr
   ,imprv_pc_of_base
   ,imprv_interpolate
   ,imprv_use_mult
   ,imprv_sched_area_type_cd
   ,imprv_sched_mult_type
   ,imprv_sched_mult_form
   ,imprv_sched_mult_quality_cd
   ,imprv_sched_mult_section_cd
   ,imprv_sched_mult_local_quality_cd
   ,imprv_sched_deprec_cd
   ,imprv_sched_slope_intercept
   ,imprv_sched_value_type
   ,imprv_det_sub_class_cd
)
SELECT 
    imprvs.imprv_det_meth_cd
    ,imprvs.imprv_det_type_cd
    ,imprvs.imprv_det_class_cd
    ,@lCopyToYear
    ,imprvs.imprv_pc_of_base
    ,imprvs.imprv_interpolate
    ,imprvs.imprv_use_mult
    ,imprvs.imprv_sched_area_type_cd
    ,imprvs.imprv_sched_mult_type
    ,imprvs.imprv_sched_mult_form
    ,imprvs.imprv_sched_mult_quality_cd
    ,imprvs.imprv_sched_mult_section_cd
    ,imprvs.imprv_sched_mult_local_quality_cd
    ,imprvs.imprv_sched_deprec_cd
    ,imprvs.imprv_sched_slope_intercept
    ,imprvs.imprv_sched_value_type
    ,imprvs.imprv_det_sub_class_cd
 FROM 
    imprv_sched as imprvs LEFT JOIN 
     (select @lInputFromYear as imprv_yr,imprv_det_meth_cd,imprv_det_type_cd,imprv_det_class_cd,imprv_det_sub_class_cd
        from imprv_sched with (nolock) 
       where imprv_yr = @lCopyToYear) as fy_imprvs
   on imprvs.imprv_yr = fy_imprvs.imprv_yr
 and imprvs.imprv_det_meth_cd = fy_imprvs.imprv_det_meth_cd
 and imprvs.imprv_det_type_cd = fy_imprvs.imprv_det_type_cd
 and imprvs.imprv_det_class_cd = fy_imprvs.imprv_det_class_cd
 and imprvs.imprv_det_sub_class_cd = fy_imprvs.imprv_det_sub_class_cd

  where imprvs.imprv_yr = @lInputFromYear
 and fy_imprvs.imprv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

