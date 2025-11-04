





CREATE procedure SetFirstYearFreeze

@input_year	int,
@input_run	int

as


declare FREEZELIST scroll cursor
for

	select
		pe.prop_id,
		pe.owner_id,
		pe.exmpt_tax_yr,
		pe.owner_tax_yr,
		pe.sup_num,
		ee.entity_id,
		ee.exmpt_type_cd
	from
		dbo.property_exemption as pe with (nolock)
	join
		dbo.prop_supp_assoc as psa with (nolock)
	on
		pe.prop_id = psa.prop_id
	and	pe.owner_tax_yr = psa.owner_tax_yr
	and	pe.exmpt_tax_yr = psa.owner_tax_yr
	and	pe.sup_num = psa.sup_num
	join
		dbo.entity_exmpt as ee with (nolock)
	on
		pe.exmpt_type_cd = ee.exmpt_type_cd
	and	pe.exmpt_tax_yr = ee.exmpt_tax_yr
	and	pe.owner_tax_yr = ee.exmpt_tax_yr
	and	ee.freeze_flag = 1
	join
		dbo.entity_prop_assoc as epa with (nolock)
	on
		pe.prop_id = epa.prop_id
	and	pe.exmpt_tax_yr = epa.tax_yr
	and	pe.owner_tax_yr = epa.tax_yr
	and	pe.sup_num = epa.sup_num
	and	ee.entity_id = epa.entity_id
	join
		dbo.property_exemption as pe_prev with (nolock)
	on
		pe.prop_id = pe_prev.prop_id
	and	pe.owner_id = pe_prev.owner_id
	and	pe.exmpt_type_cd = pe_prev.exmpt_type_cd
	and	pe_prev.exmpt_tax_yr = @input_year - 1
	and	pe_prev.owner_tax_yr = @input_year - 1
	join
		dbo.prop_supp_assoc as psa_prev with (nolock)
	on
		pe_prev.prop_id = psa_prev.prop_id
	and	pe_prev.owner_tax_yr = psa_prev.owner_tax_yr
	and	pe_prev.exmpt_tax_yr = psa_prev.owner_tax_yr
	and	pe_prev.sup_num = psa_prev.sup_num
	left outer join
		dbo.property_freeze as pf with (nolock)
	on
		pe.prop_id = pf.prop_id
	and	pe.owner_id = pf.owner_id
	and	pe.exmpt_tax_yr = pf.exmpt_tax_yr
	and	pe.owner_tax_yr = pf.owner_tax_yr
	and	pe.sup_num = pf.sup_num
	and	ee.entity_id = pf.entity_id
	where
		pe.exmpt_tax_yr = @input_year
	and	pe.owner_tax_yr = @input_year
	and	pe.qualify_yr = @input_year - 1
	and	isnull(pf.use_freeze, 'F') <> 'T'


declare @prop_id int
declare @owner_id int
declare @exmpt_tax_yr numeric(4,0)
declare @owner_tax_yr numeric(4,0)
declare @sup_num int
declare @entity_id int
declare @exmpt_type_cd char(5)


open FREEZELIST
fetch next from FREEZELIST
into
	@prop_id,
	@owner_id,
	@exmpt_tax_yr,
	@owner_tax_yr,
	@sup_num,
	@entity_id,
	@exmpt_type_cd

while (@@fetch_status = 0)
begin
	if exists
	(
	select
		*
	from
		dbo.property_freeze with (nolock)
	where
		prop_id = @prop_id
	and	owner_id = @owner_id
	and	exmpt_tax_yr = @exmpt_tax_yr
	and	owner_tax_yr = @owner_tax_yr
	and	sup_num = @sup_num
	and	entity_id = @entity_id
	)
	begin
		update dbo.property_freeze
		set
			exmpt_type_cd = @exmpt_type_cd,
			use_freeze = 'T',
			freeze_yr = @owner_tax_yr,
			freeze_ceiling = b.bill_adj_m_n_o + b.bill_adj_i_n_s ,
			pacs_freeze = 'T',
			pacs_freeze_date = GetDate(),
			pacs_freeze_ceiling = b.bill_adj_m_n_o + b.bill_adj_i_n_s ,
			pacs_freeze_run = @input_run
		from
			dbo.property_freeze as pf with (nolock)
		join
			dbo.bill as b with (nolock)
		on
			pf.prop_id = b.prop_id
		and	pf.owner_id = b.owner_id
		and	b.sup_tax_yr = @owner_tax_yr - 1
		and	b.sup_tax_yr = @exmpt_tax_yr - 1
		and	pf.entity_id = b.entity_id
		and	isnull(b.new_bill_id, 0) = 0
		and	isnull(b.active_bill, 'T') = 'T'
		and	b.coll_status_cd <> 'RS'
		where
			pf.prop_id = @prop_id
		and	pf.owner_id = @owner_id
		and	pf.exmpt_tax_yr = @exmpt_tax_yr
		and	pf.owner_tax_yr = @owner_tax_yr
		and	pf.sup_num = @sup_num
		and	pf.entity_id = @entity_id
	end
	else
	begin
		insert into dbo.property_freeze
		(
			prop_id,
			owner_id,
			owner_tax_yr,
			exmpt_tax_yr,
			sup_num,
			entity_id,
			exmpt_type_cd,
			use_freeze,
			freeze_yr,
			freeze_ceiling,
			pacs_freeze,
			pacs_freeze_date,
			pacs_freeze_ceiling,
			pacs_freeze_run,
			freeze_override
		)
		select
			@prop_id,
			@owner_id,
			@owner_tax_yr,
			@exmpt_tax_yr,
			@sup_num,
			@entity_id,
			@exmpt_type_cd,
			'T',
			@owner_tax_yr,
			b.bill_adj_m_n_o + b.bill_adj_i_n_s,
			'T',
			GetDate(),
			b.bill_adj_m_n_o + b.bill_adj_i_n_s,
			@input_run,
			0
		from
			dbo.bill as b with (nolock)
		where
			b.prop_id = @prop_id
		and	b.owner_id = @owner_id
		and	b.sup_tax_yr = @owner_tax_yr - 1
		and	b.sup_tax_yr = @exmpt_tax_yr - 1
		and	b.entity_id = @entity_id
		and	isnull(b.new_bill_id, 0) = 0
		and	isnull(b.active_bill, 'T') = 'T'
		and	b.coll_status_cd <> 'RS'
	end

	fetch next from FREEZELIST
	into
		@prop_id,
		@owner_id,
		@exmpt_tax_yr,
		@owner_tax_yr,
		@sup_num,
		@entity_id,
		@exmpt_type_cd
end

close FREEZELIST
deallocate FREEZELIST

GO

