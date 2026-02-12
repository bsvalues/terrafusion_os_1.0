CREATE   PROCEDURE CreateFY_NY_SL_imprv_sched_detail_quality_comp
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
    imprv_sched_detail_quality_comp
(
    imprv_yr
   ,subject_quality_cd
   ,comp_quality_cd
   ,system_adj_factor
   ,user_adj_factor
   ,use_system_flag
--   ,adj_factor  -- this is a computed column
   ,szMethod
   ,szImprovMethod
)
SELECT 
    @lCopyToYear
    ,isdqc.subject_quality_cd
    ,isdqc.comp_quality_cd
    ,isdqc.system_adj_factor
    ,isdqc.user_adj_factor
    ,isdqc.use_system_flag
--    ,isdqc.adj_factor
    ,isdqc.szMethod
    ,isdqc.szImprovMethod
 FROM 
    imprv_sched_detail_quality_comp as isdqc LEFT JOIN 
     (select @lInputFromYear as imprv_yr,subject_quality_cd,comp_quality_cd
        from imprv_sched_detail_quality_comp with (nolock) 
       where imprv_yr = @lCopyToYear) as fy_isdqc
   on isdqc.imprv_yr = fy_isdqc.imprv_yr
 and isdqc.subject_quality_cd = fy_isdqc.subject_quality_cd
 and isdqc.comp_quality_cd = fy_isdqc.comp_quality_cd

  where isdqc.imprv_yr = @lInputFromYear
 and fy_isdqc.imprv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

