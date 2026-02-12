



create procedure MineralImportTYPickettUtilityStaging
	@run_id int,
	@year numeric(4),
	@appr_company_id int,
	@input_file varchar(255)
as


delete
	mineral_import_utility_typickett
where
	run_id is null


declare @szFormatFile varchar(255)
select
	@szFormatFile = mineral_import_format_file_path + '\mineral_import_utility_format_typickett.txt'
from
	pacs_system with (nolock)


declare @szSQL varchar(2048)
set @szSQL = 'bulk insert mineral_import_utility_typickett '
set @szSQL = @szSQL + 'from ''' + @input_file + ''' '
set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''')'

exec (@szSQL)


update
	mineral_import_utility_typickett
set
	run_id = @run_id
where
	run_id is null


insert into
	mineral_import_utility_typickett_N
(
	run_id,
	id,
	owner_nbr,
	item_nbr,
	seq_nbr,
	sch,
	wtr,
	cty,
	m1,
	m2,
	m3,
	m4,
	m5,
	abst,
	blck,
	sect,
	acrsb,
	des1,
	des2,
	des3,
	real,
	pers,
	cnty,
	spcl_code,
	nuprop,
	gov_code
)
select
	run_id,
	left(miutyp.data, 1),
	substring(miutyp.data, 2, 7),
	substring(miutyp.data, 9, 3),
	substring(miutyp.data, 12, 4),
	substring(miutyp.data, 16, 1),
	substring(miutyp.data, 17, 1),
	substring(miutyp.data, 18, 1),
	substring(miutyp.data, 19, 1),
	substring(miutyp.data, 20, 1),
	substring(miutyp.data, 21, 1),
	substring(miutyp.data, 22, 1),
	substring(miutyp.data, 23, 1),
	substring(miutyp.data, 24, 10),
	substring(miutyp.data, 34, 8),
	substring(miutyp.data, 42, 7),
	convert(numeric(7), substring(miutyp.data, 49, 7)) / 100,
	substring(miutyp.data, 56, 35),
	substring(miutyp.data, 91, 35),
	substring(miutyp.data, 126, 35),
	convert(numeric(11), substring(miutyp.data, 161, 11)),
	convert(numeric(11), substring(miutyp.data, 172, 11)),
	substring(miutyp.data, 183, 3),
	substring(miutyp.data, 186, 2),
	substring(miutyp.data, 188, 1),
	substring(miutyp.data, 189, 2)
from
	mineral_import_utility_typickett as miutyp with (nolock)
where
	left(miutyp.data, 1) = 'N'
and	miutyp.run_id = @run_id


insert into
	mineral_import_utility_typickett_O1
(
	run_id,
	id,
	lease_nbr,
	owner_nbr,
	interest_type,
	owner_rest,
	address1,
	address2,
	city,
	st,
	zip,
	zip_4,
	agent,
	schx,
	cnt,
	sch,
	cty,
	jrc,
	rend,
	change_date,
	freeport_road,
	rendered_date,
	freeport_water,
	agent_authority
)
select
	miutyp.run_id,
	left(miutyp.data, 2),
	substring(miutyp.data, 3, 5),
	substring(miutyp.data, 8, 7),
	substring(miutyp.data, 15, 2),
	substring(miutyp.data, 17, 30),
	substring(miutyp.data, 47, 30),
	substring(miutyp.data, 77, 30),
	substring(miutyp.data, 107, 15),
	substring(miutyp.data, 122, 2),
	substring(miutyp.data, 124, 5),
	substring(miutyp.data, 129, 4),
	substring(miutyp.data, 133, 2),
	substring(miutyp.data, 135, 1),
	substring(miutyp.data, 136, 1),
	substring(miutyp.data, 137, 1),
	substring(miutyp.data, 138, 1),
	substring(miutyp.data, 139, 1),
	substring(miutyp.data, 140, 1),
	case
		when substring(miutyp.data, 141, 8) = '00000000' then null
		else convert(datetime, substring(miutyp.data, 141, 8), 112)
	end,
	substring(miutyp.data, 149, 1),
	case
		when substring(miutyp.data, 150, 8) = '00000000' then null
		else convert(datetime, substring(miutyp.data, 150, 8), 112)
	end,
	substring(miutyp.data, 158, 1),
	substring(miutyp.data, 162, 1)
from
	mineral_import_utility_typickett as miutyp with (nolock)
where
	left(miutyp.data, 2) = 'O1'
and	miutyp.run_id = @run_id


declare @prev_delimiter varchar(3)

declare @field_name varchar(100)
declare @prefix varchar(20)
declare @suffix varchar(20)
declare @delimiter varchar(3)


declare PERSONAL_GEO_ID_FORMAT scroll cursor
for
select
	mif.field_name,
	isnull(mif.prefix, ''),
	isnull(mif.suffix, ''),
	isnull(mif.delimiter, '')
