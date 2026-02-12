




CREATE  procedure IncomeExcessLand

@show_detail	char(1),
@income_id	int,
@sup_num	int,
@prop_val_yr	numeric(4),
@nra		numeric(14,0),
@typical_ratio	numeric(14,5),
@land_rsf	numeric(14,2),
@land_ratio	numeric(14,5) output,
@land_size	numeric(18,4) output,
@excess_value	numeric(14,0) output

as

select @land_size = sum(IsNull(size_square_feet, 0))
from income_prop_assoc ipa,
     land_detail ld
where ipa.prop_id = ld.prop_id
and   ipa.sup_num = ld.sup_num
and   ipa.prop_val_yr = ld.prop_val_yr
and   ld.sale_id = 0
and   ipa.income_id   = @income_id
and   ipa.sup_num     = @sup_num
and   ipa.prop_val_yr = @prop_val_yr


if (@nra > 0)
begin
	set @land_ratio = @land_size/@nra
end
else
begin
	set @land_ratio = 0
end

if (@land_ratio > @typical_ratio)
begin
	set @excess_value = abs(@land_ratio - @typical_ratio) * @nra * @land_rsf
end
else
begin
	set @excess_value = 0
end

if (@show_detail = 'T')
begin
	select land_ratio   = @land_ratio,	
	       land_size    = @land_size,	
	       excess_value = @excess_value	
end

GO

