
create procedure dbo.MoveProtestsAndInquiriesFromUDIParentToProperty
	@input_parent_prop_id int,
	@input_child_prop_id int,
	@input_prop_val_yr numeric(4,0),
	@input_sup_num int
with recompile

as



declare @prop_val_yr numeric(4,0)
declare @case_id int
declare @parent_prop_id int
declare @sibling_prop_id int
declare @child_prop_id int



--	Because of docket scheduling (which is updated in triggers on _arb_protest), we must
--	delete all protests that are duplicates between the parent and the designated child
--	(i.e., same prop_val_yr and case_id) before changing the prop_id from the parent
--	prop_id to the child prop_id on the protests that are not duplicated.  Docket scheduling
--	is based on the number of distinct prop_id values associated with a particular docket.
--	If we updated prop_id values prior to deleting duplicates, the possiblity exists that
--	the maximum property count for a particular docket could be exceeded, causing the stored
--	procedure to fail with a constraint violation.
declare DUPLICATEPARENTPROTESTS cursor
for
select
	parent_ap.prop_val_yr,
	parent_ap.case_id,
	parent_ap.prop_id
from
	_arb_protest as parent_ap
inner join
	property_val as parent_pv
on
	parent_pv.prop_id = parent_ap.prop_id
and	parent_pv.prop_val_yr = parent_ap.prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
where
	parent_ap.prop_id = @input_parent_prop_id
and	parent_ap.prop_val_yr = @input_prop_val_yr
and	exists
(
	select
		*
	from
		_arb_protest as child_ap with (nolock)
	where
		child_ap.prop_val_yr = parent_ap.prop_val_yr
	and	child_ap.case_id = parent_ap.case_id
	and	child_ap.prop_id = child_pv.prop_id
)
for update


open DUPLICATEPARENTPROTESTS
fetch next from DUPLICATEPARENTPROTESTS
into
	@prop_val_yr,
	@case_id,
	@parent_prop_id

while (@@fetch_status = 0)
begin

	delete
	from	
		_arb_protest_protest_by_assoc
	from
		_arb_protest_protest_by_assoc as appba
	inner join _arb_protest as ap on
		ap.prop_id = @parent_prop_id
	and	ap.prop_val_yr = @prop_val_yr
	and	ap.case_id = @case_id
	and	appba.case_id = ap.case_id
	and	appba.prop_val_yr = ap.prop_val_yr

	delete 
		_arb_protest
	where
		current of DUPLICATEPARENTPROTESTS


	delete
		_arb_protest_panel_member
	where
		prop_id = @parent_prop_id
	and	prop_val_yr = @prop_val_yr
	and	case_id = @case_id


	delete
		_arb_protest_reason
	where
		prop_id = @parent_prop_id
	and	prop_val_yr = @prop_val_yr
	and	case_id = @case_id

	fetch next from DUPLICATEPARENTPROTESTS
	into
		@prop_val_yr,
		@case_id,
		@parent_prop_id
end


close DUPLICATEPARENTPROTESTS
deallocate DUPLICATEPARENTPROTESTS




declare UPDATEPARENTPROTESTS cursor
for
select
	parent_ap.prop_val_yr,
	parent_ap.case_id,
	parent_ap.prop_id,
	child_pv.prop_id
from
	_arb_protest as parent_ap
inner join
	property_val as parent_pv
on
	parent_pv.prop_id = parent_ap.prop_id
and	parent_pv.prop_val_yr = parent_ap.prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
where
	parent_ap.prop_id = @input_parent_prop_id
and	parent_ap.prop_val_yr = @input_prop_val_yr
and	not exists
(
	select
		*
	from
		_arb_protest as child_ap with (nolock)
	where
		child_ap.prop_val_yr = parent_ap.prop_val_yr
	and	child_ap.case_id = parent_ap.case_id
	and	child_ap.prop_id = child_pv.prop_id
)
for update


open UPDATEPARENTPROTESTS
fetch next from UPDATEPARENTPROTESTS
into
	@prop_val_yr,
	@case_id,
	@parent_prop_id,
	@child_prop_id

