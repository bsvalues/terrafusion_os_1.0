
create procedure MoveDeedHistoryFromUDIParentToProperty
	@input_parent_prop_id int,
 	@input_child_prop_id int,
	@input_prop_val_yr numeric(4,0),
	@input_sup_num int
with recompile

as


declare @chg_of_owner_id int
declare @parent_prop_id int
declare @sibling_prop_id int
declare @child_prop_id int
declare @seq_num int
declare @sup_num int
declare @sup_tax_yr numeric(4,0)
declare @imprv_hstd_val numeric(14,0)
declare @imprv_non_hstd_val numeric(14,0)
declare @land_hstd_val numeric(14,0)
declare @land_non_hstd_val numeric(14,0)
declare @ag_use_val numeric(14,0)
declare @ag_market numeric(14,0)
declare @ag_loss numeric(14,0)
declare @timber_use numeric(14,0)
declare @timber_market numeric(14,0)
declare @timber_loss numeric(14,0)
declare @appraised_val numeric(14,0)
declare @assessed_val numeric(14,0)
declare @market numeric(14,0)

declare PARENTCHGOFOWNER cursor
for
select
	parent_coopa.chg_of_owner_id,
	parent_coopa.prop_id,
	child_pv.prop_id,
	parent_coopa.seq_num,
	parent_coopa.sup_tax_yr,
	parent_coopa.imprv_hstd_val,
	parent_coopa.imprv_non_hstd_val,
	parent_coopa.land_hstd_val,
	parent_coopa.land_non_hstd_val,
	parent_coopa.ag_use_val,
	parent_coopa.ag_market,
	parent_coopa.ag_loss,
	parent_coopa.timber_use,
	parent_coopa.timber_market,
	parent_coopa.timber_loss,
	parent_coopa.appraised_val,
	parent_coopa.assessed_val,
	parent_coopa.market
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
	chg_of_owner_prop_assoc as parent_coopa
on
	parent_coopa.prop_id = parent_pv.prop_id
inner join
	chg_of_owner as coo
on
	coo.chg_of_owner_id = parent_coopa.chg_of_owner_id
where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
for update


open PARENTCHGOFOWNER
fetch next from PARENTCHGOFOWNER
into
	@chg_of_owner_id,
	@parent_prop_id,
	@child_prop_id,
	@seq_num,
	@sup_tax_yr,
	@imprv_hstd_val,
	@imprv_non_hstd_val,
	@land_hstd_val,
	@land_non_hstd_val,
	@ag_use_val,
	@ag_market,
	@ag_loss,
	@timber_use,
	@timber_market,
	@timber_loss,
	@appraised_val,
	@assessed_val,
	@market

