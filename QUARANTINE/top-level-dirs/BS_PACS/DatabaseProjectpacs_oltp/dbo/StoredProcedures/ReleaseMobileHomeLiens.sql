
create procedure dbo.ReleaseMobileHomeLiens
	@input_pacs_user_id int,
	@input_prop_id int = null,
	@input_years varchar(512) = null
as


declare @release_date varchar(30)
set @release_date = convert(varchar(30), GetDate(), 120)


declare @mass_release bit

if (@input_prop_id is null)
begin
	set @mass_release = 1
end
else
begin
	set @mass_release = 0
end


declare @run_id int

if (@mass_release = 1)
begin
	insert into
		dbo.mh_lien_release_run
	(
		release_date,
		pacs_user_id,
		year_option
	)
	values
	(
		cast(@release_date as datetime),
		@input_pacs_user_id,
		'A'
	)

	select
		@run_id = scope_identity()
	from
		dbo.mh_lien_release_run with (nolock)
end


declare @szSQL varchar(8000)

set @szSQL = 'update dbo.mh_lien '
set @szSQL = @szSQL + 'set lien_release_date = ' + '''' + @release_date + '''' + ', '
set @szSQL = @szSQL + 'lien_release_pacs_user_id = ' + cast(@input_pacs_user_id as varchar(20)) + ', '
set @szSQL = @szSQL + 'tax_amount = rmhlv.tax_amount, '
set @szSQL = @szSQL + 'lien_release_run_id = '

if (@run_id is null)
begin
	set @szSQL = @szSQL + 'null '
end
else
begin
	set @szSQL = @szSQL + cast(@run_id as varchar(20)) + ' '
end

set @szSQL = @szSQL + 'from dbo.mh_lien as mhl with (nolock) '
set @szSQL = @szSQL + 'inner join dbo.release_mh_lien_vw rmhlv with (nolock) '
set @szSQL = @szSQL + 'on rmhlv.lien_id = mhl.lien_id '

if (@mass_release = 1)
begin
	set @szSQL = @szSQL + 'and rmhlv.tax_amount <= 0.0 '
end 

set @szSQL = @szSQL + 'where 1 = 1 '



if (@mass_release = 0)
begin
	set @szSQL = @szSQL + 'and mhl.prop_id = ' + cast(@input_prop_id as varchar(20)) + ' '

	if (len(ltrim(rtrim(isnull(@input_years, '')))) > 0)
	begin
		set @szSQL = @szSQL + 'and mhl.tax_yr in (' + @input_years + ') '
	end
end
else
begin
	declare @system_tax_year varchar(4)
	
	select top 1
		@system_tax_year = cast(tax_yr as varchar(4))
	from
		dbo.pacs_system with (nolock)
	where
		system_type in ('B', 'C')
	order by
		system_type desc
	
	
	if (@system_tax_year is not null)
	begin
		set @szSQL = @szSQL + ' and mhl.tax_yr <= ' + @system_tax_year + ' '
	end
end


exec (@szSQL)