while (@@fetch_status = 0)
begin

	select * into 
		#update_parent_arb_protest 
	from 
		_arb_protest as ap
	where 
		ap.prop_val_yr = @prop_val_yr
	and	ap.case_id = @case_id
	and	ap.prop_id = @parent_prop_id

	select * into 
		#update_parent_arb_protest_protest_by_assoc 
	from 
		_arb_protest_protest_by_assoc as ap
	where 
		ap.prop_val_yr = @prop_val_yr
	and	ap.case_id = @case_id
	and	ap.prop_id = @parent_prop_id

	update
		#update_parent_arb_protest
	set
		prop_id = @child_prop_id
	where
		#update_parent_arb_protest.prop_val_yr = @prop_val_yr
	and	#update_parent_arb_protest.case_id = @case_id
	and	#update_parent_arb_protest.prop_id = @parent_prop_id
	
	update
		#update_parent_arb_protest_protest_by_assoc
	set
		prop_id = @child_prop_id
	where
		#update_parent_arb_protest_protest_by_assoc.prop_val_yr = @prop_val_yr
	and	#update_parent_arb_protest_protest_by_assoc.case_id = @case_id
	and	#update_parent_arb_protest_protest_by_assoc.prop_id = @parent_prop_id
	
	delete
		_arb_protest_protest_by_assoc
	where
		_arb_protest_protest_by_assoc.prop_val_yr = @prop_val_yr
	and	_arb_protest_protest_by_assoc.case_id = @case_id
	and	_arb_protest_protest_by_assoc.prop_id = @parent_prop_id

	delete 
		_arb_protest
	where
		_arb_protest.prop_val_yr = @prop_val_yr
	and	_arb_protest.case_id = @case_id
	and	_arb_protest.prop_id = @parent_prop_id

	insert into
		_arb_protest
	select * from
		#update_parent_arb_protest
	where
		#update_parent_arb_protest.prop_val_yr = @prop_val_yr
	and	#update_parent_arb_protest.case_id = @case_id
	and	#update_parent_arb_protest.prop_id = @child_prop_id
	
	insert into
		_arb_protest_protest_by_assoc
	select * from
		#update_parent_arb_protest_protest_by_assoc
	where
		#update_parent_arb_protest_protest_by_assoc.prop_val_yr = @prop_val_yr
	and	#update_parent_arb_protest_protest_by_assoc.case_id = @case_id
	and	#update_parent_arb_protest_protest_by_assoc.prop_id = @child_prop_id

	drop table #update_parent_arb_protest
	drop table #update_parent_arb_protest_protest_by_assoc

	update
		_arb_protest_panel_member
	set
		prop_id = @child_prop_id
	where
		prop_id = @parent_prop_id
	and	prop_val_yr = @prop_val_yr
	and	case_id = @case_id


	update
		_arb_protest_reason
	set
		prop_id = @child_prop_id
	where
		prop_id = @parent_prop_id
	and	prop_val_yr = @prop_val_yr
	and	case_id = @case_id


	fetch next from UPDATEPARENTPROTESTS
	into
		@prop_val_yr,
		@case_id,
		@parent_prop_id,
		@child_prop_id
end


close UPDATEPARENTPROTESTS
deallocate UPDATEPARENTPROTESTS




--	Even though docket scheduling is not relevant to inquiries, we'll use
--	the same pattern for deleting and updating inquiries anyway.
declare DUPLICATEPARENTINQUIRIES cursor
for
select
	parent_ai.prop_val_yr,
	parent_ai.case_id,
	parent_ai.prop_id
from
	_arb_inquiry as parent_ai
inner join
	property_val as parent_pv
on
	parent_pv.prop_id = parent_ai.prop_id
and	parent_pv.prop_val_yr = parent_ai.prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
where
	parent_ai.prop_id = @input_parent_prop_id
and	parent_ai.prop_val_yr = @input_prop_val_yr
and	exists
(
	select
		*
	from
		_arb_inquiry as child_ai with (nolock)
	where
		child_ai.prop_val_yr = parent_ai.prop_val_yr
	and	child_ai.case_id = parent_ai.case_id
	and	child_ai.prop_id = child_pv.prop_id
)
for update


open DUPLICATEPARENTINQUIRIES
fetch next from DUPLICATEPARENTINQUIRIES
into
	@prop_val_yr,
	@case_id,
	@parent_prop_id

while (@@fetch_status = 0)
begin
	delete 
		_arb_inquiry
	where
		current of DUPLICATEPARENTINQUIRIES

	fetch next from DUPLICATEPARENTINQUIRIES
	into
		@prop_val_yr,
		@case_id,
		@parent_prop_id
