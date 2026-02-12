




create view monthly_as_of_recap_delq_ins_vw

as


select 
pacs_user_id,
entity_id,
sum(beg_balance_ins) as beg_balance,     
sum(adj_ins) as adj,              
sum(adj_balance_ins) as adj_balance,     
sum(prior_collection_ins) as prior_collection, 
sum(curr_collections_ins) as curr_collections,
sum(base_tax_ins) as base_tax,         
sum(disc_ins) as disc,             
sum(underage_ins) as underage,        
sum(balance_ins) as balance,         
sum(p_i_ins) as p_i,                   
sum(overage_ins) as overage,         
sum(total_ins) as total            

from monthly_as_of_recap_ins
where tax_year < max_year
group by pacs_user_id, entity_id

GO

