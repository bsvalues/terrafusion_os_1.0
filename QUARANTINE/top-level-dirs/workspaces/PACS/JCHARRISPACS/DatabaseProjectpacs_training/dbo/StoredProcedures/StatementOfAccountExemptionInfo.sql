







CREATE PROCEDURE StatementOfAccountExemptionInfo

@input_prop_id		int = 0,
@input_owner_id	int = 0,
@input_year		int = 0,
@input_sup_num	int = 0

AS


SET NOCOUNT ON

declare @count 		int

select @count = (select count(exmpt_type_cd) as DumbID
from property_exemption
where prop_id = @input_prop_id
--and owner_id = @input_owner_id
and exmpt_tax_yr = @input_year
and sup_num = @input_sup_num)

if @count > 0
begin
	select 1 as DumbID,
		property_exemption.exmpt_type_cd as exempt_type_cd,
		exmpt_desc as exempt_desc
	from property_exemption, exmpt_type
	where property_exemption.exmpt_type_cd = exmpt_type.exmpt_type_cd
	and prop_id = @input_prop_id
	--and owner_id = @input_owner_id
	and exmpt_tax_yr = @input_year
	and sup_num = @input_sup_num
end
else
begin
	select 0 as DumbID
end

GO