end


close DUPLICATEPARENTINQUIRIES
deallocate DUPLICATEPARENTINQUIRIES




declare UPDATEPARENTINQUIRIES cursor
for
select
	parent_ai.prop_val_yr,
	parent_ai.case_id,
	parent_ai.prop_id,
	child_pv.prop_id
from
	_arb_inquiry as parent_ai
inner join
	property_val as parent_pv
on
	parent_pv.prop_id = parent_ai.prop_id
and	parent_pv.prop_val_yr = parent_ai.prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
where
	parent_ai.prop_id = @input_parent_prop_id
and	parent_ai.prop_val_yr = @input_prop_val_yr
and	not exists
(
	select
		*
	from
		_arb_inquiry as child_ai with (nolock)
	where
		child_ai.prop_val_yr = parent_ai.prop_val_yr
	and	child_ai.case_id = parent_ai.case_id
	and	child_ai.prop_id = child_pv.prop_id
)
for update


open UPDATEPARENTINQUIRIES
fetch next from UPDATEPARENTINQUIRIES
into
	@prop_val_yr,
	@case_id,
	@parent_prop_id,
	@child_prop_id

while (@@fetch_status = 0)
begin
	update 
		_arb_inquiry
	set
		prop_id = @child_prop_id
	where
		current of UPDATEPARENTINQUIRIES

	fetch next from UPDATEPARENTINQUIRIES
	into
		@prop_val_yr,
		@case_id,
		@parent_prop_id,
		@child_prop_id
end


close UPDATEPARENTINQUIRIES
deallocate UPDATEPARENTINQUIRIES




--	Because of docket scheduling (which is updated in triggers on _arb_protest), we must
--	delete all protests that are duplicates between each sibling and the designated child
--	(i.e., same prop_val_yr and case_id) before changing the prop_id from the sibling
--	prop_id to the child prop_id on the protests that are not duplicated.  Docket scheduling
--	is based on the number of distinct prop_id values associated with a particular docket.
--	If we updated prop_id values prior to deleting duplicates, the possiblity exists that
--	the maximum property count for a particular docket could be exceeded, causing the stored
--	procedure to fail with a constraint violation.
declare DUPLICATESIBLINGPROTESTS cursor
for
select
	sibling_ap.prop_val_yr,
	sibling_ap.case_id,
	sibling_ap.prop_id
from
	property_val as parent_pv
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
inner join
	property_val as sibling_pv
on
	sibling_pv.prop_id <> child_pv.prop_id
and	sibling_pv.prop_val_yr = child_pv.prop_val_yr
and	sibling_pv.sup_num = child_pv.sup_num
and	sibling_pv.udi_parent_prop_id = parent_pv.prop_id
and	isnull(sibling_pv.udi_status, '') <> 'S'
inner join
	_arb_protest as sibling_ap
on
	sibling_ap.prop_id = sibling_pv.prop_id
and	sibling_ap.prop_val_yr = sibling_pv.prop_val_yr
where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
and	exists
(
	select
		*
	from
		_arb_protest as child_ap with (nolock)
	where
		child_ap.prop_val_yr = sibling_ap.prop_val_yr
	and	child_ap.case_id = sibling_ap.case_id
	and	child_ap.prop_id = child_pv.prop_id
)
for update


open DUPLICATESIBLINGPROTESTS
fetch next from DUPLICATESIBLINGPROTESTS
into
	@prop_val_yr,
	@case_id,
	@sibling_prop_id

while (@@fetch_status = 0)
begin
	delete
	from	
		_arb_protest_protest_by_assoc
	from
		_arb_protest_protest_by_assoc as appba
	inner join _arb_protest as ap on
		ap.prop_id = @sibling_prop_id
	and	ap.prop_val_yr = @prop_val_yr
	and	ap.case_id = @case_id
	and	appba.case_id = ap.case_id
	and	appba.prop_val_yr = ap.prop_val_yr

	delete 
		_arb_protest
	where
		current of DUPLICATESIBLINGPROTESTS


	delete
		_arb_protest_panel_member
	where
		prop_id = @sibling_prop_id
	and	prop_val_yr = @prop_val_yr
	and	case_id = @case_id


	delete
		_arb_protest_reason
	where
		prop_id = @sibling_prop_id
	and	prop_val_yr = @prop_val_yr
	and	case_id = @case_id


	fetch next from DUPLICATESIBLINGPROTESTS
	into
		@prop_val_yr,
		@case_id,
		@sibling_prop_id
