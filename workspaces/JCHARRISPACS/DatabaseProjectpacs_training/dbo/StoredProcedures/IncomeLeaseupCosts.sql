



CREATE procedure IncomeLeaseupCosts

@show_detail		char(1),
@lu_rent_loss_area 	numeric(14, 0)	output,
@lu_rent_sf 		numeric(14, 2)	output,
@lu_rent_num_year 	numeric(5, 2)	output,
@lu_rent_total 		numeric(14, 0)	output,
@lu_lease_pct 		numeric(5, 2) 	output,
@lu_lease_total 	numeric(14, 0)	output,
@lu_tfo_sf		numeric(14, 2)	output,
@lu_tfo_total 		numeric(14, 0)	output,
@lu_disc_rate 		numeric(5, 2)	output,
@lu_num_year 		numeric(5, 2)	output,
@lu_cost 		numeric (14, 0)  	output,
@lu_override_cost	char(1)		output	

as

set @lu_rent_total  = IsNull(@lu_rent_loss_area * @lu_rent_sf * @lu_rent_num_year, 0)
set @lu_lease_total = IsNull(@lu_rent_total * (@lu_lease_pct/100), 0)
set @lu_tfo_total   = IsNull(@lu_rent_loss_area * @lu_tfo_sf, 0)

if (@lu_override_cost <> 'T')
begin
	set @lu_cost = (@lu_rent_total + @lu_lease_total + @lu_tfo_total)/(power((1 + (@lu_disc_rate/100)), @lu_num_year))
end

if (@show_detail = 'T')
begin
	select 	lu_rent_loss_area = @lu_rent_loss_area,
		lu_rent_sf        = @lu_rent_sf, 		
		lu_rent_num_year = @lu_rent_num_year, 	
		lu_rent_total    = @lu_rent_total,		
		lu_lease_pct     = @lu_lease_pct, 		
		lu_lease_total   = @lu_lease_total, 	
		lu_tfo_sf        = @lu_tfo_sf,		
		lu_tfo_total     = @lu_tfo_total, 		
		lu_disc_rate     = @lu_disc_rate, 		
		lu_num_year      = @lu_num_year, 		
		lu_cost          = @lu_cost, 		
		lu_override_cost = @lu_override_cost
end

GO

