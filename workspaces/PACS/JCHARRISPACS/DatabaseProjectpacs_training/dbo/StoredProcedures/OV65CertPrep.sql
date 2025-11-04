


create procedure OV65CertPrep

@prop_id	int,
@owner_id	int,
@sup_num	int,
@prop_val_yr	numeric(4)

as

declare @entity_id		int
declare @strSQL			varchar(200)

set @entity_id 		  = 0


select @entity_id = epa.entity_id
from entity_prop_assoc epa,
     entity
where epa.entity_id = entity.entity_id
and   entity.entity_type_cd = 'S'
and   epa.prop_id = @prop_id
and   epa.sup_num = @sup_num
and   epa.tax_yr  = @prop_val_yr


/* indicates year is not certified so we must build the data, else it is already there */
if exists (select * from pacs_year 
	   where tax_yr = @prop_val_yr
	   and certification_dt is null)
begin
	set @strSQL = 'CalculateTaxable ''' + convert(varchar(15), @entity_id) + '''' 
	set @strSQL = @strSQL + ', ' + convert(varchar(15), @sup_num)
	set @strSQL = @strSQL + ', ' + convert(varchar(4), @prop_val_yr) 
	set @strSQL = @strSQL + ', ' + convert(varchar(15), @prop_id)

	exec (@strSQL)	
end

GO

