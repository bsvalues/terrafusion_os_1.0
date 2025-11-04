CREATE   PROCEDURE CreateFY_NY_SL_mineral_import_options
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
    mineral_import_options
(
    year
   ,appr_company_id
   ,exclude_zero_value_properties
   ,preview_record_count
)
SELECT 
    @lCopyToYear
    ,mio.appr_company_id
    ,mio.exclude_zero_value_properties
    ,mio.preview_record_count
 FROM 
    mineral_import_options as mio LEFT JOIN 
     (select @lInputFromYear as year,appr_company_id
        from mineral_import_options with (nolock) 
       where year = @lCopyToYear) as fy_mio
   on mio.year = fy_mio.year
 and mio.appr_company_id = fy_mio.appr_company_id

  where mio.year = @lInputFromYear
 and fy_mio.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

