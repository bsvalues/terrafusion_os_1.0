
create procedure FreezeCalcActualTax

@input_yr	numeric(4),
@frz_assessed	numeric(14,0),
@frz_taxable    numeric(14,0),
@frz_ceiling	numeric(14,2),
@frz_yr		numeric(4),
@tax_rate	numeric(13,10),
@frz_actual_tax	numeric(14,2) output

as

declare @calc_tax numeric(14,2)


set @calc_tax = (@frz_taxable/100) * @tax_rate

if (@frz_ceiling < @calc_tax)
begin
	set @frz_actual_tax  = @frz_ceiling
end
else
begin
	set @frz_actual_tax = @calc_tax

end

GO

