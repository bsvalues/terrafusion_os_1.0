
CREATE PROCEDURE CreateUDIInformation
@input_year	numeric(4,0)
AS

declare @parent_prop_id	int
declare @child_prop_id	int
declare @parent_sup_num	int
declare @child_sup_num	int
declare @next_event_id	int
declare @event_text	varchar(255)
declare @pacs_user_id	int

--Turn off logging
exec SetMachineLogChanges 0

DECLARE UDI_PROPS SCROLL CURSOR
FOR select _udi_prop_list.parent,
	psa_parent.sup_num,
	_udi_prop_list.child,
	psa_child.sup_num
	from _udi_prop_list, prop_supp_assoc as psa_parent, prop_supp_assoc as psa_child
	where _udi_prop_list.parent = psa_parent.prop_id
	and _udi_prop_list.child = psa_child.prop_id
	and psa_parent.owner_tax_yr = @input_year
	and psa_child.owner_tax_yr = @input_year
	order by _udi_prop_list.parent

OPEN UDI_PROPS
FETCH NEXT FROM UDI_PROPS into @parent_prop_id, @parent_sup_num, @child_prop_id, @child_sup_num

while (@@FETCH_STATUS = 0)
begin
	--Remove Land and Improvements
	delete from imprv_det_adj
	where prop_id = @child_prop_id
	and    sup_num = @child_sup_num
	and    prop_val_yr = @input_year
	and    sale_id = 0
	
	delete from imprv_adj
	where prop_id = @child_prop_id
	and  sup_num = @child_sup_num
	and  prop_val_yr = @input_year
	and  sale_id = 0
	
	delete from imprv_attr
	where prop_id = @child_prop_id
	and   sup_num = @child_sup_num
	and   prop_val_yr = @input_year
	and   sale_id = 0
	
	delete from imprv_detail
	where prop_id = @child_prop_id
	and   sup_num = @child_sup_num
	and   prop_val_yr  = @input_year
	and   sale_id = 0
	
	delete from imprv
	where prop_id = @child_prop_id
	and   sup_num = @child_sup_num
	and   prop_val_yr  = @input_year
	and   sale_id = 0
	
	delete from land_adj
	where prop_id = @child_prop_id
	and   sup_num = @child_sup_num
	and   prop_val_yr = @input_year
	and   sale_id = 0
	
	delete from land_detail
	where prop_id = @child_prop_id
	and   sup_num = @child_sup_num
	and   prop_val_yr  = @input_year
	and   sale_id = 0

	--Copy Land
	exec CopyLand @parent_prop_id, @parent_sup_num, @input_year, 0, @child_prop_id, @child_sup_num, @input_year, 0

	--Copy Improvements
	exec CopyImprovement @parent_prop_id, @parent_sup_num, @input_year, 0, @child_prop_id, @child_sup_num, @input_year, 0

	--Insert Event for Child
	exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0

	set @event_text = 'Land/Imprv records refreshed from property #'
			+ rtrim(cast(@parent_prop_id as varchar(20)))
			+ ' for year ' + cast(@input_year as varchar(4)) + '.'

	insert into event
	(
		event_id,
		system_type,
		event_type,
		event_date,
		pacs_user,
		event_desc,
		ref_evt_type,
		ref_year
	)
	values
	(
		@next_event_id,
		'A',
		'SYSTEM',
		GetDate(),
		'System',
		@event_text,
		'UDICOPY',
		@input_year
	)

	insert into prop_event_assoc
	(
		prop_id,
		event_id
	)
	values
	(
		@child_prop_id,
		@next_event_id
	)

	--Insert Event for Parent
	exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
	
	set @event_text = 'Land/Imprv records refreshed to property #'
			+ rtrim(cast(@child_prop_id as varchar(20)))
			+ ' for year ' + cast(@input_year as varchar(4)) + '.'

	insert into event
	(
		event_id,
		system_type,
		event_type,
		event_date,
		pacs_user,
		event_desc,
		ref_evt_type,
		ref_year
	)
	values
	(
		@next_event_id,
		'A',
		'SYSTEM',
		GetDate(),
		'System',
		@event_text,
		'UDICOPY',
		@input_year
	)

	insert into prop_event_assoc
	(
		prop_id,
		event_id
	)
	values
	(
		@parent_prop_id,
		@next_event_id
	)

	--Insert property group code of 'UDI'
	if not exists (select * from prop_group_assoc where prop_id = @parent_prop_id and prop_group_cd = 'UDI')
	begin
		insert into prop_group_assoc (prop_id, prop_group_cd)
		values (@parent_prop_id, 'UDI')
	end

	if not exists (select * from prop_group_assoc where prop_id = @child_prop_id and prop_group_cd = 'UDI')
	begin
		insert into prop_group_assoc (prop_id, prop_group_cd)
		values (@child_prop_id, 'UDI')
	end
	
	--Get next record
	FETCH NEXT FROM UDI_PROPS into @parent_prop_id, @parent_sup_num, @child_prop_id, @child_sup_num
end

CLOSE UDI_PROPS
DEALLOCATE UDI_PROPS

--Turn on logging
exec SetMachineLogChanges 1

--Recalculate the child accounts
select @pacs_user_id = pacs_user_id from pacs_user where pacs_user_name = 'System'

delete from recalc_prop_list where pacs_user_id = convert(bigint, @pacs_user_id)

insert into recalc_prop_list
(
	prop_id,
	sup_num,
	sup_yr,
	pacs_user_id
)
select 
	_udi_prop_list.child,
	psa_child.sup_num,
	@input_year,
	convert(bigint, @pacs_user_id)
from _udi_prop_list, prop_supp_assoc as psa_child
where _udi_prop_list.child = psa_child.prop_id
and psa_child.owner_tax_yr = @input_year
order by _udi_prop_list.child

exec RecalcChangedProperty @pacs_user_id

GO

