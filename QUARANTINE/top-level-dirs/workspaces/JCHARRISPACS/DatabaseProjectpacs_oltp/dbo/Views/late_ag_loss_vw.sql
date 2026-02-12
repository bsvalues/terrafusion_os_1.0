




create view late_ag_loss_vw
as
select sum(ag_loss) as ag_loss, prop_id, sup_num, prop_val_yr, sale_id
from land_detail
where late_ag_apply = 'T'
and   late_ag_apply is not null
group by prop_id, sup_num, prop_val_yr, sale_id

GO

