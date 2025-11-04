create view dbo.prop_supp_assoc_max_yr

as

select psa.* 
from dbo.prop_supp_assoc as psa with (nolock) 
where owner_tax_yr = (select max(owner_tax_yr) 
from prop_supp_assoc psa1 
where psa1.prop_id = psa.prop_id)

GO

