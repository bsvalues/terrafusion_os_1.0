



create procedure dbo.MineralImportCapitolStaging
	@run_id int,
	@year numeric(4),
	@appr_company_id int,
	@input_file varchar(255)
as


delete
	mineral_import_capitol
where
	run_id is null


declare @szFormatFile varchar(255)
select
	@szFormatFile = mineral_import_format_file_path + '\mineral_import_format_capitol.txt'
from
	pacs_system with (nolock)


declare @szSQL varchar(2048)
set @szSQL = 'bulk insert mineral_import_capitol '
set @szSQL = @szSQL + 'from ''' + @input_file + ''' '
set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''')'

exec (@szSQL)


update
	mineral_import_capitol
set
	run_id = @run_id
where
	run_id is null


update
	mineral_import_capitol
set
	interest = (isnull(interest, 0) / 1000000),
	acres = (isnull(acres, 0) / 1000),
	ent1_pc = (isnull(ent1_pc, 0) / 10000),
	ent2_pc = (isnull(ent2_pc, 0) / 10000),
	ent3_pc = (isnull(ent3_pc, 0) / 10000),
	ent4_pc = (isnull(ent4_pc, 0) / 10000),
	ent5_pc = (isnull(ent5_pc, 0) / 10000),
	ent6_pc = (isnull(ent6_pc, 0) / 10000),
	ent7_pc = (isnull(ent7_pc, 0) / 10000),
	ent8_pc = (isnull(ent8_pc, 0) / 10000),
	ent9_pc = (isnull(ent8_pc, 0) / 10000),
	ent10_pc = (isnull(ent10_pc, 0) / 10000),
	ent11_pc = (isnull(ent11_pc, 0) / 10000),
	ent12_pc = (isnull(ent12_pc, 0) / 10000),
	appr_dist_pc = (isnull(appr_dist_pc, 0) / 10000),
	exemption_pc = (isnull(exemption_pc, 0) / 100),
	old_exemption_pc = (isnull(old_exemption_pc, 0) / 100),
	frozen_tax_amount = (isnull(frozen_tax_amount, 0) / 100)
where
	run_id = @run_id


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
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'update mineral_import_capitol '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'set geo_id = '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + @szMineralGeoIDFormatSQL + ' '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'where run_id = ' + convert(varchar(12), @run_id) + ' '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'and prop_type = ''1'''

	exec (@szMineralGeoIDSQL)
end


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
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'update mineral_import_capitol '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'set geo_id = '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + @szPersonalGeoIDFormatSQL + ' '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'where run_id = ' + convert(varchar(12), @run_id) + ' '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'and prop_type <> ''1'''

	exec (@szPersonalGeoIDSQL)
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
	set @szMineralLegalSQL = @szMineralLegalSQL + 'update mineral_import_capitol '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'set legal_desc = '
	set @szMineralLegalSQL = @szMineralLegalSQL + @szMineralLegalFormatSQL + ' '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'where run_id = ' + convert(varchar(12), @run_id) + ' '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'and prop_type = ''1'''

	exec (@szMineralLegalSQL)
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
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'update mineral_import_capitol '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'set legal_desc = '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + @szPersonalLegalFormatSQL + ' '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'where run_id = ' + convert(varchar(12), @run_id) + ' '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'and prop_type <> ''1'''

	exec (@szPersonalLegalSQL)
end


declare TRIMLEGAL cursor
for
select
	rtrim(mic.legal_desc)
from
	mineral_import_capitol as mic
where
	mic.run_id = @run_id
and	mic.legal_desc is not null
for update of
	mic.legal_desc

declare @legal_desc varchar(255)

open TRIMLEGAL
fetch next from TRIMLEGAL
into
	@legal_desc

while (@@fetch_status = 0)
begin
	declare @prev_len int

	set @prev_len = len(@legal_desc)
	set @legal_desc = replace(@legal_desc, '  ', ' ')

	if (@prev_len <> len(@legal_desc))
	begin
		while (@prev_len <> len(@legal_desc))
		begin
			set @prev_len = len(@legal_desc)
			set @legal_desc = replace(@legal_desc, '  ', ' ')
		end
	
		update
			mineral_import_capitol
		set
			legal_desc = @legal_desc
		where
			current of TRIMLEGAL
	end

	fetch next from TRIMLEGAL
	into
		@legal_desc
end

close TRIMLEGAL
deallocate TRIMLEGAL

GO

