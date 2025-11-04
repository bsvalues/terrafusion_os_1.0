CREATE PROCEDURE CreateFY_NY_SL_income_sched_imprv_detail
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
		income_sched_imprv_detail
(
		[year],
		hood_cd,
		imprv_det_type_cd,
		imprv_det_meth_cd,
		use_matrix,
		rent_rate,
		collection_loss,
		occupancy_rate,
		secondary_income_rsf,
		cap_rate,
		expense_rsf,
		expense_ratio,
		do_not_use_tax_rate,
		rent_rate_period
)
SELECT 
    @lCopyToYear,
		prf.hood_cd,
		prf.imprv_det_type_cd,
		prf.imprv_det_meth_cd,
		prf.use_matrix,
		prf.rent_rate,
		prf.collection_loss,
		prf.occupancy_rate,
		prf.secondary_income_rsf,
		prf.cap_rate,
		prf.expense_rsf,
		prf.expense_ratio,
		prf.do_not_use_tax_rate,
		prf.rent_rate_period
    
 FROM 
    income_sched_imprv_detail as prf LEFT JOIN 
     (select @lInputFromYear as [year],hood_cd,imprv_det_type_cd,imprv_det_meth_cd
        from income_sched_imprv_detail with (nolock) 
       where [year] = @lCopyToYear) as fy_prf
   on prf.[year] = fy_prf.[year]
 and prf.hood_cd = fy_prf.hood_cd
 and prf.imprv_det_type_cd = fy_prf.imprv_det_type_cd
 and prf.imprv_det_meth_cd = fy_prf.imprv_det_meth_cd

  where prf.[year] = @lInputFromYear
 and fy_prf.[year] is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

