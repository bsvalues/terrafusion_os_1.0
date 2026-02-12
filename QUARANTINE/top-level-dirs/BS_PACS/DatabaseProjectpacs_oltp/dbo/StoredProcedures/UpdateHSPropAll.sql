


CREATE PROCEDURE UpdateHSPropAll

AS

SET NOCOUNT ON

--DISABLE OWNER TRIGGERS
exec dbo.TriggerEnable 'owner', 0

update owner with(tablockx)
set
	owner.hs_prop = case
		when pe.prop_id is null
		then 'F'
		else 'T'
	end
from owner with(tablockx)
left outer join property_exemption as pe with(tablockx) on
	pe.exmpt_tax_yr = owner.owner_tax_yr and
	pe.owner_tax_yr = owner.owner_tax_yr and
	pe.sup_num = owner.sup_num and
	pe.prop_id = owner.prop_id and
	pe.owner_id = owner.owner_id and
	pe.exmpt_type_cd = 'HS'
where
	isnull(owner.hs_prop, 'F') <> case when pe.prop_id is null then 'F' else 'T' end

--ENABLE ALL TRIGGERS
exec dbo.TriggerEnable 'owner', 1

GO

