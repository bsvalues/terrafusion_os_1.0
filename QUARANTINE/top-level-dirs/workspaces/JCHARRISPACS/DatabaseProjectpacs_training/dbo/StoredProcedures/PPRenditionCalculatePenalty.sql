
CREATE PROCEDURE PPRenditionCalculatePenalty
	@input_prop_id int,
	@input_owner_id int,
	@input_rendition_year numeric(4,0),
	@input_impose_penalty_fee_create bit = 0,
	@input_impose_penalty_fee_update bit = 1,
	@input_impose_penalty_fee_update_different bit = 0
AS

declare @prop_id		int
declare	@owner_id		int
declare	@sup_yr			numeric(4,0)
declare	@sup_num		int
declare @entity_cd		varchar(5)
declare @owner_tax		numeric(14,2)
declare @owner_name		varchar(70)
declare @legal_desc		varchar(255)
declare @situs_num		varchar(10)
declare @situs_street_prefix	varchar(10)
declare @situs_street		varchar(50)
declare @situs_street_suffix	varchar(10)
declare @situs_city		varchar(30)
declare @situs_state		varchar(2)
declare @situs_zip		varchar(10)
declare @appraised_val		numeric(14,0)
declare @geo_id			varchar(50)
declare @ref_id1		varchar(50)
declare @ref_id2		varchar(50)

declare @penalty_pct	numeric(5,2)
declare @cad_fee_pct	numeric(5,2)

declare @total_tax	numeric(14,2)

declare @total_penalty		numeric(14,2)
declare @cad_fee		numeric(14,2)
declare @non_cad_penalty	numeric(14,2)

set @penalty_pct = 0.0
set @cad_fee_pct = 0.00

select
	@penalty_pct = isnull(pp_waive_penalty_percent, 0.00),
	@cad_fee_pct = isnull(pp_rendition_penalty_cad_fee_pct, 0.00)
from
	pacs_system
where
	system_type in ('A', 'B')


select 
	@owner_name = isnull(a.file_as_name, ''),
	@legal_desc = isnull(pv.legal_desc, ''),
	@situs_num = isnull(s.situs_num, ''),
	@situs_street_prefix = isnull(s.situs_street_prefx, ''),
	@situs_street = isnull(s.situs_street, ''),
	@situs_street_suffix = isnull(s.situs_street_sufix, ''),
 	@situs_city = isnull(s.situs_city, ''),
	@situs_state = isnull(s.situs_state, ''),
	@situs_zip = isnull(s.situs_zip, ''),
	@appraised_val = isnull(pv.appraised_val, 0),
	@geo_id = isnull(p.geo_id, ''),
	@ref_id1 = isnull(p.ref_id1, ''),
	@ref_id2 = isnull(p.ref_id2, ''),
	@sup_num = psa.sup_num
from
	prop_supp_assoc as psa
inner join
	property_val as pv 
on
	psa.prop_id = pv.prop_id
and	psa.owner_tax_yr = pv.prop_val_yr
and	psa.sup_num = pv.sup_num
inner join
	property as p 
on
	pv.prop_id = p.prop_id
inner join
	owner as o 
on
	pv.prop_id = o.prop_id
and	pv.sup_num = o.sup_num
and	pv.prop_val_yr = o.owner_tax_yr
inner join
	account as a
on
	o.owner_id = a.acct_id
left outer join
	situs as s
on
	pv.prop_id = s.prop_id
and	s.primary_situs = 'Y'
where
	o.prop_id = @input_prop_id
and	o.owner_id = @input_owner_id
and	o.owner_tax_yr = @input_rendition_year



	

select
	@total_tax = sum( cast( round( ((poev.taxable_val / 100.0) * (isnull(tr.m_n_o_tax_pct, 0.0) + isnull(tr.i_n_s_tax_pct, 0.0))), 2) as numeric(14,2) ) )
from
	prop_owner_entity_val as poev
inner join
	entity as e
on
	poev.entity_id = e.entity_id
and	e.entity_cd != 'CAD'
inner join
	tax_rate as tr
on
	poev.sup_yr = tr.tax_rate_yr
and	poev.entity_id = tr.entity_id
and tr.appraise_for = 'T'
where
	poev.prop_id = @input_prop_id
and	poev.owner_id = @input_owner_id
and     poev.sup_num = @sup_num
and	poev.sup_yr = @input_rendition_year


set @total_penalty = cast( round( ((@total_tax * @penalty_pct) / 100.0), 2) as numeric(14,2))


declare @old_total_penalty	numeric(14,2)

select
	@old_total_penalty = isnull(rendition_penalty, 0.00)
from
	pp_rendition_prop_penalty
where
	prop_id = @input_prop_id
and	owner_id = @input_owner_id
and	sup_num = @sup_num
and	rendition_year = @input_rendition_year


