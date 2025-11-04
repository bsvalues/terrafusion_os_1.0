
create view PROP_GROUP_ASSOC_YEAR_VW
as
select distinct pga.prop_id, pga.prop_group_cd, pgc.group_desc, psa.owner_tax_yr,
pga.expiration_dt, pga.assessment_yr, pv.hood_cd, pv.cycle
from prop_group_assoc as pga
join prop_group_code as pgc on pga.prop_group_cd = pgc.group_cd
join property_val as pv on pga.prop_id = pv.prop_id
join prop_supp_assoc psa on psa.prop_id = pga.prop_id

GO

