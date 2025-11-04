




create procedure FreezeCeilingSinglePropertyCalculateAndUpdate
	@input_prop_id int,
	@input_year numeric(4,0)
as


declare @prop_id int
declare @owner_id int
declare @entity_id int
declare @owner_tax_yr numeric(4,0)
declare @sup_num int
declare @status_cd varchar(5)
declare @certification_dt datetime
declare @exmpt_type_cd varchar(5)
declare @qualify_yr numeric(4,0)
declare @freeze_flag bit
declare @land_hstd_val numeric(14,0)
declare @imprv_hstd_val numeric(14,0)
declare @ten_percent_cap numeric(14,0)
declare @local_exemption_amt numeric(14,0)
declare @state_exemption_amt numeric(14,0)
declare @freeze_prop_id int
declare @freeze_override bit
declare @prev_yr_land_hstd_val numeric(14,0)
declare @prev_yr_imprv_hstd_val numeric(14,0)
declare @prev_yr_ten_percent_cap numeric(14,0)
declare @prev_yr_local_exemption_amt numeric(14,0)
declare @prev_yr_state_exemption_amt numeric(14,0)
declare @prev_yr_m_n_o_tax_pct numeric(13,10)
declare @prev_yr_i_n_s_tax_pct numeric(13,10)
declare @prev_yr_transfer_dt datetime
declare @prev_yr_transfer_pct numeric(9,6)

declare @tmp_pee table
(
prop_id int,
owner_id int,
entity_id int,
owner_tax_yr numeric(4,0),
exmpt_tax_yr numeric(4,0),
sup_num int,
local_exemption_amt numeric(14,0),
state_exemption_amt numeric(14,0)
,
primary key clustered (exmpt_tax_yr,owner_tax_yr,sup_num,prop_id,entity_id,owner_id)
)

insert into @tmp_pee 
select
	prop_id,
	owner_id,
	entity_id,
	owner_tax_yr,
	exmpt_tax_yr,
	sup_num,
	sum(isnull(local_amt, 0)) as local_exemption_amt,
	sum(isnull(state_amt, 0)) as state_exemption_amt
from
	property_entity_exemption with (nolock)
where 	prop_id = @input_prop_id and owner_tax_yr in (@input_year, @input_year-1) 
group by
	prop_id,
	owner_id,
	entity_id,
	owner_tax_yr,
	exmpt_tax_yr,
	sup_num

declare FREEZE cursor
for
select
	psa.prop_id,
	o.owner_id,
	epa.entity_id,
	psa.owner_tax_yr,
	psa.sup_num,
	sg.status_cd,
	py.certification_dt,
	pe.exmpt_type_cd,
	pe.qualify_yr,
	ee.freeze_flag,
	poev.land_hstd_val,
	poev.imprv_hstd_val,
	poev.ten_percent_cap,
	pee.local_exemption_amt,
	pee.state_exemption_amt,
	pf.prop_id,
	pf.freeze_override,
	prev_yr_poev.land_hstd_val,
	prev_yr_poev.imprv_hstd_val,
	prev_yr_poev.ten_percent_cap,
	prev_yr_pee.local_exemption_amt,
	prev_yr_pee.state_exemption_amt,
	prev_yr_tr.m_n_o_tax_pct,
	prev_yr_tr.i_n_s_tax_pct,
	prev_yr_pf.transfer_dt,
	prev_yr_pf.transfer_pct
from
	prop_supp_assoc as psa with (nolock)
left outer join
	supplement as s with (nolock)
on
	s.sup_tax_yr = psa.owner_tax_yr
and	s.sup_num = psa.sup_num
left outer join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
left outer join
	pacs_year as py with (nolock)
on
	py.tax_yr = psa.owner_tax_yr
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	pv.prop_inactive_dt is null
inner join
	owner as o with (nolock)
on
	o.prop_id = psa.prop_id
and	o.owner_tax_yr = psa.owner_tax_yr
and	o.sup_num = psa.sup_num
inner join
	entity_prop_assoc as epa with (nolock)
on
	epa.prop_id = psa.prop_id
and	epa.tax_yr = psa.owner_tax_yr
and	epa.sup_num = psa.sup_num
inner join
	entity_exmpt as ee with (nolock)
