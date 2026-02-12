
CREATE PROCEDURE CopyMasterLeaseGroups
@input_from_year int,
@input_to_year int

AS

-- master lease records
insert master_lease
(group_id, year, owner_id, dba, legal_desc, create_dt, create_user_id)

select group_id, @input_to_year, owner_id, dba, legal_desc, create_dt, create_user_id
from master_lease ml_from
where ml_from.year = @input_from_year
and not exists (
	select 1 from master_lease ml_to
	where ml_from.group_id = ml_to.group_id
	and ml_to.year = @input_to_year
)

-- master lease property associations
insert master_lease_prop_assoc
(group_id, year, prop_id)

select group_id, @input_to_year, prop_id
from master_lease_prop_assoc mlpa_from
where mlpa_from.year = @input_from_year
and not exists (
	select 1 from master_lease_prop_assoc mlpa_to
	where mlpa_from.group_id = mlpa_to.group_id
	and mlpa_to.year = @input_to_year
)

GO

