
create view collin_etr_new_ex

as

select entity_cd, exmpt_type_cd, sum(curr_yr_exemption_amt) as ex_amt, 
suM(prev_yr_market) as prev_market, 
count(*) as num_ct
from etr_new_ex, entity
where etr_new_ex.entity_id = entity.entity_id
group by entity_cd, exmpt_type_cd
--order by entity_cd, exmpt_type_cd

GO

