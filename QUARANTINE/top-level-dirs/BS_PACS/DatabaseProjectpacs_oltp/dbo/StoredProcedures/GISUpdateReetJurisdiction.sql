
create procedure GISUpdateReetJurisdiction

	@prop_id int,
	@new_urban_growth_cd varchar(10)

as

set nocount on

update property_val
set urban_growth_cd = @new_urban_growth_cd
from property_val as pv
join prop_supp_assoc as psa
with (nolock)
on pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num
and pv.prop_id = psa.prop_id
join pacs_system as ps
with (nolock)
on ps.appr_yr = psa.owner_tax_yr
where pv.prop_id = @prop_id

GO