end


close DUPLICATESIBLINGPROTESTS
deallocate DUPLICATESIBLINGPROTESTS




declare UPDATESIBLINGPROTESTS cursor
for
select
	sibling_ap.prop_val_yr,
	sibling_ap.case_id,
	sibling_ap.prop_id,
	child_pv.prop_id
from
	property_val as parent_pv
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
inner join
	property_val as sibling_pv
on
	sibling_pv.prop_id <> child_pv.prop_id
and	sibling_pv.prop_val_yr = child_pv.prop_val_yr
and	sibling_pv.sup_num = child_pv.sup_num
and	sibling_pv.udi_parent_prop_id = parent_pv.prop_id
and	isnull(sibling_pv.udi_status, '') <> 'S'
inner join
	_arb_protest as sibling_ap
on
	sibling_ap.prop_id = sibling_pv.prop_id
and	sibling_ap.prop_val_yr = sibling_pv.prop_val_yr
where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
and	not exists
(
	select
		*
	from
		_arb_protest as child_ap with (nolock)
	where
		child_ap.prop_val_yr = sibling_ap.prop_val_yr
	and	child_ap.case_id = sibling_ap.case_id
	and	child_ap.prop_id = child_pv.prop_id
)
for update


open UPDATESIBLINGPROTESTS
fetch next from UPDATESIBLINGPROTESTS
into
	@prop_val_yr,
	@case_id,
	@sibling_prop_id,
	@child_prop_id

while (@@fetch_status = 0)
begin

	select * into 
		#update_sibling_arb_protest 
	from 
		_arb_protest as ap
	where 
		ap.prop_val_yr = @prop_val_yr
	and	ap.case_id = @case_id
	and	ap.prop_id = @sibling_prop_id

	select * into 
		#update_sibling_arb_protest_protest_by_assoc 
	from 
		_arb_protest_protest_by_assoc as ap
	where 
		ap.prop_val_yr = @prop_val_yr
	and	ap.case_id = @case_id
	and	ap.prop_id = @sibling_prop_id

	update
		#update_sibling_arb_protest
	set
		prop_id = @child_prop_id
	where
		#update_sibling_arb_protest.prop_val_yr = @prop_val_yr
	and	#update_sibling_arb_protest.case_id = @case_id
	and	#update_sibling_arb_protest.prop_id = @sibling_prop_id
	
	update
		#update_sibling_arb_protest_protest_by_assoc
	set
		prop_id = @child_prop_id
	where
		#update_sibling_arb_protest_protest_by_assoc.prop_val_yr = @prop_val_yr
	and	#update_sibling_arb_protest_protest_by_assoc.case_id = @case_id
	and	#update_sibling_arb_protest_protest_by_assoc.prop_id = @sibling_prop_id
	
	delete
		_arb_protest_protest_by_assoc
	where
		_arb_protest_protest_by_assoc.prop_val_yr = @prop_val_yr
	and	_arb_protest_protest_by_assoc.case_id = @case_id
	and	_arb_protest_protest_by_assoc.prop_id = @sibling_prop_id

	delete 
		_arb_protest
	where
		_arb_protest.prop_val_yr = @prop_val_yr
	and	_arb_protest.case_id = @case_id
	and	_arb_protest.prop_id = @sibling_prop_id

	insert into
		_arb_protest
	select * from
		#update_sibling_arb_protest
	where
		#update_sibling_arb_protest.prop_val_yr = @prop_val_yr
	and	#update_sibling_arb_protest.case_id = @case_id
	and	#update_sibling_arb_protest.prop_id = @child_prop_id
	
	insert into
		_arb_protest_protest_by_assoc
	select * from
		#update_sibling_arb_protest_protest_by_assoc
	where
		#update_sibling_arb_protest_protest_by_assoc.prop_val_yr = @prop_val_yr
	and	#update_sibling_arb_protest_protest_by_assoc.case_id = @case_id
	and	#update_sibling_arb_protest_protest_by_assoc.prop_id = @child_prop_id

	drop table #update_sibling_arb_protest
	drop table #update_sibling_arb_protest_protest_by_assoc

	update
		_arb_protest_panel_member
	set
		prop_id = @child_prop_id
	where
		prop_id = @sibling_prop_id
	and	prop_val_yr = @prop_val_yr
	and	case_id = @case_id


	update
		_arb_protest_reason
	set
		prop_id = @child_prop_id
	where
		prop_id = @sibling_prop_id
	and	prop_val_yr = @prop_val_yr
	and	case_id = @case_id


	fetch next from UPDATESIBLINGPROTESTS
	into
		@prop_val_yr,
		@case_id,
		@sibling_prop_id,
		@child_prop_id
