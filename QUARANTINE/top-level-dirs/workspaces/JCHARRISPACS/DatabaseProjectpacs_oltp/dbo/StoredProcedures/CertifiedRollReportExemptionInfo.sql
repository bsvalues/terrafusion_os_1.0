




CREATE PROCEDURE CertifiedRollReportExemptionInfo
	@input_prop_id int,
	@input_owner_id int,
	@input_year int,
	@input_sup_num int,
	@input_entity_id int

as

SET NOCOUNT ON

declare @count int

select @count = (SELECT COUNT(exmpt_type_cd)
		FROM property_entity_exemption
		WHERE	prop_id = @input_prop_id
		AND	owner_id = @input_owner_id
		AND	exmpt_tax_yr = @input_year
		AND	sup_num = @input_sup_num
		AND	entity_id = @input_entity_id)

if @count > 0
begin

	SELECT  1 as DumbID,
		exmpt_type_cd,
		state_amt + local_amt as exmpt_amt
	FROM	property_entity_exemption
	WHERE	prop_id = @input_prop_id
	AND	owner_id = @input_owner_id
	AND	exmpt_tax_yr = @input_year
	AND	sup_num = @input_sup_num
	AND	entity_id = @input_entity_id

end
else
begin
	SELECT 0 as DumbID
end

GO

