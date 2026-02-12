CREATE   PROCEDURE CreateFY_NY_SL_abs_subdv
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
    abs_subdv
(
    abs_subdv_cd
   ,abs_subdv_yr
   ,abs_subdv_desc
   ,abs_land_pct
   ,abs_imprv_pct
   ,abs_subdv_ind
   ,sys_flag
   ,changed_flag
   ,cInCounty
   ,bActive
   ,ls_id
   ,active_year
   ,create_date
)
SELECT 
    abs.abs_subdv_cd
    ,@lCopyToYear
    ,abs.abs_subdv_desc
    ,abs.abs_land_pct
    ,abs.abs_imprv_pct
    ,abs.abs_subdv_ind
    ,abs.sys_flag
    ,abs.changed_flag
    ,abs.cInCounty
    ,abs.bActive
    ,abs.ls_id
    ,abs.active_year
    ,abs.create_date
 FROM 
    abs_subdv as abs LEFT JOIN 
     (select abs_subdv_cd,@lInputFromYear as abs_subdv_yr
        from abs_subdv with (nolock) 
       where abs_subdv_yr = @lCopyToYear) as fy_abs
   on abs.abs_subdv_cd = fy_abs.abs_subdv_cd
 and abs.abs_subdv_yr = fy_abs.abs_subdv_yr

  where abs.abs_subdv_yr = @lInputFromYear
 and fy_abs.abs_subdv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

