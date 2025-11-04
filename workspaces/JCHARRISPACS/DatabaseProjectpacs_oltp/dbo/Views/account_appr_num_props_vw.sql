

/****** Object:  View dbo.account_num_props_vw    Script Date: 7/28/2003 2:56:48 PM ******/

CREATE VIEW account_appr_num_props_vw
AS
select o.owner_id, count(distinct o.prop_id) as num_props
from owner as o with (nolock),
	prop_supp_assoc as psa with (nolock),
	pacs_system as ps with (nolock)
where psa.prop_id = o.prop_id
	and psa.sup_num = o.sup_num
	and psa.owner_tax_yr = o.owner_tax_yr 
	and psa.owner_tax_yr = ps.appr_yr
group by o.owner_id

GO

