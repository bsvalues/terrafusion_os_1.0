
create view merge_assoc_vw
as
select
merge_assoc.merge_id,
prop_id,
merge_dt,
child_id,
parent_id,
merge_assoc.legal_acres child_legal_acres,
merge_assoc.legal_desc  child_legal_desc,
merge_assoc.owner  child_owner,
merge_from.legal_acres  parent_legal_acres,
merge_from.legal_desc   parent_legal_desc,
merge_from.owner        parent_owner
from merge_assoc, merge_from
where merge_assoc.merge_id = merge_from.merge_id
and   merge_assoc.prop_id  = merge_from.child_id

GO