while (@@fetch_status = 0)
begin
	if not exists
	(
		select
			*
		from
			chg_of_owner_prop_assoc as child_coopa with (nolock)
		where
			child_coopa.chg_of_owner_id = @chg_of_owner_id
		and	child_coopa.prop_id = @child_prop_id
	)
	begin
		--	If the child was not already part of the change of ownership,
		--	create a matching chg_of_owner_prop_assoc row for the child.
		--	We can't update the prop_id because of foreign key constraints
		--	associated with the seller_assoc table.
		insert into
			chg_of_owner_prop_assoc
		(
			chg_of_owner_id,
			prop_id,
			seq_num,
			sup_tax_yr,
			imprv_hstd_val,
			imprv_non_hstd_val,
			land_hstd_val,
			land_non_hstd_val,
			ag_use_val,
			ag_market,
			ag_loss,
			timber_use,
			timber_market,
			timber_loss,
			appraised_val,
			assessed_val,
			market
		)
		values
		(
			@chg_of_owner_id,
			@child_prop_id,
			@seq_num,
			@sup_tax_yr,
			@imprv_hstd_val,
			@imprv_non_hstd_val,
			@land_hstd_val,
			@land_non_hstd_val,
			@ag_use_val,
			@ag_market,
			@ag_loss,
			@timber_use,
			@timber_market,
			@timber_loss,
			@appraised_val,
			@assessed_val,
			@market
		)


		--	Now that we have a chg_of_owner_prop_assoc row for the child, we
		--	are able to update the prop_id on the parent's seller_assoc rows
		--	without violating the foreign key constraint.
		update
			seller_assoc
		set
			prop_id = @child_prop_id
		from
			seller_assoc as parent_sa with (nolock)
		inner join
			chg_of_owner_prop_assoc as parent_coopa with (nolock)
		on
			parent_coopa.chg_of_owner_id = parent_sa.chg_of_owner_id
		and	parent_coopa.prop_id = parent_sa.prop_id
		inner join
			chg_of_owner as coo with (nolock)
		on
			coo.chg_of_owner_id = parent_coopa.chg_of_owner_id
		inner join
			chg_of_owner_prop_assoc as child_coopa with (nolock)
		on
			child_coopa.chg_of_owner_id = parent_coopa.chg_of_owner_id
		and	child_coopa.prop_id = @child_prop_id
		where
			parent_sa.chg_of_owner_id = @chg_of_owner_id
		and	parent_sa.prop_id = @parent_prop_id
		and	not exists
		(
			select
				*
			from
				seller_assoc as child_sa with (nolock)
			where
				child_sa.seller_id = parent_sa.seller_id
			and	child_sa.chg_of_owner_id = parent_sa.chg_of_owner_id
			and	child_sa.prop_id = child_coopa.prop_id
		)
	end

	--	Delete any remaining seller_assoc rows for the parent
	delete
		seller_assoc
	where
		chg_of_owner_id = @chg_of_owner_id
	and	prop_id = @parent_prop_id


	--	Delete the chg_of_owner_prop_assoc row for the parent
	delete
		chg_of_owner_prop_assoc
	where
		current of PARENTCHGOFOWNER


	fetch next from PARENTCHGOFOWNER
	into
		@chg_of_owner_id,
		@parent_prop_id,
		@child_prop_id,
		@seq_num,
		@sup_tax_yr,
		@imprv_hstd_val,
		@imprv_non_hstd_val,
		@land_hstd_val,
		@land_non_hstd_val,
		@ag_use_val,
		@ag_market,
		@ag_loss,
		@timber_use,
		@timber_market,
		@timber_loss,
		@appraised_val,
		@assessed_val,
		@market
end


close PARENTCHGOFOWNER
deallocate PARENTCHGOFOWNER



declare SIBLINGCHGOFOWNER cursor
for
select
	sibling_coopa.chg_of_owner_id,
	sibling_coopa.prop_id,
	child_pv.prop_id,
	sibling_coopa.seq_num,
	sibling_coopa.sup_tax_yr,
	sibling_coopa.imprv_hstd_val,
	sibling_coopa.imprv_non_hstd_val,
	sibling_coopa.land_hstd_val,
	sibling_coopa.land_non_hstd_val,
	sibling_coopa.ag_use_val,
	sibling_coopa.ag_market,
	sibling_coopa.ag_loss,
	sibling_coopa.timber_use,
	sibling_coopa.timber_market,
	sibling_coopa.timber_loss,
	sibling_coopa.appraised_val,
	sibling_coopa.assessed_val,
	sibling_coopa.market
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
	chg_of_owner_prop_assoc as sibling_coopa
on
	sibling_coopa.prop_id = sibling_pv.prop_id
inner join
	chg_of_owner as coo with (nolock)
on
	coo.chg_of_owner_id = sibling_coopa.chg_of_owner_id

where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
for update


open SIBLINGCHGOFOWNER
fetch next from SIBLINGCHGOFOWNER
into
	@chg_of_owner_id,
	@sibling_prop_id,
	@child_prop_id,
	@seq_num,
	@sup_tax_yr,
	@imprv_hstd_val,
	@imprv_non_hstd_val,
	@land_hstd_val,
	@land_non_hstd_val,
	@ag_use_val,
	@ag_market,
	@ag_loss,
	@timber_use,
	@timber_market,
	@timber_loss,
	@appraised_val,
	@assessed_val,
	@market

