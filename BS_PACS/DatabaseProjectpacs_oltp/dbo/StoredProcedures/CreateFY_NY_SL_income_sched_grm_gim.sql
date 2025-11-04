CREATE PROCEDURE CreateFY_NY_SL_income_sched_grm_gim
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
		income_sched_grm_gim
(
		[year],
		prop_type_cd,
		class_cd,
		econ_cd,
		level_cd,
		potential_gross_income_annual,
		potential_gross_income_monthly,
		gross_income_multiplier,
		gross_rent_multiplier
)
SELECT 
    @lCopyToYear,
		prf.prop_type_cd,
		prf.class_cd,
		prf.econ_cd,
		prf.level_cd,
		prf.potential_gross_income_annual,
		prf.potential_gross_income_monthly,
		prf.gross_income_multiplier,
		prf.gross_rent_multiplier
    
 FROM 
    income_sched_grm_gim as prf LEFT JOIN 
     (select @lInputFromYear as [year],prop_type_cd,class_cd,econ_cd,level_cd
        from income_sched_grm_gim with (nolock) 
       where [year] = @lCopyToYear) as fy_prf
   on prf.[year] = fy_prf.[year]
 and prf.prop_type_cd = fy_prf.prop_type_cd
 and prf.class_cd = fy_prf.class_cd
 and prf.econ_cd = fy_prf.econ_cd
 and prf.level_cd = fy_prf.level_cd

  where prf.[year] = @lInputFromYear
 and fy_prf.[year] is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

