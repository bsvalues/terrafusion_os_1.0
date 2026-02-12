
create procedure UpdatePropertyAccessShowValues

as

set nocount on

declare @curr_appraisal_yr numeric(4,0)

select @curr_appraisal_yr = appr_yr
from pacs_system
with (Nolock)
--where system_type in ('A','B')

create table #x25
(
	prop_id int not null,
	prop_val_yr numeric(4,0) not null,
	constraint CPK__x25_prop_id primary key clustered
	(
		prop_id,
		prop_val_yr
	) with fillfactor = 100
)

insert #x25
(prop_id, prop_val_yr)
select distinct prop_id, @curr_appraisal_yr
from prop_group_assoc
with (nolock)
where prop_group_cd = 'X25.19A'

update c
set show_values = 'F'
from _clientdb_property as c with(tablock)
join #x25 as x
with (nolock)
on c.prop_id = x.prop_id
and c.prop_val_yr = x.prop_val_yr

update c
set show_values = 'F'
from _clientdb_improvement_building_detail as c with(tablock)
join #x25 as x
with (nolock)
on c.prop_id = x.prop_id
and c.prop_val_yr = x.prop_val_yr

update c
set show_values = 'F'
from _clientdb_land_detail as c with(tablock)
join #x25 as x
with (nolock)
on c.prop_id = x.prop_id
and c.prop_val_yr = x.prop_val_yr

update c
set show_values = 'F'
from _clientdb_roll_value_history_detail as c with(tablock)
join #x25 as x
with (nolock)
on c.prop_id = x.prop_id
and c.prop_val_yr = x.prop_val_yr

update c
set show_values = 'F'
from _clientdb_taxing_jurisdiction_detail as c with(tablock)
join #x25 as x
with (nolock)
on c.prop_id = x.prop_id
and c.sup_yr = x.prop_val_yr

update c
set show_values = 'F'
from _clientdb_values_detail as c with(tablock)
join #x25 as x
with (nolock)
on c.prop_id = x.prop_id
and c.prop_val_yr = x.prop_val_yr

drop table #x25

GO