on
	ee.entity_id = epa.entity_id
and	ee.exmpt_tax_yr = psa.owner_tax_yr
and	ee.freeze_flag = 1
inner join
	tax_rate as tr with (nolock)
on
	tr.entity_id = ee.entity_id
and	tr.tax_rate_yr = ee.exmpt_tax_yr
and	tr.enable_freeze_ceiling_calculation = 1
inner join
	property_exemption as pe with (nolock)
on
	pe.prop_id = psa.prop_id
and	pe.owner_id = o.owner_id
and	pe.owner_tax_yr = psa.Owner_tax_yr
and	pe.exmpt_tax_yr = psa.owner_tax_yr
and	pe.sup_num = psa.sup_num
and	pe.exmpt_type_cd = ee.exmpt_type_cd
and	pe.qualify_yr = (psa.owner_tax_yr - 1)
left outer join
	prop_owner_entity_val as poev with (nolock)
on
	poev.prop_id = psa.prop_id
and	poev.owner_id = o.owner_id
and	poev.entity_id = epa.entity_id
and	poev.sup_yr = psa.owner_tax_yr
and	poev.sup_num = psa.sup_num
left outer join
	@tmp_pee as pee
on
	pee.prop_id = psa.prop_id
and	pee.owner_id = o.owner_id
and	pee.entity_id = epa.entity_id
and	pee.owner_tax_yr = psa.owner_tax_yr
and	pee.exmpt_tax_yr = psa.owner_tax_yr
and	pee.sup_num = psa.sup_num
left outer join
	property_freeze as pf with (nolock)
on
	pf.prop_id = psa.prop_id
and	pf.owner_id = o.owner_id
and	pf.entity_id = epa.entity_id
and	pf.owner_tax_yr = psa.owner_tax_yr
and	pf.exmpt_tax_yr = psa.owner_tax_yr
and	pf.sup_num = psa.sup_num
and	pf.exmpt_type_cd = pe.exmpt_type_cd

inner join
	prop_supp_assoc as prev_yr_psa with (nolock)
on
	prev_yr_psa.prop_id = psa.prop_id
and	prev_yr_psa.owner_tax_yr = (psa.owner_tax_yr - 1)

inner join
	property_val as prev_yr_pv with (nolock)
on
	prev_yr_pv.prop_id = prev_yr_psa.prop_id
and	prev_yr_pv.prop_val_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_pv.sup_num = prev_yr_psa.sup_num
and	prev_yr_pv.prop_inactive_dt is null
inner join
	owner as prev_yr_o with (nolock)
on
	prev_yr_o.prop_id = prev_yr_psa.prop_id
and	prev_yr_o.owner_tax_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_o.sup_num = prev_yr_psa.sup_num
inner join
	entity_prop_assoc as prev_yr_epa with (nolock)
on
	prev_yr_epa.entity_id = epa.entity_id
and	prev_yr_epa.prop_id = prev_yr_psa.prop_id
and	prev_yr_epa.tax_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_epa.sup_num = prev_yr_psa.sup_num
inner join
	entity_exmpt as prev_yr_ee with (nolock)
on
	prev_yr_ee.entity_id = prev_yr_epa.entity_id
and	prev_yr_ee.exmpt_type_cd = pe.exmpt_type_cd
and	prev_yr_ee.exmpt_tax_yr = prev_yr_psa.owner_tax_yr
inner join
	tax_rate as prev_yr_tr with (nolock)
on
	prev_yr_tr.entity_id = prev_yr_ee.entity_id
and	prev_yr_tr.tax_rate_yr = prev_yr_ee.exmpt_tax_yr
inner join
	property_exemption as prev_yr_pe with (nolock)
on
	prev_yr_pe.prop_id = prev_yr_psa.prop_id
and	prev_yr_pe.owner_id = prev_yr_o.owner_id
and	prev_yr_pe.owner_tax_yr = prev_yr_psa.Owner_tax_yr
and	prev_yr_pe.exmpt_tax_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_pe.sup_num = prev_yr_psa.sup_num
and	prev_yr_pe.exmpt_type_cd = prev_yr_ee.exmpt_type_cd
and	prev_yr_pe.qualify_yr = pe.qualify_yr
inner join
	prop_owner_entity_val as prev_yr_poev with (nolock)
