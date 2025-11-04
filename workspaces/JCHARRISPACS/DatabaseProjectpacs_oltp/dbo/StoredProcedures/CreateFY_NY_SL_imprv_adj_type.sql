CREATE   PROCEDURE CreateFY_NY_SL_imprv_adj_type
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
    imprv_adj_type
(
    imprv_adj_type_year
   ,imprv_adj_type_cd
   ,imprv_adj_type_desc
   ,imprv_adj_type_usage
   ,imprv_adj_type_amt
   ,imprv_adj_type_pct
   ,imprv_adj_type_patype
   ,rc_type
	 ,inactive
)
SELECT 
    @lCopyToYear
    ,iat.imprv_adj_type_cd
    ,iat.imprv_adj_type_desc
    ,iat.imprv_adj_type_usage
    ,iat.imprv_adj_type_amt
    ,iat.imprv_adj_type_pct
    ,iat.imprv_adj_type_patype
    ,iat.rc_type
		,iat.inactive
 FROM 
    imprv_adj_type as iat LEFT JOIN 
     (select @lInputFromYear as imprv_adj_type_year,imprv_adj_type_cd
        from imprv_adj_type with (nolock) 
       where imprv_adj_type_year = @lCopyToYear) as fy_iat
   on iat.imprv_adj_type_year = fy_iat.imprv_adj_type_year
 and iat.imprv_adj_type_cd = fy_iat.imprv_adj_type_cd

  where iat.imprv_adj_type_year = @lInputFromYear
 and fy_iat.imprv_adj_type_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

