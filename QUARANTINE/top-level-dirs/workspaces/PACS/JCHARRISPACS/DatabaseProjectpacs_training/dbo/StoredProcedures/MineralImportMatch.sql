
create  procedure MineralImportMatch
	@pacs_user_id int,
	@run_id int,
	@re_run bit = 0
AS

set nocount on

-- Drop the local temporary table this procedure uses 
if object_id('tempdb..#emap')  IS NOT null
begin
	drop table #emap
end 


-- Create the temporary entity map table
create table #emap
(
	year int not null,
	appr_company_id int not null,
	appr_company_entity_cd varchar(10) not null,
	entity_id int not null,
	entity_in_cad bit
)


-- Insert a status record
insert
	mineral_import_status
(
	run_id,
	status_code,
	status_user_id,
	status_date
)
select
	@run_id,
	'MATCH',
	@pacs_user_id,
	getdate()


-- Get the year 
declare @year int
select distinct
	@year = prop_val_yr
from
	mineral_import_property as mip with (nolock)
where
	mip.run_id = @run_id


-- Get the CAD entity
declare @cad int
select distinct
	@cad = e.entity_id 
from
	tax_rate as tr with(nolock)
inner join
	entity as e with(nolock)
on
	e.entity_id = tr.entity_id
and	e.entity_type_cd = 'A'
where
	tr.appraise_for = 'T'


-- Create entity mapping table, if the entity id is null then this entry
-- is an import code mapped to the CAD, otherwise this statement simply copies the 
-- map table
insert into
	#emap
(
	year,
	appr_company_id,
	appr_company_entity_cd,
	entity_id,
	entity_in_cad
)
select distinct
	miem.year,
	miem.appr_company_id,
	miem.appr_company_entity_cd,
	case when miem.entity_id is null then @cad else miem.entity_id end,
	0
from
	mineral_import_entity_map as miem with (nolock)
where
	miem.year = @year


-- Expand table with CAD entries, if the entity_in_cad bit is set then insert a record
-- that maps the imported code to the CAD
insert into
	#emap
(
	year,
	appr_company_id,
	appr_company_entity_cd,
	entity_id,
	entity_in_cad
)
select distinct
	miem.year,
	miem.appr_company_id,
	miem.appr_company_entity_cd,
	@cad,
	0
from
	mineral_import_entity_map as miem with (nolock)
where
	miem.year = @year
and	miem.entity_id is not null
and	miem.entity_in_cad = 1



-- set up all the appropriate code files
insert into
	interest_type
(
	interest_type_cd,
	interest_type_desc
)
select distinct
	mip.type_of_int,
	'Conversion'
from
	mineral_import_property as mip with (nolock)
where
	not exists
(
	select
		*
	from
		interest_type as it with (nolock)
	where
		it.interest_type_cd = mip.type_of_int
)
and	mip.type_of_int is not null
and	mip.run_id = @run_id


-- set up all the appropriate code files
insert into
	state_code
(
	state_cd,
	state_cd_desc,
	sys_flag
)
select distinct
	state_cd,
	'Conversion',
	null
from
	mineral_import_property as mip with (nolock)
where
	not exists
(
	select
		*
	from
		state_code as sc with (nolock)
	where
		sc.state_cd = mip.state_cd
)
and	mip.state_cd is not null
and	mip.run_id = @run_id

 
-- Reset matching information to ensure there are no problems after file is transfered to site.
if @re_run = 1
begin
	update
		mineral_import_agent
	set
		acct_id = 0,
		new = null,
		acct_create_dt = null
	where
		run_id = @run_id


	update
		mineral_import_owner
	set
		acct_id = 0,
		new = null,
		acct_create_dt = null
	where
		run_id = @run_id


	update
		mineral_import_property
	set
		agent_id = 0,
		owner_id = 0,
		prop_id = 0,
		new_prop_id = 0,
		new = null,
		prop_create_dt = null
	where
		run_id = @run_id


	update
		mineral_import_entity
	set
		entity_id = 0,
		prop_id = 0,
		owner_id = 0
	where
		run_id = @run_id


	update
		mineral_import_exemption
	set
		prop_id = 0,
		owner_id = 0
	where
		run_id = @run_id


	update
		mineral_import_special_entity_exemption
	set
		entity_id = 0,
		prop_id = 0,
		owner_id = 0
	where
		run_id = @run_id
