
create view split_assoc_vw
as
select  split_assoc.prop_id,
 split_assoc.split_id,
 split_assoc.split_dt,
 split_into.parent_id,
 split_into.child_id,
 split_assoc.before_legal_acres,
 split_assoc.before_legal_desc,
 split_assoc.before_owner,
 split_assoc.after_legal_acres,
 split_assoc.after_legal_desc,
 split_assoc.after_owner,
 split_into.legal_acres,
 split_into.legal_desc,
 split_into.owner
from split_assoc, split_into
where split_assoc.split_id = split_into.split_id
and   split_assoc.prop_id  = split_into.parent_id

GO

