
CREATE PROCEDURE ColumbiaMissingPropertySubType---OR ADD CREATE PROCEDURE

as

declare @appr_year	numeric(4,0)
exec GetApprYear @appr_year output

select distinct 
	pv.prop_id, 
	pv.sub_type as Property_Sub_Type, 
	p.prop_type_cd as Property_Type,
	pv.prop_val_yr
from property_val as pv
inner join property as p with (nolock)
	on pv.prop_id = p.prop_id
where pv.prop_val_yr = @appr_year
and pv.prop_inactive_dt is null
and isnull(pv.sub_type, '') = ''
order by 3

GO

