








create view BILL_PROP_ENTITY_VW
as 
select distinct bill.prop_id, bill.entity_id, entity.entity_cd
from bill, entity
where bill.entity_id = entity.entity_id

GO