if (@mass_release = 1)
begin
	declare @collector_office_name	varchar(50)
	declare @collector_addr_line1	varchar(50)
	declare @collector_addr_line2	varchar(50)
	declare @collector_addr_line3	varchar(50)
	declare @collector_city		varchar(50)
	declare @collector_state	char(2)
	declare	@collector_zip		varchar(50)
	declare @collector_phone_num	varchar(25)

	select
		@collector_office_name = office_name,
		@collector_addr_line1 = addr_line1,
		@collector_addr_line2 = addr_line2,
		@collector_addr_line3 = addr_line3,
		@collector_city = city,
		@collector_state = state,
		@collector_zip = zip,
		@collector_phone_num = phone_num
	from
		system_address with (nolock)
	where
		system_type = 'C'


	declare @county_code varchar(3)
	
	select top 1
		@county_code = cad_id_code
	from
		system_address with (nolock)
	where
		cad_id_code is not null
	group by
		cad_id_code
	order by
		count(*)

	if @county_code is null
	begin
		select top 1
			@county_code = left(taxing_unit_num, 3)
		from
			entity as e with (nolock)
		where
			taxing_unit_num is not null
		and	isnumeric(left(taxing_unit_num, 3)) = 1
		group by
			left(taxing_unit_num, 3)
		order by
			count(*) desc
	end


	insert into
		dbo.mh_lien_release_run_detail
	(
		run_id,
		mbl_hm_hud_num,
		mbl_hm_sn,
		mbl_hm_model,
		owner_id,
		owner_name1,
		owner_name2,
		owner_address,
		owner_city,
		owner_state,
		owner_zip,
		situs_line1,
		situs_line2,
		situs_city,
		situs_state,
		situs_zip,
		entity_id,
		entity_cd,
		entity_name,
		taxing_unit_num,
		collector_name1,
		collector_name2,
		collector_addr1,
		collector_addr2,
		collector_city,
		collector_state,
		collector_zip,
		collector_phone_num,
		prop_id,
		lien_id,
		lien_date,
		lien_pacs_user_id,
		lien_export_run_id,
		lien_release_date,
		lien_release_pacs_user_id,
		tax_yr,
		tax_amount,
		county_code
	)
	select
		lien_release_run_id,
		mbl_hm_hud_num,
		mbl_hm_sn,
		mbl_hm_model,
		owner_id,
		left(isnull(owner_name, ''), 40),
		'',
		isnull(owner_address, ''),
		isnull(owner_city, ''),
		isnull(owner_state, ''),
		isnull(owner_zip, ''),
		left(isnull(situs_address, ''), 30),
		substring(isnull(situs_address, ''), 31, 30),
		left(isnull(situs_city, ''), 20),
		isnull(situs_state, ''),
		isnull(situs_zip, ''),
		entity_id,
		ltrim(rtrim(isnull(entity_cd, ''))),
		isnull(entity_name, ''),
		left(isnull(taxing_unit_num, ''), 10),
		left(isnull(@collector_office_name, ''), 40),
		left(isnull(@collector_addr_line1, ''), 40),
		left(isnull(@collector_addr_line2, ''), 30),
		left(isnull(@collector_addr_line3, ''), 30),
		left(isnull(@collector_city, ''), 20),
		isnull(@collector_state, ''),
		left(isnull(@collector_zip, ''), 10),
		isnull(@collector_phone_num, ''),
		prop_id,
		lien_id,
		lien_date,
		lien_pacs_user_id,
		lien_export_run_id,
		lien_release_date,
		lien_release_pacs_user_id,
		tax_yr,
		tax_amount,
		left(isnull(@county_code, ''), 3)
	from
		dbo.mh_lien_vw with (nolock)
	where
		lien_release_run_id = @run_id
end


if not exists (select * from dbo.event_type where event_type_cd = 'MHLIENRELEASE')
begin
	insert into dbo.event_type
	(
		event_type_cd,
		event_type_desc,
		sys_flag,
		event_type_flag
	)
	values
	(
		'MHLIENRELEASE',
		'Mobile Home Lien Release',
		'T',
		'U'
	)
end
	

--Insert 'MHLIENRELEASE' event on each property processed
declare @next_event_id	int
exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
	
insert into dbo.event
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
	'MHLIENRELEASE',
	cast(@release_date as datetime),
	'System',
	'Mobile Home Lien(s) Released'
)

if (@mass_release = 1)
begin	
	insert into
		dbo.prop_event_assoc
	(
		prop_id,
		event_id
	)
	select distinct
		prop_id,
		@next_event_id
	from
		dbo.mh_lien with (nolock)
	where
		lien_release_run_id = @run_id
end
else
begin
	insert into
		dbo.prop_event_assoc
	(
		prop_id,
		event_id
	)
	select distinct
		prop_id,
		@next_event_id
	from
		dbo.mh_lien with (nolock)
	where
		prop_id = @input_prop_id
	and	lien_release_run_id is null
	and	lien_release_date = cast(@release_date as datetime)
end

GO

