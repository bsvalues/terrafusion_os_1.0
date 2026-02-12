

create  procedure GetSchoolEntity

@input_prop_id	int,
@input_sup_num  int,
@input_yr	numeric(4),
@input_entity varchar(5) output

as


set @input_entity = ''


select @input_entity = e.entity_cd
from entity_prop_assoc epa, entity e
where epa.entity_id = e.entity_id
and   epa.prop_id = @input_prop_id
and   epa.sup_num = @input_sup_num
and   epa.tax_yr  = @input_yr
and   e.entity_type_cd = 'S'

GO

