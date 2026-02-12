





CREATE view sptb_prop_count_vw
as
select sptb_prop_list_vw.state_cd, sptb_prop_list_vw.owner_tax_yr, count(*) as prop_count, sptb_prop_list_vw.entity_id
from sptb_prop_list_vw
group by sptb_prop_list_vw.state_cd, sptb_prop_list_vw.owner_tax_yr, sptb_prop_list_vw.entity_id

GO

