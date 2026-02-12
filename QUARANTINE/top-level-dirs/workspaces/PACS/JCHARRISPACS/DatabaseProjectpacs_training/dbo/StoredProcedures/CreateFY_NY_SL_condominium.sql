CREATE   PROCEDURE CreateFY_NY_SL_condominium
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
    condominium
(
    abs_subdv_cd
   ,abs_subdv_yr
   ,condo_group_num
   ,maint_level_cd
   ,complex_name
   ,plot_plan_cd
   ,year_built
   ,style_cd
   ,quality_cd
   ,material_cd
   ,hoa_fee
   ,interval_cd
   ,building_count
   ,phase_unit_count
   ,complex_unit_count
   ,handicap_unit_count
   ,stories
   ,owner_occupied
   ,phased_unit_dev
   ,converted_apts
   ,comment
   ,hood_cd
)
SELECT 
    c.abs_subdv_cd
    ,@lCopyToYear
    ,c.condo_group_num
    ,c.maint_level_cd
    ,c.complex_name
    ,c.plot_plan_cd
    ,c.year_built
    ,c.style_cd
    ,c.quality_cd
    ,c.material_cd
    ,c.hoa_fee
    ,c.interval_cd
    ,c.building_count
    ,c.phase_unit_count
    ,c.complex_unit_count
    ,c.handicap_unit_count
    ,c.stories
    ,c.owner_occupied
    ,c.phased_unit_dev
    ,c.converted_apts
    ,c.comment
    ,c.hood_cd
 FROM 
    condominium as c LEFT JOIN 
     (select abs_subdv_cd,@lInputFromYear as abs_subdv_yr
        from condominium with (nolock) 
       where abs_subdv_yr = @lCopyToYear) as fy_c
   on c.abs_subdv_cd = fy_c.abs_subdv_cd
 and c.abs_subdv_yr = fy_c.abs_subdv_yr

  where c.abs_subdv_yr = @lInputFromYear
 and fy_c.abs_subdv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

