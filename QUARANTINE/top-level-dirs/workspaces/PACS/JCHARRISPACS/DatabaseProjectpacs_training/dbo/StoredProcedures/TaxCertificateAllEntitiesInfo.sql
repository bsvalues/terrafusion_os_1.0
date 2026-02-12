


CREATE PROCEDURE TaxCertificateAllEntitiesInfo

@input_fee_id		int,
@input_prop_id		int

AS

SET NOCOUNT ON

select 1, fee_prop_entity_assoc.entity_id 	as entity_id,
	account.file_as_name		as entity_name
from fee_prop_entity_assoc
inner join account
on fee_prop_entity_assoc.entity_id = account.acct_id
where fee_prop_entity_assoc.fee_id = @input_fee_id
and	fee_prop_entity_assoc.prop_id = @input_prop_id
order by account.file_as_name

GO

