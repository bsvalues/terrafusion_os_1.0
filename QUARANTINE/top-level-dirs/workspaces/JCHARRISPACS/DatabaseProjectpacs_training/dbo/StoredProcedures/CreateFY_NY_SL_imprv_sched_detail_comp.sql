CREATE   PROCEDURE CreateFY_NY_SL_imprv_sched_detail_comp
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
    imprv_sched_detail_comp
(
    imprv_det_meth_cd
   ,imprv_seg_type_cd
   ,imprv_seg_quality_cd
   ,imprv_yr
   ,sqft_max
   ,system_adj_factor
   ,user_adj_factor
   ,use_system_flag
   --,adj_factor   -- this is a computed column
   ,midpoint_flag
   ,szMethod
   ,imprv_det_sub_class_cd
)
SELECT 
    isdc.imprv_det_meth_cd
    ,isdc.imprv_seg_type_cd
    ,isdc.imprv_seg_quality_cd
    ,@lCopyToYear
    ,isdc.sqft_max
    ,isdc.system_adj_factor
    ,isdc.user_adj_factor
    ,isdc.use_system_flag
--    ,isdc.adj_factor
    ,isdc.midpoint_flag
    ,isdc.szMethod
    ,isdc.imprv_det_sub_class_cd
 FROM 
    imprv_sched_detail_comp as isdc LEFT JOIN 
     (select imprv_det_meth_cd,imprv_seg_type_cd,imprv_seg_quality_cd,@lInputFromYear as imprv_yr,sqft_max,imprv_det_sub_class_cd
        from imprv_sched_detail_comp with (nolock) 
       where imprv_yr = @lCopyToYear) as fy_isdc
   on isdc.imprv_det_meth_cd = fy_isdc.imprv_det_meth_cd
 and isdc.imprv_seg_type_cd = fy_isdc.imprv_seg_type_cd
 and isdc.imprv_seg_quality_cd = fy_isdc.imprv_seg_quality_cd
 and isdc.imprv_yr = fy_isdc.imprv_yr
 and isdc.sqft_max = fy_isdc.sqft_max
 and isdc.imprv_det_sub_class_cd = fy_isdc.imprv_det_sub_class_cd

  where isdc.imprv_yr = @lInputFromYear
 and fy_isdc.imprv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

