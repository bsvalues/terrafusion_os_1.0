CREATE   PROCEDURE CreateFY_NY_SL_imprv_sched_attr
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
    imprv_sched_attr
(
    imprv_det_meth_cd
   ,imprv_det_type_cd
   ,imprv_det_class_cd
   ,imprv_yr
   ,imprv_attr_id
   ,use_up_for_pct_base
   ,imprv_det_sub_class_cd
)
SELECT 
    isa.imprv_det_meth_cd
    ,isa.imprv_det_type_cd
    ,isa.imprv_det_class_cd
    ,@lCopyToYear
    ,isa.imprv_attr_id
    ,isa.use_up_for_pct_base
    ,isa.imprv_det_sub_class_cd
 FROM 
    imprv_sched_attr as isa LEFT JOIN 
     (select @lInputFromYear as imprv_yr,imprv_det_meth_cd,imprv_det_type_cd,imprv_det_class_cd,imprv_det_sub_class_cd,imprv_attr_id
        from imprv_sched_attr with (nolock) 
       where imprv_yr = @lCopyToYear) as fy_isa
   on isa.imprv_yr = fy_isa.imprv_yr
 and isa.imprv_det_meth_cd = fy_isa.imprv_det_meth_cd
 and isa.imprv_det_type_cd = fy_isa.imprv_det_type_cd
 and isa.imprv_det_class_cd = fy_isa.imprv_det_class_cd
 and isa.imprv_det_sub_class_cd = fy_isa.imprv_det_sub_class_cd
 and isa.imprv_attr_id = fy_isa.imprv_attr_id

  where isa.imprv_yr = @lInputFromYear
 and fy_isa.imprv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

