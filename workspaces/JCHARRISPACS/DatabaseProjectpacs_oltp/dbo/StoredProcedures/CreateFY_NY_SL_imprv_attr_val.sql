CREATE   PROCEDURE CreateFY_NY_SL_imprv_attr_val
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
    imprv_attr_val
(
    imprv_attr_id
   ,imprv_attr_val_cd
   ,imprv_det_meth_cd
   ,imprv_det_type_cd
   ,imprv_det_class_cd
   ,imprv_yr
   ,imprv_attr_base_up
   ,imprv_attr_up
   ,imprv_attr_base_incr
   ,imprv_attr_incr
   ,imprv_attr_pct
   ,imprv_attr_adj_factor
   ,imprv_attr_unit_cost
   ,imprv_det_sub_class_cd
)
SELECT 
    iav.imprv_attr_id
    ,iav.imprv_attr_val_cd
    ,iav.imprv_det_meth_cd
    ,iav.imprv_det_type_cd
    ,iav.imprv_det_class_cd
    ,@lCopyToYear
    ,iav.imprv_attr_base_up
    ,iav.imprv_attr_up
    ,iav.imprv_attr_base_incr
    ,iav.imprv_attr_incr
    ,iav.imprv_attr_pct
    ,iav.imprv_attr_adj_factor
    ,iav.imprv_attr_unit_cost
    ,iav.imprv_det_sub_class_cd
 FROM 
    imprv_attr_val as iav LEFT JOIN 
     (select imprv_attr_id,imprv_attr_val_cd,imprv_det_meth_cd,imprv_det_type_cd,imprv_det_class_cd,imprv_det_sub_class_cd,@lInputFromYear as imprv_yr
        from imprv_attr_val with (nolock) 
       where imprv_yr = @lCopyToYear) as fy_iav
   on iav.imprv_attr_id = fy_iav.imprv_attr_id
 and iav.imprv_attr_val_cd = fy_iav.imprv_attr_val_cd
 and iav.imprv_det_meth_cd = fy_iav.imprv_det_meth_cd
 and iav.imprv_det_type_cd = fy_iav.imprv_det_type_cd
 and iav.imprv_det_class_cd = fy_iav.imprv_det_class_cd
 and iav.imprv_det_sub_class_cd = fy_iav.imprv_det_sub_class_cd
 and iav.imprv_yr = fy_iav.imprv_yr

  where iav.imprv_yr = @lInputFromYear
 and fy_iav.imprv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

