CREATE   PROCEDURE CreateFY_NY_SL_levy_link
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    levy_link
(
    tax_district_id
   ,year
   ,levy_cd
   ,levy_cd_linked
)
SELECT 
    ll.tax_district_id
    ,@lCopyToYear
    ,ll.levy_cd
    ,ll.levy_cd_linked
 FROM 
    levy_link as ll with(nolock)
--where ll.year = @lInputFromYear
	 LEFT JOIN 
     (select @lInputFromYear as year,tax_district_id,levy_cd,levy_cd_linked
        from levy_link with (nolock) 
       where year = @lCopyToYear) as fy_ll
   on ll.year = fy_ll.year
 and ll.tax_district_id = fy_ll.tax_district_id
 and ll.levy_cd = fy_ll.levy_cd
 and ll.levy_cd_linked = fy_ll.levy_cd_linked

-- add 2 joins to levy for 2 FK references - make sure levy records are in new year
 join
  (select year,tax_district_id,levy_cd 
       from levy 
     where  year = @lCopyToYear ) as cd
on 
    cd.year = ll.year + 1
and cd.tax_district_id = ll.tax_district_id
and cd.levy_cd = ll.levy_cd
 join
  (select year,tax_district_id,levy_cd 
       from levy 
     where  year = @lCopyToYear ) as linked
on 
    linked.year = ll.year + 1
and linked.tax_district_id = ll.tax_district_id
and linked.levy_cd =ll.levy_cd_linked

where ll.year = @lInputFromYear
  and fy_ll.year is null -- only return those not already inserted
 
 
-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

