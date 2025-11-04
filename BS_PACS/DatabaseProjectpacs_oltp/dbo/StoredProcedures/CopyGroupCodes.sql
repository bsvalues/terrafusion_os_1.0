

CREATE PROCEDURE CopyGroupCodes
	@from_prop_id int,
	@to_prop_id int
AS


delete
	prop_group_assoc
from
	prop_group_assoc as pga
inner join
	property as p
on
	p.prop_id = pga.prop_id
where
	pga.prop_id = @to_prop_id



insert into
	prop_group_assoc
(
	prop_id,
	prop_group_cd
)
select
	@to_prop_id,
	pga.prop_group_cd
from
	prop_group_assoc as pga with (nolock)
inner join
	property as p with (nolock)
on
	p.prop_id = pga.prop_id
where
	pga.prop_id = @from_prop_id

GO

