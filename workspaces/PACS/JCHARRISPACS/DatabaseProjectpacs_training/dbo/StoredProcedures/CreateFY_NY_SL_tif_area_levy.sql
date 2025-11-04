
CREATE PROCEDURE CreateFY_NY_SL_tif_area_levy
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

insert tif_area_levy
(
	tif_area_id,
	year,
	tax_district_id,
	levy_cd,
	base_value,
	senior_base_value,
	linked_tax_district_id,
	linked_levy_cd
)
select 
	tal.tif_area_id
	,@lCopyToYear
	,tal.tax_district_id
	,tal.levy_cd
	,tal.base_value
	,tal.senior_base_value
	,tal.linked_tax_district_id
	,tal.linked_levy_cd

from tif_area_levy as tal 

-- ensure that the linked TIF area exists
join tif_area ta
on ta.tif_area_id = tal.tif_area_id

-- ensure that the linked levies exist
join levy l
on l.year = @lCopyToYear
and l.tax_district_id = tal.tax_district_id
and l.levy_cd = tal.levy_cd

join levy l2
on l2.year = @lCopyToYear
and l2.tax_district_id = tal.linked_tax_district_id
and l2.levy_cd = tal.linked_levy_cd

left join (
	select tif_area_id, @lInputFromYear as year, tax_district_id, levy_cd
	from tif_area_levy with(nolock)
	where year = @lCopyToYear
) as fy_l
on tal.tif_area_id = fy_l.tif_area_id
and tal.year = fy_l.year
and tal.tax_district_id = fy_l.tax_district_id
and tal.levy_cd = fy_l.levy_cd

where tal.year = @lInputFromYear
and fy_l.year is null -- don't insert records that already exist
and ta.completed = 0 -- stop copying up records after an LTIF is complete or expired
and @lCopyToYear <= isnull(ta.expiration_year,9999)
 

set @Rows = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