end


-- Match imported agents to existing agents based on agent_id provided
update
	mineral_import_agent
set
	acct_id = a.acct_id
from
	account as a with (nolock)
inner join
	agent as a1 with (nolock)
on
	a1.agent_id = a.acct_id
where
(
	mineral_import_agent.source = a.source
or	mineral_import_agent.appr_company_id = a.appr_company_id
)
and	mineral_import_agent.agent_code = a.ref_id1
and	mineral_import_agent.acct_id = 0
and	mineral_import_agent.new is null
and	mineral_import_agent.run_id = @run_id


-- Assign new account ids to UNMATCHED mineral agents
declare @next_agent_account_id int
declare @agent_code varchar(20)


declare MINS scroll cursor
for
select
	mia.agent_code
from
	mineral_import_agent as mia with (nolock)
where
	mia.acct_id = 0
and	mia.run_id = @run_id 
order by
	mia.agent_code


open MINS
fetch next from MINS
into
	@agent_code

while (@@fetch_status = 0)
begin
	exec dbo.GetUniqueID 'account', @next_agent_account_id output, 1, 0

	update
		mineral_import_agent
	set
		acct_id = @next_agent_account_id,
		acct_create_dt = getdate(),
		new = 'T'
	where
		agent_code = @agent_code
	and	run_id = @run_id


	fetch next from MINS
	into
		@agent_code
end

close MINS
deallocate MINS


-- Now update agent_id on mineral_import_property
update
	mineral_import_property
set
	agent_id = mia.acct_id
from
	mineral_import_agent as mia with (nolock)
where
	mia.agent_code = mineral_import_property.agent_code
and	mia.run_id = mineral_import_property.run_id
and	mineral_import_property.run_id = @run_id
and	mineral_import_property.agent_id = 0
and	isnull(mineral_import_property.agent_code, '') <> ''


-- Match imported mineral owners to existing owners based on owner_number provided
update
	mineral_import_owner
set
	acct_id = a.acct_id
from
	account as a with (nolock)
where
(
	mineral_import_owner.source = a.source
or	mineral_import_owner.appr_company_id = a.appr_company_id
)
and	mineral_import_owner.owner_no = a.ref_id1
and	mineral_import_owner.acct_id = 0
and	mineral_import_owner.new is null
and	mineral_import_owner.run_id = @run_id


-- Assign new account ids to UNMATCHED mineral owners
declare @next_owner_account_id int
declare @owner_no varchar(20)


declare MINS scroll cursor
for
select
	mio.owner_no
from
	mineral_import_owner as mio with (nolock)
where
	mio.acct_id = 0
and	mio.run_id = @run_id 
order by
	mio.owner_no

open MINS
fetch next from MINS
into
	@owner_no

while (@@fetch_status = 0)
begin
	exec dbo.GetUniqueID 'account', @next_owner_account_id output, 1, 0

	update
		mineral_import_owner
	set
		acct_id = @next_owner_account_id,
		acct_create_dt = getdate(),
		new = 'T'
	where
		owner_no = @owner_no
	and	run_id = @run_id


	fetch next from MINS
	into
		@owner_no
end

close MINS
deallocate MINS


-- Now update owner_id on mineral_import_property
update
	mineral_import_property
set
	owner_id = mio.acct_id
from
	mineral_import_owner as mio with (nolock)
where
	mio.owner_no = mineral_import_property.owner_no 
and	mio.run_id = mineral_import_property.run_id
and	mineral_import_property.run_id = @run_id
and	mineral_import_property.owner_id = 0


-- Now MATCH imported mineral property to existing property based on geo_id
update
	mineral_import_property
set
	prop_id = p.prop_id
from
	property as p with (nolock)
where
	mineral_import_property.geo_id = p.geo_id
and	mineral_import_property.run_id = @run_id
and	mineral_import_property.prop_id = 0
	

-- Now assign new prop ids to UNMATCHED property
declare @next_property_id int
declare @xref varchar(50)

declare MINS scroll cursor
for
select
	mip.xref
from
	mineral_import_property as mip with (nolock)