if
(
	(@old_total_penalty is null and (@input_impose_penalty_fee_create = 1)) or
	(@old_total_penalty is not null and (@input_impose_penalty_fee_update = 1)) or
	(@old_total_penalty is not null and (@input_impose_penalty_fee_update_different = 1) and (@old_total_penalty <> @total_penalty))
)
begin
	delete
		pp_rendition_prop_penalty_distribution
	where
		prop_id = @input_prop_id
	and	owner_id = @input_owner_id
	and	sup_num = @sup_num
	and	rendition_year = @input_rendition_year
	

	delete
		pp_rendition_prop_penalty
	where
		prop_id = @input_prop_id
	and	owner_id = @input_owner_id
	and	sup_num = @sup_num
	and	rendition_year = @input_rendition_year

	if @total_penalty <> 0.00
	begin
		set @cad_fee = cast( round( ((@total_penalty * @cad_fee_pct) / 100.0), 2) as numeric(14,2))
		set @non_cad_penalty = (@total_penalty - @cad_fee)
		
		declare @remaining_non_cad_penalty	numeric(14,2)
		set @remaining_non_cad_penalty = @non_cad_penalty
		
		declare prop_owner_entity_tax_info scroll cursor
		for
			select
				poev.prop_id,
				poev.owner_id,
				poev.sup_yr,
				poev.sup_num,
				e.entity_cd,
				cast( round( ((poev.taxable_val / 100.0) * (isnull(tr.m_n_o_tax_pct, 0.0) + isnull(tr.i_n_s_tax_pct, 0.0))), 2 ) as numeric(14,2) ) as owner_tax
			from
				prop_owner_entity_val as poev 
		inner join
			entity as e
		on
			poev.entity_id = e.entity_id
		and	e.entity_cd != 'CAD'
		inner join
			tax_rate as tr
		on
			poev.sup_yr = tr.tax_rate_yr
		and	poev.entity_id = tr.entity_id
		and tr.appraise_for = 'T'
		where
			poev.prop_id = @input_prop_id
		and	poev.owner_id = @input_owner_id
		and	poev.sup_num = @sup_num
		and	poev.sup_yr = @input_rendition_year
		
		
		open prop_owner_entity_tax_info
		fetch next from prop_owner_entity_tax_info into
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
				set @entity_penalty = cast( round( (@non_cad_penalty * (@owner_tax / @total_tax)), 2) as numeric(14,2))
			end
		
			if @entity_penalty > @remaining_non_cad_penalty
			begin
				set @entity_penalty = @remaining_non_cad_penalty
			end
		
			set @remaining_non_cad_penalty = @remaining_non_cad_penalty - @entity_penalty
		
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
				@sup_num,
				@input_rendition_year,
				@entity_cd,
				@entity_penalty
			)
	
			fetch next from prop_owner_entity_tax_info into
				@prop_id,
				@owner_id,
				@sup_yr,
				@sup_num,
				@entity_cd,
				@owner_tax
		end
	

		close prop_owner_entity_tax_info
	
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
			@sup_num,
			@input_rendition_year,
			'CAD',
			@cad_fee
		)

		insert into
			pp_rendition_prop_penalty
		(
			prop_id,
			owner_id,
			sup_num,
			rendition_year,
			owner_name,
			legal_desc,
			situs_address,
			market_value,
			rendition_penalty,
			geo_id,
			ref_id1,
			ref_id2
		)
		values
		(
			@input_prop_id,
			@input_owner_id,
			@sup_num,
			@input_rendition_year,
			@owner_name,
			@legal_desc,
			cast( rtrim(@situs_num + ' ' + @situs_street_prefix + ' ' + @situs_street + ' ' + @situs_street_suffix + ' ' + @situs_city + ' ' + @situs_state + ' ' + @situs_zip) as varchar(140) ),
			@appraised_val,
			@total_penalty,
			@geo_id,
			@ref_id1,
			@ref_id2
		)
		
		deallocate prop_owner_entity_tax_info


		update
			pp_rendition_tracking
		set
			pp_rendition_tracking.waiver_request_mandatory_dt = convert(varchar(10), case when datepart(dw, dateadd(day, 30, GetDate())) = 7
														then dateadd(day, 32, GetDate())
													when datepart(dw, dateadd(day, 30, GetDate())) = 1
														then dateadd(day, 31, GetDate())
													else dateadd(day, 30, GetDate()) end, 101)
		from
			property_val pv,
			pacs_system ps,
			pp_waiver_status pws
		where
			pp_rendition_tracking.prop_id = pv.prop_id
		and	pp_rendition_tracking.prop_val_yr = pv.prop_val_yr
		and	pv.prop_inactive_dt is null
		and	pp_rendition_tracking.prop_val_yr = @input_rendition_year
		and	pp_rendition_tracking.prop_id  = @input_prop_id
	end


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
		event_desc,
		pacs_user_id
	)
	values
	(
		@next_event_id,
		'BPPP',
		GetDate(),
		'System',
		'Business Personal Property Penalty Created for Year ' + cast(@input_rendition_year as varchar(4)),
		1
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
end

GO

