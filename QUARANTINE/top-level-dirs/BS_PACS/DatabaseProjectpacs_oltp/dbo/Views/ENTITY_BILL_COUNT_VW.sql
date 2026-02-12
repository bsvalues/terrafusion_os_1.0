












create view ENTITY_BILL_COUNT_VW
as
select count(*) as bill_count,
       entity_id,
       sup_num,
       sup_tax_yr
from bill
group by entity_id, sup_num, sup_tax_yr

GO

