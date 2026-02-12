


create view monthly_as_of_recap_delq_mno_vw

as


select 
pacs_user_id,
entity_id,
sum(beg_balance_mno) as beg_balance,     
sum(adj_mno) as adj,              
sum(adj_balance_mno) as adj_balance,     
sum(prior_collection_mno) as prior_collection, 
sum(curr_collections_mno) as curr_collections,
sum(base_tax_mno) as base_tax,         
sum(disc_mno) as disc,             
sum(underage_mno) as underage,        
sum(balance_mno) as balance,         
sum(p_i_mno) as p_i,                    
sum(overage_mno) as overage,         
sum(total_mno) as total            

from monthly_as_of_recap_mno
where tax_year < max_year
group by pacs_user_id, entity_id

GO

