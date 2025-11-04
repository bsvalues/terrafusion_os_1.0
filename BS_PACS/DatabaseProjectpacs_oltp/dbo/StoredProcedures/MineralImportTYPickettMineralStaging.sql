



create procedure MineralImportTYPickettMineralStaging
	@run_id int,
	@year numeric(4),
	@appr_company_id int,
	@input_file varchar(255)
as


delete
	mineral_import_typickett
where
	run_id is null


declare @szFormatFile varchar(255)
select
	@szFormatFile = mineral_import_format_file_path + '\mineral_import_format_typickett.txt'
from
	pacs_system with (nolock)


declare @szSQL varchar(2048)
set @szSQL = 'bulk insert mineral_import_typickett '
set @szSQL = @szSQL + 'from ''' + @input_file + ''' '
set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''')'

exec (@szSQL)


update
	mineral_import_typickett
set
	run_id = @run_id
where
	run_id is null


insert into
	mineral_import_typickett_L1
(
	run_id,
	rec_id,
	lease,
	sch,
	wtr,
	rod,
	cty,
	nuprop,
	m1,
	m2,
	m3,
	m4,
	operator,
	lease_name,
	field_name,
	abst,
	block,
	section,
	acres,
	excl_val,
	min_val
)
select
	mit.run_id,
	left(mit.data, 2),
	substring(mit.data, 3, 5),
	substring(mit.data, 8, 2),
	substring(mit.data, 10, 2),
	substring(mit.data, 12, 2),
	substring(mit.data, 14, 2),
	substring(mit.data, 16, 1),
	substring(mit.data, 17, 2),
	substring(mit.data, 19, 2),
	substring(mit.data, 21, 2),
	substring(mit.data, 23, 2),
	substring(mit.data, 25, 22),
	substring(mit.data, 47, 22),
	substring(mit.data, 69, 26),
	substring(mit.data, 95, 10),
	substring(mit.data, 105, 8),
	substring(mit.data, 113, 7),
	substring(mit.data, 120, 6),
	convert(int, substring(mit.data, 126, 3)),
	convert(int, substring(mit.data, 129, 3))
from
	mineral_import_typickett as mit with (nolock)
where
	left(mit.data, 2) = 'L1'
and	mit.run_id = @run_id


insert into
	mineral_import_typickett_L2
(
	run_id,
	id,
	nbr,
	des1b,
	des2b,
	val_78,
	val_18,
	apd,
	cnty1,
	prcnt1,
	cnty2,
	prcnt2
)
select
	mit.run_id,
	left(mit.data, 2),
	substring(mit.data, 3, 5),
	substring(mit.data, 8, 29),
	substring(mit.data, 37, 29),
	convert(numeric(11), substring(mit.data, 66, 11)),
	convert(numeric(11), substring(mit.data, 77, 11)),
	substring(mit.data, 88, 3),
	substring(mit.data, 91, 3),
	convert(numeric(5), substring(mit.data, 94, 5)) / 100000,
	substring(mit.data, 99, 3),
	convert(numeric(5), substring(mit.data, 102, 5)) / 100000
from
	mineral_import_typickett as mit with (nolock)
where
	left(mit.data, 2) = 'L2'
and	mit.run_id = @run_id


insert into
	mineral_import_typickett_S1
(
	run_id,
	id,
	lease,
	type,
	code1,
	prcnt1,
	code2,
	prcnt2,
	code3,
	prcnt3,
	code4,
	prcnt4,
	code5,
	prcnt5,
	code6,
	prcnt6
)
select
	mit.run_id,
	left(mit.data, 2),
	substring(mit.data, 3, 5),
	substring(mit.data, 8, 2),
	substring(mit.data, 10,2 ),
	convert(numeric(5), substring(mit.data, 12, 5)) / 100000,
	substring(mit.data, 17, 2),
	convert(numeric(5), substring(mit.data, 19, 5)) / 100000,
	substring(mit.data, 24, 2),
	convert(numeric(5), substring(mit.data, 26, 5)) / 100000,
	substring(mit.data, 31, 2),
	convert(numeric(5), substring(mit.data, 33, 5)) / 100000,
	substring(mit.data, 38, 2),
	convert(numeric(5), substring(mit.data, 40, 5)) / 100000,
	substring(mit.data, 45, 2),
	convert(numeric(5), substring(mit.data, 47, 5)) / 100000
