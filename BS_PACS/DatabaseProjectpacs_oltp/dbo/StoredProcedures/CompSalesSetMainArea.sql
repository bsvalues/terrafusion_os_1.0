

create procedure CompSalesSetMainArea
	@szTypeCode char(10)
as

set nocount on

	update imprv_det_type with(tablock) set
		comp_sales_the_main_area_flag = case
			when
				imprv_det_type_cd = @szTypeCode
			then
				'T'
			else
				'F'
		end

set nocount off

GO

