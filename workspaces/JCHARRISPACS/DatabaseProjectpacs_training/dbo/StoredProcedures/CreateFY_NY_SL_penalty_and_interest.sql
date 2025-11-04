CREATE PROCEDURE CreateFY_NY_SL_penalty_and_interest
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
    penalty_and_interest
(
    [type_cd]
   ,[percentage]
   ,[frequency_type_cd]
   ,[begin_date]
   ,[end_date]
   ,[ref_id]
   ,[ref_type_cd]
   ,[year]
   ,[ref_date_type_cd]
   ,[ref_date_offset]
   ,[ref_cd]
   ,[begin_date_h2]
   ,[end_date_h2]
   ,[penalty_interest_property_type_cd]
)
SELECT 
    pen_int.[type_cd]
   ,pen_int.[percentage]
   ,pen_int.[frequency_type_cd]
   , case	when pen_int.begin_date is null 
			then pen_int.begin_date
			else convert(varchar(2), month(pen_int.begin_date)) + '/' + convert(varchar(2), day(pen_int.begin_date)) + '/' + convert(char(4),@lCopyToYear + 1) end
   , case	when pen_int.end_date is null 
			then pen_int.end_date
			else convert(varchar(2), month(pen_int.end_date)) + '/' + convert(varchar(2), day(pen_int.end_date)) + '/' + convert(char(4),@lCopyToYear + 1) end
   ,pen_int.[ref_id]
   ,pen_int.[ref_type_cd]
   ,@lCopyToYear
   ,pen_int.[ref_date_type_cd]
   ,pen_int.[ref_date_offset]
   ,pen_int.[ref_cd]
   , case	when pen_int.begin_date_h2 is null 
			then pen_int.begin_date_h2
			else convert(varchar(2), month(pen_int.begin_date_h2)) + '/' + convert(varchar(2), day(pen_int.begin_date_h2)) + '/' + convert(char(4),@lCopyToYear + 1) end
   , case	when pen_int.end_date_h2 is null 
			then pen_int.end_date_h2
			else convert(varchar(2), month(pen_int.end_date_h2)) + '/' + convert(varchar(2), day(pen_int.end_date_h2)) + '/' + convert(char(4),@lCopyToYear + 1) end
   ,fy_pi.penalty_interest_property_type_cd
 FROM
	penalty_and_interest pen_int with (nolock) 
	LEFT JOIN penalty_and_interest fy_pi with (nolock) ON pen_int.type_cd = fy_pi.type_cd
		AND pen_int.frequency_type_cd = fy_pi.frequency_type_cd
		AND pen_int.ref_id = fy_pi.ref_id
		AND pen_int.ref_type_cd = fy_pi.ref_type_cd
		AND fy_pi.year = @lCopyToYear
		AND pen_int.ref_date_type_cd = fy_pi.ref_date_type_cd
		AND pen_int.ref_cd = fy_pi.ref_cd
		AND pen_int.fee_type_cd = fy_pi.fee_type_cd

  where pen_int.year = @lInputFromYear
    and pen_int.ref_type_cd not in ('PO')
    --,'RR') Bug 20281 the REET penalty and interest are by year.Payout agreements are not stored by year
    and fy_pi.year is null -- only return those not already inserted

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