from
	mineral_import_typickett as mit with (nolock)
where
	left(mit.data, 2) = 'S1'
and	mit.run_id = @run_id


insert into
	mineral_import_typickett_O1
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
	interest,
	value,
	raw_value,
	chg_date,
	agent_authority
)
select
	mit.run_id,
	left(mit.data, 2),
	substring(mit.data, 3, 5),
	substring(mit.data, 8, 7),
	substring(mit.data, 15, 2),
	substring(mit.data, 17, 30),
	substring(mit.data, 47, 30),
	substring(mit.data, 77, 30),
	substring(mit.data, 107, 15),
	substring(mit.data, 122, 2),
	substring(mit.data, 124, 5),
	substring(mit.data, 129, 4),
	substring(mit.data, 133, 2),
	substring(mit.data, 135, 1),
	substring(mit.data, 136, 1),
	substring(mit.data, 137, 1),
	substring(mit.data, 138, 1),
	substring(mit.data, 139, 1),
	substring(mit.data, 140, 1),
	convert(numeric(6), substring(mit.data, 141, 6)) / 1000000,
	convert(numeric(11), substring(mit.data, 147, 11)),
	convert(numeric(11), substring(mit.data, 158, 11)),
	case
		when substring(mit.data, 169, 8) = '00000000' then null
		else convert(datetime, substring(mit.data, 169, 8), 112)
	end,
	substring(mit.data, 237, 1)
from
	mineral_import_typickett as mit with (nolock)
where
	left(mit.data, 2) = 'O1'
and	mit.run_id = @run_id


insert into
	mineral_import_typickett_R1
(
	run_id,
	id,
	lease,
	rrc,
	well_type,
	new_value,
	field_number,
	operator_number,
	agent_code
)
select
	mit.run_id,
	left(mit.data, 2),
	substring(mit.data, 3, 5),
	substring(mit.data, 8, 6),
	substring(mit.data, 14, 1),
	convert(int, substring(mit.data, 15, 9)),
	substring(mit.data, 24, 8),
	substring(mit.data, 32, 6),
	substring(mit.data, 38, 2)
from
	mineral_import_typickett as mit with (nolock)
where
	left(mit.data, 2) = 'R1'
and	mit.run_id = @run_id


declare MINERAL_GEO_ID_FORMAT scroll cursor
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
and	mif.prop_type_cd = 'MN'
and	mif.format_type_cd = 'GEOID'
and	mif.sequence >= 0
order by
	mif.sequence,
	mif.field_name

declare @prev_delimiter varchar(3)

declare @field_name varchar(100)
declare @prefix varchar(20)
declare @suffix varchar(20)
declare @delimiter varchar(3)

set @prev_delimiter = ''

declare @szMineralGeoIDFormatSQL varchar(4096)
set @szMineralGeoIDFormatSQL = ''

open MINERAL_GEO_ID_FORMAT
fetch next from MINERAL_GEO_ID_FORMAT
into
	@field_name,
	@prefix,
	@suffix,
	@delimiter