from
	mineral_import_format as mif with (nolock)
where
	mif.year = @year
and	mif.appr_company_id = @appr_company_id
and	mif.prop_type_cd = 'P'
and	mif.format_type_cd = 'GEOID'
and	mif.sequence >= 0
order by
	mif.sequence,
	mif.field_name

set @prev_delimiter = ''

declare @szPersonalGeoIDFormatSQL varchar(4096)
set @szPersonalGeoIDFormatSQL = ''

open PERSONAL_GEO_ID_FORMAT
fetch next from PERSONAL_GEO_ID_FORMAT
into
	@field_name,
	@prefix,
	@suffix,
	@delimiter

while (@@fetch_status = 0)
begin
	if (len(@szPersonalGeoIDFormatSQL) > 0)
	begin
		set @szPersonalGeoIDFormatSQL = @szPersonalGeoIDFormatSQL + ' + '
	end
	
	set @szPersonalGeoIDFormatSQL = @szPersonalGeoIDFormatSQL + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @prev_delimiter + '''' + ' else '''' end '
	set @szPersonalGeoIDFormatSQL = @szPersonalGeoIDFormatSQL + ' + ' + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @prefix + '''' + ' else '''' end '
	set @szPersonalGeoIDFormatSQL = @szPersonalGeoIDFormatSQL + ' + ' + 'ltrim(rtrim(' + @field_name + ')) '
	set @szPersonalGeoIDFormatSQL = @szPersonalGeoIDFormatSQL + ' + ' + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @suffix + '''' + ' else '''' end'

	set @prev_delimiter = @delimiter

	fetch next from PERSONAL_GEO_ID_FORMAT
	into
		@field_name,
		@prefix,
		@suffix,
		@delimiter
end

close PERSONAL_GEO_ID_FORMAT
deallocate PERSONAL_GEO_ID_FORMAT


if (len(@szPersonalGeoIDFormatSQL) > 0)
begin
	declare @szPersonalGeoIDSQL varchar (8000)
	set @szPersonalGeoIDSQL = ''
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'update mineral_import_utility_typickett_N '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'set geo_id = '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + @szPersonalGeoIDFormatSQL + ' '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'where run_id = ' + convert(varchar(12), @run_id)

	exec (@szPersonalGeoIDSQL)
end


declare PERSONAL_LEGAL_FORMAT scroll cursor
for
select
	mif.field_name,
	isnull(mif.prefix, ''),
	isnull(mif.suffix, ''),
	isnull(mif.delimiter, '')
from
	mineral_import_format as mif with (nolock)
where
	mif.year = @year
and	mif.appr_company_id = @appr_company_id
and	mif.prop_type_cd = 'P'
and	mif.format_type_cd = 'LEGAL'
and	mif.sequence >= 0
order by
	mif.sequence,
	mif.field_name

set @prev_delimiter = ''

declare @szPersonalLegalFormatSQL varchar(4096)
set @szPersonalLegalFormatSQL = ''

open PERSONAL_LEGAL_FORMAT
fetch next from PERSONAL_LEGAL_FORMAT
into
	@field_name,
	@prefix,
	@suffix,
	@delimiter

while (@@fetch_status = 0)
begin
	if (len(@szPersonalLegalFormatSQL) > 0)
	begin
		set @szPersonalLegalFormatSQL = @szPersonalLegalFormatSQL + ' + '
	end

	set @szPersonalLegalFormatSQL = @szPersonalLegalFormatSQL + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @prev_delimiter + '''' + ' else '''' end '
	set @szPersonalLegalFormatSQL = @szPersonalLegalFormatSQL + ' + ' + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @prefix + '''' + ' else '''' end '
	set @szPersonalLegalFormatSQL = @szPersonalLegalFormatSQL + ' + ' + 'ltrim(rtrim(' + @field_name + ')) '
	set @szPersonalLegalFormatSQL = @szPersonalLegalFormatSQL + ' + ' + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @suffix + '''' + ' else '''' end'

	set @prev_delimiter = @delimiter

	fetch next from PERSONAL_LEGAL_FORMAT
	into
		@field_name,
		@prefix,
		@suffix,
		@delimiter
end

close PERSONAL_LEGAL_FORMAT
deallocate PERSONAL_LEGAL_FORMAT


if (len(@szPersonalLegalFormatSQL) > 0)
begin
	declare @szPersonalLegalSQL varchar (8000)
	set @szPersonalLegalSQL = ''
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'update mineral_import_utility_typickett_N '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'set legal_desc = '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + @szPersonalLegalFormatSQL + ' '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'where run_id = ' + convert(varchar(12), @run_id)

	exec (@szPersonalLegalSQL)
end

GO