on
	prev_yr_poev.prop_id = prev_yr_psa.prop_id
and	prev_yr_poev.owner_id = prev_yr_o.owner_id
and	prev_yr_poev.entity_id = prev_yr_epa.entity_id
and	prev_yr_poev.sup_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_poev.sup_num = prev_yr_psa.sup_num
left outer join
	@tmp_pee as prev_yr_pee
on
	prev_yr_pee.prop_id = prev_yr_psa.prop_id
and	prev_yr_pee.owner_id = prev_yr_o.owner_id
and	prev_yr_pee.entity_id = prev_yr_epa.entity_id
and	prev_yr_pee.owner_tax_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_pee.exmpt_tax_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_pee.sup_num = prev_yr_psa.sup_num
left outer join
	property_freeze as prev_yr_pf with (nolock)
on
	prev_yr_pf.prop_id = prev_yr_psa.prop_id
and	prev_yr_pf.owner_id = prev_yr_o.owner_id
and	prev_yr_pf.entity_id = prev_yr_epa.entity_id
and	prev_yr_pf.owner_tax_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_pf.exmpt_tax_yr = prev_yr_psa.owner_tax_yr
and	prev_yr_pf.sup_num = prev_yr_psa.sup_num
and	prev_yr_pf.exmpt_type_cd = prev_yr_pe.exmpt_type_cd

where
	psa.prop_id = @input_prop_id
and	psa.owner_tax_yr = @input_year



open FREEZE
fetch next from FREEZE
into
	@prop_id,
	@owner_id,
	@entity_id,
	@owner_tax_yr,
	@sup_num,
	@status_cd,
	@certification_dt,
	@exmpt_type_cd,
	@qualify_yr,
	@freeze_flag,
	@land_hstd_val,
	@imprv_hstd_val,
	@ten_percent_cap,
	@local_exemption_amt,
	@state_exemption_amt,
	@freeze_prop_id,
	@freeze_override,
	@prev_yr_land_hstd_val,
	@prev_yr_imprv_hstd_val,
	@prev_yr_ten_percent_cap,
	@prev_yr_local_exemption_amt,
	@prev_yr_state_exemption_amt,
	@prev_yr_m_n_o_tax_pct,
	@prev_yr_i_n_s_tax_pct,
	@prev_yr_transfer_dt,
	@prev_yr_transfer_pct