where
	mip.prop_id = 0
and	mip.run_id = @run_id 
order by
	mip.xref


open MINS
fetch next from MINS
into
	@xref

while (@@fetch_status = 0)
begin
	exec dbo.GetUniqueID 'property', @next_property_id output, 1, 0

	update
		mineral_import_property
	set
		prop_id = @next_property_id,
		new_prop_id = @next_property_id,
		prop_create_dt = getdate(),
		new = 'T'
	where
		xref = @xref
	and	run_id = @run_id


	fetch next from MINS
	into
		@xref
end

close MINS
deallocate MINS


-- Now assign personal property segment ids to all personal property segments
declare @next_pers_prop_seg_id int

declare MINS scroll cursor
for
select
	mip.xref
from
	mineral_import_property as mip with (nolock)
where
	mip.prop_type_cd = 'P'
and	mip.pp_seg_id = 0
and	mip.run_id = @run_id
order by
	mip.xref


declare @prop_id int

open MINS
fetch next from MINS
into
	@xref

while (@@fetch_status = 0)
begin
	exec dbo.GetUniqueID 'pers_prop_seg', @next_pers_prop_seg_id output, 1, 0
	
	update
		mineral_import_property
	set
		pp_seg_id = @next_pers_prop_seg_id
	where
		xref = @xref
	and	prop_type_cd = 'P'
	and	pp_seg_id = 0
	and	run_id = @run_id


	fetch next from MINS
	into
		@xref
end

close MINS
deallocate MINS


-- Expand the entity table based on mapping
-- In case this is not the first merge run, delete new entity records
delete
	mineral_import_entity 
where
	run_id = @run_id
and	entity_def = 0
and	prop_id = 0


-- Insert the entity, sum the percentage from properties that have multiple ocurrances of a 
-- given entity. Only insert one entity per property,year
insert into mineral_import_entity
(
	run_id,
	entity_id,
	prop_id,
	owner_id,
	tax_yr,
	pp_seg_id,
	entity_prop_pct,
	entity_code,
	xref,
	entity_def
)
select  
	mie.run_id,
	mie2.entity_id,
	mie.prop_id,
	mie.owner_id,
	mie.tax_yr,
	mie.pp_seg_id,
	case when mie2.entity_prop_pct > 100.0 then 100.0 else mie2.entity_prop_pct end,
	mie.entity_code,
	mie.xref,
	0
from
	mineral_import_entity as mie with (nolock)
inner join 
(
	-- Get the maximum entity code so that derived table join conditions
	-- only produces one record for multiple entity_codes mapped
	-- to same entity 
	select
		mie2.run_id,
		mie2.tax_yr,
		max(mie2.entity_code) as entity_code,
		#emap.entity_id,
		mie2.xref,
		-- Get the entity prop percent sum
		(
			select
				sum(isnull(ms.entity_prop_pct,0)) 
			from
				mineral_import_entity as ms with (nolock)
			inner join
				#emap  as e
			on
				e.year = ms.tax_yr 
			and	e.appr_company_entity_cd = ms.entity_code
			where
				ms.prop_id = 0
			and	ms.xref = mie2.xref 
			and	ms.run_id = mie2.run_id
			and	e.entity_id = #emap.entity_id
		) as entity_prop_pct 
	from
		mineral_import_entity as mie2 with (nolock)
	inner join
		#emap
	on
		#emap.year = mie2.tax_yr 
	and	#emap.appr_company_entity_cd = mie2.entity_code
	where
		mie2.prop_id = 0
	group by
		mie2.run_id,
		mie2.tax_yr,
		#emap.entity_id,
		mie2.xref
) as mie2
on
	mie2.run_id = mie.run_id
and	mie2.tax_yr = mie.tax_yr
and	mie2.entity_code = mie.entity_code
and	mie2.xref = mie.xref
where
	mie.run_id = @run_id
and	mie.prop_id = 0


-- Link mineral_entity_cv to mineral_property_cv based on xref
update
	mineral_import_entity
set
	prop_id = mip.prop_id,
	owner_id = mip.owner_id
from
	mineral_import_entity as mie with (nolock)
inner join
	mineral_import_property as mip with (nolock)
