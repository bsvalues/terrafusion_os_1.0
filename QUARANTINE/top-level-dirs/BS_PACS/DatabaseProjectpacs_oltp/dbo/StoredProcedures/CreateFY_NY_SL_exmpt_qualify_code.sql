CREATE PROCEDURE CreateFY_NY_SL_exmpt_qualify_code
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
    exmpt_qualify_code
(
	year,
	exemption_code,
	exempt_type_cd,
	exemption_desc,
	income_min,
	income_max,
	percentage,
	exempt_min,
	exempt_max,
	excess_levy
)
SELECT 
	@lCopyToYear,
	eqc.exemption_code,
	eqc.exempt_type_cd,
	eqc.exemption_desc,
	eqc.income_min,
	eqc.income_max,
	eqc.percentage,
	eqc.exempt_min,
	eqc.exempt_max,
	eqc.excess_levy
FROM exmpt_qualify_code as eqc
WHERE
	eqc.year = @lInputFromYear
	and not exists (
		select *
		from exmpt_qualify_code as eqcnew
		where
			eqcnew.year = @lCopyToYear and
			eqcnew.exemption_code = eqc.exemption_code and
			eqcnew.exempt_type_cd = eqc.exempt_type_cd
	)

 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

