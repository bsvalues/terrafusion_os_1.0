CREATE   PROCEDURE CreateFY_NY_SL_imprv_sched_detail
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
    imprv_sched_detail
(
    imprv_det_meth_cd
   ,imprv_det_type_cd
   ,imprv_det_class_cd
   ,imprv_yr
   ,stories
   ,range_max
   ,range_price
   ,range_pc
   ,range_adj_price
   ,range_interpolate_inc
   ,imprv_det_sub_class_cd
)
SELECT 
    isd.imprv_det_meth_cd
    ,isd.imprv_det_type_cd
    ,isd.imprv_det_class_cd
    ,@lCopyToYear
    ,isd.stories
    ,isd.range_max
    ,isd.range_price
    ,isd.range_pc
    ,isd.range_adj_price
    ,isd.range_interpolate_inc
    ,isd.imprv_det_sub_class_cd
 FROM 
    imprv_sched_detail as isd LEFT JOIN 
     (select @lInputFromYear as imprv_yr,imprv_det_meth_cd,imprv_det_type_cd,imprv_det_class_cd,imprv_det_sub_class_cd,stories,range_max
        from imprv_sched_detail with (nolock) 
       where imprv_yr = @lCopyToYear) as fy_isd
   on isd.imprv_yr = fy_isd.imprv_yr
 and isd.imprv_det_meth_cd = fy_isd.imprv_det_meth_cd
 and isd.imprv_det_type_cd = fy_isd.imprv_det_type_cd
 and isd.imprv_det_class_cd = fy_isd.imprv_det_class_cd
 and isd.imprv_det_sub_class_cd = fy_isd.imprv_det_sub_class_cd
 and isd.stories = fy_isd.stories
 and isd.range_max = fy_isd.range_max

  where isd.imprv_yr = @lInputFromYear
 and fy_isd.imprv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

