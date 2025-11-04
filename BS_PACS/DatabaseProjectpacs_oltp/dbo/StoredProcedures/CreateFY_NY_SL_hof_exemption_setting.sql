CREATE PROCEDURE CreateFY_NY_SL_hof_exemption_setting
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
    hof_exemption_setting
(
	year,
	exemption_amount
)
SELECT 
	@lCopyToYear,
	hof.exemption_amount
FROM hof_exemption_setting as hof
WHERE
	hof.year = @lInputFromYear
	and not exists (
		select *
		from hof_exemption_setting as hofnew
		where
			hofnew.year = @lCopyToYear
	)

 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

