





CREATE PROCEDURE StatementOfAccountOwnerProperties

@input_owner_id	int = 0

AS

SET NOCOUNT ON

declare @count int

/*
select @count = (select count(distinct owner.prop_id)
from owner, prop_supp_assoc
where owner.prop_id = prop_supp_assoc.prop_id
and owner.sup_num = prop_supp_assoc.sup_num
and owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
and owner_id = @input_owner_id)
*/

select
	@count = count(prop_id)
from
	property with (nolock)
where
	col_owner_id = @input_owner_id


if (@count > 0)
begin
/*
	select distinct 1 as DumbID, 
		owner.prop_id 
	from owner, prop_supp_assoc
	where owner.prop_id = prop_supp_assoc.prop_id
	and owner.sup_num = prop_supp_assoc.sup_num
	and owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
	and owner_id = @input_owner_id
	order by owner.prop_id
*/
	select
		1 as DumbID,
		prop_id
	from
		property with (nolock)
	where
		col_owner_id = @input_owner_id
	order by
		prop_id
end
else
begin
	select 0
end

GO

