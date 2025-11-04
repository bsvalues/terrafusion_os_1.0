

create procedure UpdateSalesCompPrintNoSales
@input_user_id	int,
@where_clause	varchar(2048),
@debug_flag	varchar(1) = 'F'
AS

SET NOCOUNT ON

--Declare stored procedure variables
declare @exec_sql varchar(8000)

	set @exec_sql = '
	update #sales_comp_print
	set
		#sales_comp_print.sale_type = sale.sl_type_cd,
		#sales_comp_print.sale_date = convert(varchar(50), sale.sl_dt, 101),
		#sales_comp_print.sale_price = sale.sl_price,
		#sales_comp_print.sale_ratio = cast(case when isnull(sale.adjusted_sl_price, 0) > 0 then (isnull(#sales_comp_print.appraised_val, 0) / isnull(sale.adjusted_sl_price, 0)) else 0 end as numeric(12,4)),
		#sales_comp_print.land_sale_val_per_area = cast(case when (isnumeric(#sales_comp_print.land_size) = 1) and isnull(sale.sl_price, 0) > 0 then isnull(sale.sl_price, 0) / (case when cast(#sales_comp_print.land_size as numeric(12,4)) > 0 then cast(#sales_comp_print.land_size as numeric(12,4)) else cast(1 as int) end) else isnull(sale.sl_price, 0) end as numeric(14,2)),
		#sales_comp_print.sale_price_per_sqft = cast(case when isnull(sale.sl_living_area, 0) > 0 then (isnull(sale.sl_price, 0) / isnull(sale.sl_living_area, 1)) else isnull(sale.sl_price, 0) end as numeric(14,2)),
		#sales_comp_print.sale_id = sale.chg_of_owner_id,
		#sales_comp_print.sale_ratio_code = sale.sl_ratio_type_cd
	from chg_of_owner_prop_assoc inner join sale on 
		chg_of_owner_prop_assoc.chg_of_owner_id = sale.chg_of_owner_id
	where ' + @where_clause + '
	and #sales_comp_print.prop_id = chg_of_owner_prop_assoc.prop_id'

	--Update records
	exec(@exec_sql)

GO

