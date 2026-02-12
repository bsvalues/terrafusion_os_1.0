

CREATE PROCEDURE [dbo].[monitor_ACHPropCodeListing]

/*************
This monitor was created for Benton to identify properties with the prop group code of ACH-SA or ACH-MO for all years.
{Call monitor_ACHPropCodeListing}
*************/

@display_yr int

as




select distinct pga.prop_group_cd, p.prop_id, p.geo_id, ac.file_as_name
from property p with (nolock)
join prop_group_assoc pga with (nolock)
	on p.prop_id = pga.prop_id 
join owner o with (nolock)
	on p.prop_id = o.prop_id
join account ac with (nolock)
	on ac.acct_id = o.owner_id
where pga.prop_group_cd like 'ACH-%'
and o.owner_tax_yr = @display_yr
order by p.prop_id

GO