while (@@fetch_status = 0)
begin
	if not exists
	(
		select
			*
		from
			chg_of_owner_prop_assoc as child_coopa with (nolock)
		where
			child_coopa.chg_of_owner_id = @chg_of_owner_id
		and	child_coopa.prop_id = @child_prop_id
	)
	begin
		--	If the child was not already part of the change of ownership,
		--	create a matching chg_of_owner_prop_assoc row for the child.
		--	We can't update the prop_id because of foreign key constraints
		--	associated with the seller_assoc table.
		insert into
			chg_of_owner_prop_assoc
		(
			chg_of_owner_id,
			prop_id,
			seq_num,
			sup_tax_yr,
			imprv_hstd_val,
			imprv_non_hstd_val,
			land_hstd_val,
			land_non_hstd_val,
			ag_use_val,
			ag_market,
			ag_loss,
			timber_use,
			timber_market,
			timber_loss,
			appraised_val,
			assessed_val,
			market
		)
		values
		(
			@chg_of_owner_id,
			@child_prop_id,
			@seq_num,
			@sup_tax_yr,
			@imprv_hstd_val,
			@imprv_non_hstd_val,
			@land_hstd_val,
			@land_non_hstd_val,
			@ag_use_val,
			@ag_market,
			@ag_loss,
			@timber_use,
			@timber_market,
			@timber_loss,
			@appraised_val,
			@assessed_val,
			@market
		)

		--	Now that we have a chg_of_owner_prop_assoc row for the child, we
		--	are able to update the prop_id on the sibling's seller_assoc rows
		--	without violating the foreign key constraint.
		update
			seller_assoc
		set
			prop_id = @child_prop_id
		from
			seller_assoc as sibling_sa with (nolock)
		inner join
			chg_of_owner_prop_assoc as sibling_coopa with (nolock)
		on
			sibling_coopa.chg_of_owner_id = sibling_sa.chg_of_owner_id
		and	sibling_coopa.prop_id = sibling_sa.prop_id
		inner join
			chg_of_owner as coo with (nolock)
		on
			coo.chg_of_owner_id = sibling_coopa.chg_of_owner_id
		inner join
			chg_of_owner_prop_assoc as child_coopa with (nolock)
		on
			child_coopa.chg_of_owner_id = sibling_coopa.chg_of_owner_id
		and	child_coopa.prop_id = @child_prop_id
		where
			sibling_sa.chg_of_owner_id = @chg_of_owner_id
		and	sibling_sa.prop_id = @sibling_prop_id
		and	not exists
		(
			select
				*
			from
				seller_assoc as child_sa with (nolock)
			where
				child_sa.seller_id = sibling_sa.seller_id
			and	child_sa.chg_of_owner_id = sibling_sa.chg_of_owner_id
			and	child_sa.prop_id = child_coopa.prop_id
		)
	end


	--	Delete any remaining seller_assoc rows for the sibling
	delete
		seller_assoc
	where
		chg_of_owner_id = @chg_of_owner_id
	and	prop_id = @sibling_prop_id


	--	Delete the chg_of_owner_prop_assoc row for the sibling
	delete
		chg_of_owner_prop_assoc
	where
		current of SIBLINGCHGOFOWNER


	fetch next from SIBLINGCHGOFOWNER
	into
		@chg_of_owner_id,
		@sibling_prop_id,
		@child_prop_id,
		@seq_num,
		@sup_tax_yr,
		@imprv_hstd_val,
		@imprv_non_hstd_val,
		@land_hstd_val,
		@land_non_hstd_val,
		@ag_use_val,
		@ag_market,
		@ag_loss,
		@timber_use,
		@timber_market,
		@timber_loss,
		@appraised_val,
		@assessed_val,
		@market
end

close SIBLINGCHGOFOWNER
deallocate SIBLINGCHGOFOWNER

declare @next_seq_num int
set @next_seq_num = 0

declare CHILDCHGOFOWNER cursor
for
select
	coopa.chg_of_owner_id,
	coopa.prop_id,
	coopa.seq_num
from
	chg_of_owner_prop_assoc as coopa
inner join
	chg_of_owner as coo with(nolock)
on
	coo.chg_of_owner_id = coopa.chg_of_owner_id
where
	coopa.prop_id = @input_child_prop_id
order by
	coo.deed_dt desc
for update of
	seq_num



open CHILDCHGOFOWNER
fetch next from CHILDCHGOFOWNER
into
	@chg_of_owner_id,
	@child_prop_id,
	@seq_num

while (@@fetch_status = 0)
begin
	update
		chg_of_owner_prop_assoc
	set
		seq_num = @next_seq_num
	where
		current of CHILDCHGOFOWNER

	set @next_seq_num = @next_seq_num + 1


	fetch next from CHILDCHGOFOWNER
	into
		@chg_of_owner_id,
		@child_prop_id,
		@seq_num
end

close CHILDCHGOFOWNER
deallocate CHILDCHGOFOWNER

GO

