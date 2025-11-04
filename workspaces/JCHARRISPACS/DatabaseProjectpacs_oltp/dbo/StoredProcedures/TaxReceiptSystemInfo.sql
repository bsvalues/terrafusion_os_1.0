




CREATE PROCEDURE TaxReceiptSystemInfo
AS

select 1 as DumbID,
	system_address.*
from system_address
where system_type = 'C'

GO

