CREATE   PROCEDURE CreateFY_NY_SL_mineral_import_entity_map
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
    mineral_import_entity_map
(
    year
   ,appr_company_id
   ,appr_company_entity_cd
   ,entity_id
   ,entity_in_cad
)
SELECT 
    @lCopyToYear
    ,miem.appr_company_id
    ,miem.appr_company_entity_cd
    ,miem.entity_id
    ,miem.entity_in_cad
 FROM 
    mineral_import_entity_map as miem LEFT JOIN 
     (select @lInputFromYear as year, appr_company_id, appr_company_entity_cd, entity_id
        from mineral_import_entity_map with (nolock) 
       where year = @lCopyToYear) as fy_miem
   on miem.year = fy_miem.year
  and miem.appr_company_id = fy_miem.appr_company_id
  and miem.appr_company_entity_cd = fy_miem.appr_company_entity_cd
  and miem.entity_id = fy_miem.entity_id
  where miem.year = @lInputFromYear
 and fy_miem.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

