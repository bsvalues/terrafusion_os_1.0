CREATE   PROCEDURE CreateFY_NY_SL_condominium_amenity
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
    condominium_amenity
(
    abs_subdv_cd
   ,abs_subdv_yr
   ,characteristic_cd
   ,value_cd
)
SELECT 
    ca.abs_subdv_cd
    ,@lCopyToYear
    ,ca.characteristic_cd
    ,ca.value_cd
 FROM 
    condominium_amenity as ca LEFT JOIN 
     (select abs_subdv_cd,@lInputFromYear as abs_subdv_yr,characteristic_cd,value_cd
        from condominium_amenity with (nolock) 
       where abs_subdv_yr = @lCopyToYear) as fy_ca
   on ca.abs_subdv_cd = fy_ca.abs_subdv_cd
 and ca.abs_subdv_yr = fy_ca.abs_subdv_yr
 and ca.characteristic_cd = fy_ca.characteristic_cd
 and ca.value_cd = fy_ca.value_cd

  where ca.abs_subdv_yr = @lInputFromYear
 and fy_ca.abs_subdv_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

