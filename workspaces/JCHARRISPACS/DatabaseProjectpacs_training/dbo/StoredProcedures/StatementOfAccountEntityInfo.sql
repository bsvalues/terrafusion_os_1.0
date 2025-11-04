







CREATE PROCEDURE StatementOfAccountEntityInfo

@input_prop_id		int = 0,
@input_year		int = 0,
@input_sup_num	int = 0

AS

declare @count 		int

select @count = (select count(1) as DumbID
from entity_prop_assoc, entity, account
where entity_prop_assoc.entity_id = entity.entity_id
and entity.entity_id = account.acct_id
and entity.entity_type_cd <> 'A'
and tax_yr = @input_year
and sup_num = @input_sup_num
and prop_id = @input_prop_id)

if @count > 0
begin
	select 1 as DumbID,
		entity.entity_cd,
		account.file_as_name as entity_name,
		entity_prop_assoc.entity_prop_pct
	from entity_prop_assoc, entity, account
	where entity_prop_assoc.entity_id = entity.entity_id
	and entity.entity_id = account.acct_id
	and entity.entity_type_cd <> 'A'
	and tax_yr = @input_year
	and sup_num = @input_sup_num
	and prop_id = @input_prop_id
	order by entity.entity_cd
end
else
begin
	select 1 as DumbID
end

GO

