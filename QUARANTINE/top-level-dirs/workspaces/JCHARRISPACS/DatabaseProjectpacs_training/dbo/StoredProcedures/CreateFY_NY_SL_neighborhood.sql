CREATE   PROCEDURE CreateFY_NY_SL_neighborhood
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
    neighborhood
(
    hood_cd
   ,hood_yr
   ,hood_name
   ,hood_land_pct
   ,hood_imprv_pct
   ,sys_flag
   ,changed_flag
   ,reappraisal_status
   ,life_cycle
   ,phys_comment
   ,eco_comment
   ,gov_comment
   ,soc_comment
   ,inactive
   ,inactive_date
   ,created_date
   ,cycle
   ,nbhd_descr
   ,nbhd_comment
   ,ls_id
   ,appraiser_id
)
SELECT 
    n.hood_cd
    ,@lCopyToYear
    ,n.hood_name
    ,n.hood_land_pct
    ,n.hood_imprv_pct
    ,n.sys_flag
    ,n.changed_flag
    ,n.reappraisal_status
    ,n.life_cycle
    ,n.phys_comment
    ,n.eco_comment
    ,n.gov_comment
    ,n.soc_comment
    ,n.inactive
    ,n.inactive_date
    ,n.created_date
    ,n.cycle
    ,n.nbhd_descr
    ,n.nbhd_comment
    ,n.ls_id
    ,n.appraiser_id
 FROM 
    neighborhood as n LEFT JOIN 
     (select hood_cd,@lInputFromYear as hood_yr
        from neighborhood with (nolock) 
       where hood_yr = @lCopyToYear) as fy_n
   on n.hood_cd = fy_n.hood_cd
 and n.hood_yr = fy_n.hood_yr

  where n.hood_yr = @lInputFromYear
 and fy_n.hood_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

