CREATE   PROCEDURE CreateFY_NY_SL_depreciation
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
    depreciation
(
    type_cd
   ,deprec_cd
   ,year
   ,prop_type_cd
   ,description
)
SELECT 
    d.type_cd
    ,d.deprec_cd
    ,@lCopyToYear
    ,d.prop_type_cd
    ,d.description
 FROM 
    depreciation as d LEFT JOIN 
     (select type_cd,deprec_cd,@lInputFromYear as year,prop_type_cd
        from depreciation with (nolock) 
       where year = @lCopyToYear) as fy_d
   on d.type_cd = fy_d.type_cd
 and d.deprec_cd = fy_d.deprec_cd
 and d.year = fy_d.year
 and d.prop_type_cd = fy_d.prop_type_cd

  where d.year = @lInputFromYear
 and fy_d.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

