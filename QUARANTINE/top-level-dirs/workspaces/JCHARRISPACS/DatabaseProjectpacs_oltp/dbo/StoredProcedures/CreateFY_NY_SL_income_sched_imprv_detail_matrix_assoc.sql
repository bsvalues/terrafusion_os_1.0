CREATE PROCEDURE CreateFY_NY_SL_income_sched_imprv_detail_matrix_assoc
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
		income_sched_imprv_detail_matrix_assoc
(
		[year],
		hood_cd,
		imprv_det_type_cd,
		imprv_det_meth_cd,
		matrix_id,
		matrix_order,
		adj_factor
)
SELECT 
    @lCopyToYear,
		prf.hood_cd,
		prf.imprv_det_type_cd,
		prf.imprv_det_meth_cd,
		prf.matrix_id,
		prf.matrix_order,
		prf.adj_factor
    
 FROM 
    income_sched_imprv_detail_matrix_assoc as prf LEFT JOIN 
     (select @lInputFromYear as [year],hood_cd,imprv_det_type_cd,imprv_det_meth_cd,matrix_id,matrix_order
        from income_sched_imprv_detail_matrix_assoc with (nolock) 
       where [year] = @lCopyToYear) as fy_prf
   on prf.[year] = fy_prf.[year]
 and prf.hood_cd = fy_prf.hood_cd
 and prf.imprv_det_type_cd = fy_prf.imprv_det_type_cd
 and prf.imprv_det_meth_cd = fy_prf.imprv_det_meth_cd
 and prf.matrix_id = fy_prf.matrix_id
 and prf.matrix_order = fy_prf.matrix_order

  where prf.[year] = @lInputFromYear
 and fy_prf.[year] is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