while (@@fetch_status = 0)
begin
	if (len(@szMineralGeoIDFormatSQL) > 0)
	begin
		set @szMineralGeoIDFormatSQL = @szMineralGeoIDFormatSQL + ' + '
	end
	
	set @szMineralGeoIDFormatSQL = @szMineralGeoIDFormatSQL + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @prev_delimiter + '''' + ' else '''' end '
	set @szMineralGeoIDFormatSQL = @szMineralGeoIDFormatSQL + ' + ' + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @prefix + '''' + ' else '''' end '
	set @szMineralGeoIDFormatSQL = @szMineralGeoIDFormatSQL + ' + ' + 'ltrim(rtrim(' + @field_name + ')) '
	set @szMineralGeoIDFormatSQL = @szMineralGeoIDFormatSQL + ' + ' + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @suffix + '''' + ' else '''' end'

	set @prev_delimiter = @delimiter

	fetch next from MINERAL_GEO_ID_FORMAT
	into
		@field_name,
		@prefix,
		@suffix,
		@delimiter
end

close MINERAL_GEO_ID_FORMAT
deallocate MINERAL_GEO_ID_FORMAT


if (len(@szMineralGeoIDFormatSQL) > 0)
begin
	declare @szMineralGeoIDSQL varchar (8000)
	set @szMineralGeoIDSQL = ''
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'update mineral_import_typickett_O1 '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'set geo_id = '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + @szMineralGeoIDFormatSQL + ' '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'where run_id = ' + convert(varchar(12), @run_id)

	exec (@szMineralGeoIDSQL)
end


declare MINERAL_LEGAL_FORMAT scroll cursor
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
and	mif.prop_type_cd = 'MN'
and	mif.format_type_cd = 'LEGAL'
and	mif.sequence >= 0
order by
	mif.sequence,
	mif.field_name

set @prev_delimiter = ''

declare @szMineralLegalFormatSQL varchar(4096)
set @szMineralLegalFormatSQL = ''

open MINERAL_LEGAL_FORMAT
fetch next from MINERAL_LEGAL_FORMAT
into
	@field_name,
	@prefix,
	@suffix,
	@delimiter

while (@@fetch_status = 0)
begin
	if (len(@szMineralLegalFormatSQL) > 0)
	begin
		set @szMineralLegalFormatSQL = @szMineralLegalFormatSQL + ' + '
	end

	set @szMineralLegalFormatSQL = @szMineralLegalFormatSQL + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @prev_delimiter + '''' + ' else '''' end '
	set @szMineralLegalFormatSQL = @szMineralLegalFormatSQL + ' + ' + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @prefix + '''' + ' else '''' end '
	set @szMineralLegalFormatSQL = @szMineralLegalFormatSQL + ' + ' + 'ltrim(rtrim(' + @field_name + ')) '
	set @szMineralLegalFormatSQL = @szMineralLegalFormatSQL + ' + ' + 'case when len(ltrim(rtrim(' + @field_name + '))) > 0 then ' + '''' + @suffix + '''' + ' else '''' end'

	set @prev_delimiter = @delimiter

	fetch next from MINERAL_LEGAL_FORMAT
	into
		@field_name,
		@prefix,
		@suffix,
		@delimiter
end

close MINERAL_LEGAL_FORMAT
deallocate MINERAL_LEGAL_FORMAT


if (len(@szMineralLegalFormatSQL) > 0)
begin
	declare @szMineralLegalSQL varchar (8000)
	set @szMineralLegalSQL = ''
	set @szMineralLegalSQL = @szMineralLegalSQL + 'update mineral_import_typickett_O1 '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'set legal_desc = '
	set @szMineralLegalSQL = @szMineralLegalSQL + @szMineralLegalFormatSQL + ' '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'from mineral_import_typickett_O1 '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'left outer join mineral_import_typickett_L1 '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'on mineral_import_typickett_O1.lease_nbr '
	set @szMineralLegalSQL = @szMineralLegalSQL + ' = mineral_import_typickett_L1.lease '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'and mineral_import_typIckett_O1.run_id '
	set @szMineralLegalSQL = @szMineralLegalSQL + ' = mineral_import_typickett_L1.run_id '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'where mineral_import_typickett_O1.run_id = ' + convert(varchar(12), @run_id)

	exec (@szMineralLegalSQL)
end

GO