on
	mie.xref = mip.xref
and	mie.run_id = mip.run_id
where
	mie.run_id = @run_id


-- Link mineral_exemption_cv to mineral_property_cv based on xref
update
	mineral_import_exemption
set
	prop_id = mip.prop_id,
	owner_id = mip.owner_id
from
	mineral_import_exemption as mie with (nolock)
inner join
	mineral_import_property as mip with (nolock)
on
	mie.xref = mip.xref
and	mie.run_id = mip.run_id
where
	mie.run_id = @run_id


-- In case this is not the first merge run, delete new entity exemption records
delete
	mineral_import_special_entity_exemption
where
	run_id = @run_id
and	entity_def = 0
and	prop_id = 0


-- Insert a record for each entity in map
insert into
	mineral_import_special_entity_exemption
(
	run_id,
	prop_id,
	owner_id,
	sup_num,
	exmpt_tax_yr,
	owner_tax_yr,
	exmpt_type_cd,
	entity_id,
	entity_code,
	sp_amt,
	sp_pct,
	xref,
	entity_def
)
select
	mie.run_id,
	mie.prop_id,
	mie.owner_id,
	mie.sup_num,
	mie.exmpt_tax_yr,
	mie.owner_tax_yr,
	mie.exmpt_type_cd,
	mie2.entity_id,
	mie.entity_code,
	mie2.sp_amt,
	case when mie2.sp_pct > 100.0 then 100.0 else mie2.sp_pct end,
	mie.xref,
	0
from
	mineral_import_special_entity_exemption as mie with (nolock)
inner join 
(
	select
		mie2.run_id,
		mie2.exmpt_tax_yr ,
		max(mie2.entity_code) as entity_code,
		#emap.entity_id,
		mie2.xref,
		mie2.exmpt_type_cd,
		(
			select
				sum(isnull(ms.sp_amt,0)) 
			from
				mineral_import_special_entity_exemption as ms with (nolock)
			inner join
				#emap  as e
			on
				e.year = ms.exmpt_tax_yr
			and	e.appr_company_entity_cd = ms.entity_code
			where
				ms.prop_id = 0
			and	ms.xref = mie2.xref 
			and	ms.run_id = mie2.run_id
			and	e.entity_id = #emap.entity_id
			and	ms.exmpt_type_cd = mie2.exmpt_type_cd
		) as sp_amt,
		(
			select
				sum(isnull(ms.sp_pct,0)) 
			from
				mineral_import_special_entity_exemption as ms with(nolock)
			inner join
				#emap  as e
			on
				e.year = ms.exmpt_tax_yr
			and	e.appr_company_entity_cd = ms.entity_code
			where
				ms.prop_id = 0
			and	ms.xref = mie2.xref 
			and	ms.run_id = mie2.run_id
			and	e.entity_id = #emap.entity_id
			and	ms.exmpt_type_cd = mie2.exmpt_type_cd
		) as sp_pct
	from
		mineral_import_special_entity_exemption as mie2 with(nolock)
	inner join
		#emap
	on
		#emap.year = mie2.exmpt_tax_yr 
	and	#emap.appr_company_entity_cd = mie2.entity_code
	where
		mie2.prop_id = 0
	group by
		mie2.run_id,
		mie2.exmpt_tax_yr,
		mie2.xref,
		mie2.exmpt_type_cd,
		#emap.entity_id
) as mie2
on
	mie2.run_id = mie.run_id
and	mie2.exmpt_tax_yr = mie.exmpt_tax_yr
and	mie2.entity_code = mie.entity_code
and	mie2.xref = mie.xref
and	mie2.exmpt_type_cd = mie.exmpt_type_cd
where
	mie.run_id = @run_id
and	mie.prop_id = 0




-- Link mineral_sp_ent_ex_cv to mineral_property_cv based on xref
update
	mineral_import_special_entity_exemption
set
	prop_id = mip.prop_id,
	owner_id = mip.owner_id
from
	mineral_import_special_entity_exemption as misee with (nolock)
inner join
	mineral_import_property as mip with (nolock)
on
	misee.xref = mip.xref
and	misee.run_id = mip.run_id
where
	misee.prop_id = 0
and	misee.run_id = @run_id

GO