while (@@fetch_status = 0)
begin
	declare @freeze_assessed_amount numeric(14,0)
	declare @freeze_taxable_amount numeric(14,0)

	set @freeze_assessed_amount = (isnull(@imprv_hstd_val, 0) + isnull(@land_hstd_val, 0) - isnull(@ten_percent_cap, 0))
	set @freeze_taxable_amount = @freeze_assessed_amount - (isnull(@local_exemption_amt, 0) + isnull(@state_exemption_amt, 0))

	if (@freeze_taxable_amount < 0)
	begin
		set @freeze_taxable_amount = 0
	end


	declare @prev_yr_freeze_assessed_amount numeric(14,0)
	declare @prev_yr_freeze_taxable_amount numeric(14,0)

	set @prev_yr_freeze_assessed_amount = (isnull(@prev_yr_imprv_hstd_val, 0) + isnull(@prev_yr_land_hstd_val, 0) - isnull(@prev_yr_ten_percent_cap, 0))
	set @prev_yr_freeze_taxable_amount = @prev_yr_freeze_assessed_amount - (isnull(@prev_yr_local_exemption_amt, 0) + isnull(@prev_yr_state_exemption_amt, 0))

	if (@prev_yr_freeze_taxable_amount < 0)
	begin
		set @prev_yr_freeze_taxable_amount = 0
	end


	declare @prev_yr_freeze_taxable_amount_decimal numeric(14,2)
	set @prev_yr_freeze_taxable_amount_decimal = (@prev_yr_freeze_taxable_amount / 100)


	declare @freeze_ceiling numeric(14,2)
	declare @freeze_yr numeric(4,0)


	set @freeze_ceiling = convert(numeric(14,2), ((@prev_yr_freeze_taxable_amount_decimal * isnull(@prev_yr_m_n_o_tax_pct, 0.0)) + (@prev_yr_freeze_taxable_amount_decimal * isnull(@prev_yr_i_n_s_tax_pct, 0.0))))

	
	if ((@prev_yr_transfer_dt is not null) and (datepart(yyyy, @prev_yr_transfer_dt) = @qualify_yr) and (@prev_yr_transfer_pct is not null))
	begin
		set @freeze_ceiling = (@freeze_ceiling * (@prev_yr_transfer_pct / 100))
	end
	

	if (@freeze_ceiling < 0.0)
	begin
		set @freeze_ceiling = 0.0
	end

	set @freeze_yr = @qualify_yr


	if
	(
		isnull(@freeze_override, 0) = 0
	and	(
			@status_cd in ('C', 'P', 'TO')
		or	(
				@status_cd is null
			and	@certification_dt is null
			)
		)
	)
	begin
		if (@freeze_prop_id is not null)
		begin
			update
				property_freeze
			set
				use_freeze = 'T',
				freeze_ceiling = @freeze_ceiling,
				freeze_yr = @freeze_yr,
				pacs_freeze = 'T',
				pacs_freeze_date = getdate(),
				pacs_freeze_ceiling = @freeze_ceiling,
				pacs_freeze_run = -1
			from
				property_freeze as pf with (nolock)
			where
				pf.prop_id = @prop_id
			and	pf.owner_id = @owner_id
			and	pf.entity_id = @entity_id
			and	pf.owner_tax_yr = @owner_tax_yr
			and	pf.exmpt_tax_yr = @owner_tax_yr
			and	pf.sup_num = @sup_num
			and	pf.exmpt_type_cd = @exmpt_type_cd
		end
		else
		begin
			insert into
				property_freeze
			(
				prop_id,
				owner_id,
				entity_id,
				owner_tax_yr,
				exmpt_tax_yr,
				sup_num,
				exmpt_type_cd,
				use_freeze,
				freeze_ceiling,
				freeze_yr,
				pacs_freeze,
				pacs_freeze_date,
				pacs_freeze_ceiling,
				pacs_freeze_run,
				freeze_override
			)
			values
			(
				@prop_id,
				@owner_id,
				@entity_id,
				@owner_tax_yr,
				@owner_tax_yr,
				@sup_num,
				@exmpt_type_cd,
				'T',
				@freeze_ceiling,
				@freeze_yr,
				'T',
				getdate(),
				@freeze_ceiling,
				-1,
				0
			)
		end


		update
			prop_owner_entity_val
		set
			freeze_type = replace(@exmpt_type_cd, 'OV65S', 'OV65'),
			freeze_ceiling = @freeze_ceiling,
			freeze_yr = @freeze_yr,
			frz_taxable_val = @freeze_taxable_amount,
			frz_assessed_val = @freeze_assessed_amount,
			transfer_flag = 'F',
			transfer_pct = 0,
			transfer_freeze_assessed = 0,
			transfer_freeze_taxable = 0,
			transfer_entity_taxable = 0,
			transfer_taxable_adjustment = 0
		from
			prop_owner_entity_val as poev with (nolock)
		where
			poev.prop_id = @prop_id
		and	poev.owner_id = @owner_id
		and	poev.entity_id = @entity_id
		and	poev.sup_yr = @owner_tax_yr
		and	poev.sup_num = @sup_num
	end


	fetch next from FREEZE
	into
		@prop_id,
		@owner_id,
		@entity_id,
		@owner_tax_yr,
		@sup_num,
		@status_cd,
		@certification_dt,
		@exmpt_type_cd,
		@qualify_yr,
		@freeze_flag,
		@land_hstd_val,
		@imprv_hstd_val,
		@ten_percent_cap,
		@local_exemption_amt,
		@state_exemption_amt,
		@freeze_prop_id,
		@freeze_override,
		@prev_yr_land_hstd_val,
		@prev_yr_imprv_hstd_val,
		@prev_yr_ten_percent_cap,
		@prev_yr_local_exemption_amt,
		@prev_yr_state_exemption_amt,
		@prev_yr_m_n_o_tax_pct,
		@prev_yr_i_n_s_tax_pct,
		@prev_yr_transfer_dt,
		@prev_yr_transfer_pct
end


close FREEZE
deallocate FREEZE

GO

