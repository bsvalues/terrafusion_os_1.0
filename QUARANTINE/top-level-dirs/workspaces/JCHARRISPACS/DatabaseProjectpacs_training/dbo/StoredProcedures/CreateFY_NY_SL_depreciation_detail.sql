CREATE   PROCEDURE CreateFY_NY_SL_depreciation_detail
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
    depreciation_detail
(
    type_cd
   ,deprec_cd
   ,year
   ,prop_type_cd
   ,deprec_year_max
   ,deprec_year_pct
)
SELECT 
    dd.type_cd
    ,dd.deprec_cd
    ,@lCopyToYear
    ,dd.prop_type_cd
    ,dd.deprec_year_max
    ,dd.deprec_year_pct
 FROM 
    depreciation_detail as dd LEFT JOIN 
     (select type_cd,deprec_cd,@lInputFromYear as year,prop_type_cd,deprec_year_max 
        from depreciation_detail with (nolock) 
       where year = @lCopyToYear) as fy_dd
   on dd.type_cd = fy_dd.type_cd
 and dd.deprec_cd = fy_dd.deprec_cd
 and dd.year = fy_dd.year
 and dd.prop_type_cd = fy_dd.prop_type_cd
 and dd.deprec_year_max = fy_dd.deprec_year_max

  where dd.year = @lInputFromYear
 and fy_dd.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

