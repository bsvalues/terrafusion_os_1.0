

create view monthly_as_of_recap_delq_summary_vw

as


select 
pacs_user_id,
entity_id,
sum(beg_balance) as beg_balance,     
sum(adj) as adj,              
sum(adj_balance) as adj_balance,     
sum(prior_collection) as prior_collection, 
sum(curr_collections) as curr_collections,
sum(base_tax) as base_tax,         
sum(disc) as disc,             
sum(underage) as underage,        
sum(balance) as balance,         
sum(p_i) as p_i,              
sum(atty_fees) as atty_fees,        
sum(overage) as overage,         
sum(total) as total            

from monthly_as_of_recap_summary
where tax_year < max_year
group by pacs_user_id, entity_id

GO