end


close UPDATESIBLINGPROTESTS
deallocate UPDATESIBLINGPROTESTS




--	Even though docket scheduling is not relevant to inquiries, we'll use
--	the same pattern for deleting and updating inquiries anyway.
declare DUPLICATESIBLINGINQUIRIES cursor
for
select
	sibling_ai.prop_val_yr,
	sibling_ai.case_id,
	sibling_ai.prop_id
from
	property_val as parent_pv
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
inner join
	property_val as sibling_pv
on
	sibling_pv.prop_id <> child_pv.prop_id
and	sibling_pv.prop_val_yr = child_pv.prop_val_yr
and	sibling_pv.sup_num = child_pv.sup_num
and	sibling_pv.udi_parent_prop_id = parent_pv.prop_id
and	isnull(sibling_pv.udi_status, '') <> 'S'
inner join
	_arb_inquiry as sibling_ai
on
	sibling_ai.prop_id = sibling_pv.prop_id
and	sibling_ai.prop_val_yr = sibling_pv.prop_val_yr
where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
and	exists
(
	select
		*
	from
		_arb_inquiry as child_ai with (nolock)
	where
		child_ai.prop_val_yr = sibling_ai.prop_val_yr
	and	child_ai.case_id = sibling_ai.case_id
	and	child_ai.prop_id = child_pv.prop_id
)
for update


open DUPLICATESIBLINGINQUIRIES
fetch next from DUPLICATESIBLINGINQUIRIES
into
	@prop_val_yr,
	@case_id,
	@sibling_prop_id

while (@@fetch_status = 0)
begin
	delete 
		_arb_inquiry
	where
		current of DUPLICATESIBLINGINQUIRIES


	fetch next from DUPLICATESIBLINGINQUIRIES
	into
		@prop_val_yr,
		@case_id,
		@sibling_prop_id
end


close DUPLICATESIBLINGINQUIRIES
deallocate DUPLICATESIBLINGINQUIRIES




declare UPDATESIBLINGINQUIRIES cursor
for
select
	sibling_ai.prop_val_yr,
	sibling_ai.case_id,
	sibling_ai.prop_id,
	child_pv.prop_id
from
	property_val as parent_pv
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
inner join
	property_val as sibling_pv
on
	sibling_pv.prop_id <> child_pv.prop_id
and	sibling_pv.prop_val_yr = child_pv.prop_val_yr
and	sibling_pv.sup_num = child_pv.sup_num
and	sibling_pv.udi_parent_prop_id = parent_pv.prop_id
and	isnull(sibling_pv.udi_status, '') <> 'S'
inner join
	_arb_inquiry as sibling_ai
on
	sibling_ai.prop_id = sibling_pv.prop_id
and	sibling_ai.prop_val_yr = sibling_pv.prop_val_yr
where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
and	not exists
(
	select
		*
	from
		_arb_inquiry as child_ai with (nolock)
	where
		child_ai.prop_val_yr = sibling_ai.prop_val_yr
	and	child_ai.case_id = sibling_ai.case_id
	and	child_ai.prop_id = child_pv.prop_id
)
for update


open UPDATESIBLINGINQUIRIES
fetch next from UPDATESIBLINGINQUIRIES
into
	@prop_val_yr,
	@case_id,
	@sibling_prop_id,
	@child_prop_id

while (@@fetch_status = 0)
begin
	update 
		_arb_inquiry
	set
		prop_id = @child_prop_id
	where
		current of UPDATESIBLINGINQUIRIES


	fetch next from UPDATESIBLINGINQUIRIES
	into
		@prop_val_yr,
		@case_id,
		@sibling_prop_id,
		@child_prop_id
end


close UPDATESIBLINGINQUIRIES
deallocate UPDATESIBLINGINQUIRIES

GO

