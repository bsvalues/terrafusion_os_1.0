CREATE PROCEDURE CreateFY_NY_SL_income_sched
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
    income_sched
(
    income_yr
   ,econ_area
   ,prop_type
   ,class_cd
   ,level_cd
   ,ocr
   ,mgmtr
   ,exp_rsf
   ,si_rsf
   ,tir
   ,rrr
   ,capr
   ,lease_rsf
   ,vacancy
   ,do_not_use_tax_rate
   ,triple_net_schedule
)
SELECT 
    @lCopyToYear
    ,prf.econ_area
    ,prf.prop_type
    ,prf.class_cd
    ,prf.level_cd
    ,prf.ocr
    ,prf.mgmtr
    ,prf.exp_rsf
    ,prf.si_rsf
    ,prf.tir
    ,prf.rrr
    ,prf.capr
    ,prf.lease_rsf
    ,prf.vacancy
    ,prf.do_not_use_tax_rate
    ,prf.triple_net_schedule
 FROM 
    income_sched as prf LEFT JOIN 
     (select @lInputFromYear as income_yr,econ_area,prop_type,class_cd,level_cd
        from income_sched with (nolock) 
       where income_yr = @lCopyToYear) as fy_prf
   on prf.income_yr = fy_prf.income_yr
 and prf.econ_area = fy_prf.econ_area
 and prf.prop_type = fy_prf.prop_type
 and prf.class_cd = fy_prf.class_cd
 and prf.level_cd = fy_prf.level_cd

  where prf.income_yr = @lInputFromYear
 and fy_prf.income_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

