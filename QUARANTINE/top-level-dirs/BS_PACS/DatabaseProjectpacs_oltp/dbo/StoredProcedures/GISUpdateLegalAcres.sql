

create procedure GISUpdateLegalAcres

@prop_id	int,
@sup_num	int,
@year		numeric(4),
@acres		numeric(14,4)

as

-- 2006.06.27 - Jeremy Smith - HS 36948
-- if -1 was passed, get the latest supp num and use that
if @sup_num = -1
begin
	select @sup_num = sup_num from prop_supp_assoc where prop_id = @prop_id and owner_tax_yr = @year
end

update property_val
set legal_acreage = @acres
where prop_id = @prop_id
and   sup_num = @sup_num
and   prop_val_yr = @year

GO

