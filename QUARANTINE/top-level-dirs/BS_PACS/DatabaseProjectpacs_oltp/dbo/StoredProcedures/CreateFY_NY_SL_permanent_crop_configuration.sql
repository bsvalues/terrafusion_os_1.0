CREATE PROCEDURE CreateFY_NY_SL_permanent_crop_configuration
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
insert permanent_crop_configuration
(
	[year],
	field_id,
	visible
)
SELECT 
    @lCopyToYear
    ,pcc.field_id
    ,pcc.visible
 FROM 
    permanent_crop_configuration as pcc LEFT JOIN 
     (select @lInputFromYear as config_yr, field_id, visible
		from permanent_crop_configuration with (nolock) 
		where [year] = @lCopyToYear) as fy_pcc
	on pcc.[year] = fy_pcc.config_yr
	and pcc.field_id = fy_pcc.field_id
 
	where pcc.[year] = @lInputFromYear
	and fy_pcc.config_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

