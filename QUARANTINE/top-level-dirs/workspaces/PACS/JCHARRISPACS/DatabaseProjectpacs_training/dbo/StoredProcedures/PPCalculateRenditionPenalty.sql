
create procedure dbo.PPCalculateRenditionPenalty
	@input_prop_id int,
	@input_owner_id int,
	@input_year numeric(4,0),
	@input_sup_num int
as


declare @cad_fee_pct numeric(5,2)
declare @penalty_pct numeric(5,2)

select
	@penalty_pct = pp_waive_penalty_percent,
	@cad_fee_pct = pp_rendition_penalty_cad_fee_pct
from
	pacs_system
where
	system_type in ('B', 'C')
/*

if @penalty_pct is null
begin
	set @penalty_pct = 10.0
end

if @cad_fee_pct is null
begin
	set @cad_fee_pct = 5.00
end

-- Jeremy Wilson 30500 changes
declare @penalty_flag bit

select 
	@penalty_flag = IsNull(late_rendition_penalty_flag, 0)
from
	pp_rendition_prop_penalty
where
		prop_id = @input_prop_id
	and	owner_id = @input_owner_id
	and	rendition_year = @input_year
	and	sup_num = @input_sup_num

if @penalty_flag = 0
begin
	set @penalty_pct = 0
end

declare @total_tax	numeric(14,2)


select
	@total_tax = cast(sum(round((isnull(bill.bill_adj_m_n_o, 0.0) + isnull(bill.bill_adj_i_n_s, 0)), 2)) as numeric(14,2))
from
	bill with (nolock)
inner join
	entity as e with (nolock)
on
	e.entity_id = bill.entity_id
and	e.entity_cd != 'CAD'
where
	bill.prop_id = @input_prop_id
and	bill.owner_id = @input_owner_id
and	bill.sup_tax_yr = @input_year
and     bill.sup_num = @input_sup_num
and	isnull(bill.adjustment_code, '') <> 'BPP'


if @total_tax is null
begin
	set @total_tax = 0.0
end


declare @total_penalty numeric(14,2)
set @total_penalty = cast(round(((@total_tax * @penalty_pct) / 100.0), 2) as numeric(14,2))


delete
	pp_rendition_prop_penalty_distribution
where
	prop_id = @input_prop_id
and	owner_id = @input_owner_id
and	rendition_year = @input_year
and	sup_num = @input_sup_num

-- Jeremy Wilson 30500 changes
--if @total_penalty <> 0.00
--begin
	declare @cad_fee numeric(14,2)
	set @cad_fee = cast(round(((@total_penalty * @cad_fee_pct) / 100.0), 2) as numeric(14,2))
	
	declare @non_cad_penalty numeric(14,2)
	set @non_cad_penalty = (@total_penalty - @cad_fee)
	
	declare @remaining_non_cad_penalty numeric(14,2)
	set @remaining_non_cad_penalty = @non_cad_penalty
	
	declare TAXINFO scroll cursor
	for
	select
		bill.prop_id,
		bill.owner_id,
		bill.sup_tax_yr,
		bill.sup_num,	--(Note: I don't think sup_num should matter here...Jeremy Wilson)
		e.entity_cd,
		cast(sum(round((bill.bill_adj_m_n_o + bill.bill_adj_i_n_s), 2)) as numeric(14,2)) as owner_tax
	from
		bill with (nolock)
	inner join
		entity as e with (nolock)
	on
		e.entity_id = bill.entity_id
	and	e.entity_cd != 'CAD'
	where
		bill.prop_id = @input_prop_id
	and	bill.owner_id = @input_owner_id
	and	bill.sup_tax_yr = @input_year
	and	bill.sup_num = @input_sup_num  --(Note: I don't think sup_num should matter here...Jeremy Wilson)
	and	isnull(bill.adjustment_code, '') <> 'BPP'
	group by
		bill.prop_id,
		bill.owner_id,
		bill.sup_tax_yr,
		bill.sup_num, 
		e.entity_cd
	order by
		owner_tax
		
	
			
	declare @prop_id int
	declare	@owner_id int
	declare	@sup_yr numeric(4,0)
	declare	@sup_num int
	declare @entity_cd varchar(5)
	declare @owner_tax numeric(14,2)
	
	
	open TAXINFO
	fetch next from TAXINFO into
		@prop_id,
		@owner_id,
		@sup_yr,
		@sup_num,
		@entity_cd,
		@owner_tax
		
	
	while (@@fetch_status = 0)
	begin
		declare @entity_penalty	numeric(14,2)
		set @entity_penalty = 0.00
	
		if (@total_tax <> 0.00)
		begin
			set @entity_penalty = cast(round((@non_cad_penalty * (@owner_tax / @total_tax)), 2) as numeric(14,2))
		end
	
		if @entity_penalty > @remaining_non_cad_penalty
		begin
			set @entity_penalty = @remaining_non_cad_penalty
		end
	
		set @remaining_non_cad_penalty = @remaining_non_cad_penalty - @entity_penalty
	
-- Jeremy Wilson 30500 changes
--		if @entity_penalty > 0.0
--		begin
			insert into
				pp_rendition_prop_penalty_distribution
			(
				prop_id,
				owner_id,
				rendition_year,
				sup_num,
				entity_cd,
				penalty_distribution_amt
			)
			values
			(
				@prop_id,
				@owner_id,
				@sup_yr,
				@sup_num,
				@entity_cd,
				@entity_penalty
			)
--		end
	

		
		fetch next from TAXINFO into
			@prop_id,
			@owner_id,
			@sup_yr,
			@sup_num,
			@entity_cd,
			@owner_tax
	end
	
	
	close TAXINFO
	deallocate TAXINFO
	
	insert into
		pp_rendition_prop_penalty_distribution
	(
		prop_id,
		owner_id,
		sup_num,
		rendition_year,
		entity_cd,
		penalty_distribution_amt
	)
	values
	(
		@input_prop_id,
		@input_owner_id,
		@input_sup_num,
		@input_year,
		'CAD',
		@cad_fee + @remaining_non_cad_penalty  -- rounding may cause a discrepancy of a penny or two, so we'll put it in the 'CAD' bucket
	)


	update
		pp_rendition_prop_penalty
	set
		rendition_penalty = @total_penalty
	where
		prop_id = @input_prop_id
	and	owner_id = @input_owner_id
	and	rendition_year = @input_year
	and	sup_num = @input_sup_num


	insert into
		pp_rendition_penalty_entity
	(
		import_entity_cd,
		system_entity_id
	)
	select distinct
		prppd.entity_cd,
		null
	from
		pp_rendition_prop_penalty_distribution as prppd with (nolock)
	left outer join
		pp_rendition_penalty_entity as prpe with (nolock)
	on
		prpe.import_entity_cd = prppd.entity_cd
	where
		prppd.rendition_year = @input_year
	and	prpe.import_entity_cd is null

	
	if not exists (select * from event_type where event_type_cd = 'BPPP')
	begin
		insert into event_type
		(
			event_type_cd,
			event_type_desc,
			sys_flag,
			event_type_flag
		)
		values
		(
			'BPPP',
			'Business Personal Property Penalty',
			'T',
			'U'
		)
	end
	
	--Insert 'BPPP' event on each property processed
	declare @next_event_id	int
	exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
	
	insert into event
	(
		event_id,
		event_type,
		event_date,
		pacs_user,
		event_desc
	)
	values
	(
		@next_event_id,
		'BPPP',
		GetDate(),
		'System',
		'Business Personal Property Penalty Calculate for Year ' + cast(@input_year as varchar(4))
	)
	
	insert into prop_event_assoc
	(
		prop_id,
		event_id
	)
	values
	(
		@input_prop_id,
		@next_event_id
	)
-- end

*/

GO

