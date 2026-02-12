



create procedure dbo.MineralImportPritchardAbbottStaging
	@run_id int,
	@year numeric(4),
	@appr_company_id int,
	@input_file varchar(255)
as


delete
	mineral_import_data_pritchard_abbott
where
	run_id is null


delete
	mineral_import_pritchard_abbott
where
	run_id is null



declare @szFormatFile varchar(255)
select
	@szFormatFile = mineral_import_format_file_path + '\mineral_import_format_pritchard_abbott.txt'
from
	pacs_system with (nolock)




declare @szSQL varchar(2048)
set @szSQL = 'bulk insert mineral_import_data_pritchard_abbott '
set @szSQL = @szSQL + 'from ''' + @input_file + ''' '
set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''')'

exec (@szSQL)


update
	mineral_import_data_pritchard_abbott
set
	run_id = @run_id
where
	run_id is null


insert into
	mineral_import_pritchard_abbott
(
	run_id,
	job,
	rendered_code,
	prop_type,
	interest_type,
	year_lease_started,
	protest_p,
	state_cd,
	agent_number,
	sort_code,
	decimal_interest,
	lease_name,
	oper_name,
	desc1,
	desc2,
	owner_name,
	in_care_of,
	street_addr,
	city,
	state,
	zip,
	rrc,
	ent1,
	ent2,
	ent3,
	ent4,
	ent5,
	ent6,
	ent7,
	ent8,
	ent9,
	ent10,
	ent11,
	ent12,
	ent1_taxable,
	ent2_taxable,
	ent3_taxable,
	ent4_taxable,
	ent5_taxable,
	ent6_taxable,
	ent7_taxable,
	ent8_taxable,
	ent9_taxable,
	ent10_taxable,
	ent11_taxable,
	ent12_taxable,
	ent1_market,
	ent2_market,
	ent3_market,
	ent4_market,
	ent5_market,
	ent6_market,
	ent7_market,
	ent8_market,
	ent9_market,
	ent10_market,
	ent11_market,
	ent12_market,
	acres,
	owner_number,
	lease_number,
	absolute_ex,
	ent1_minex,
	ent2_minex,
	ent3_minex,
	ent4_minex,
	ent5_minex,
	ent6_minex,
	ent7_minex,
	ent8_minex,
	ent9_minex,
	ent10_minex,
	ent11_minex,
	ent12_minex,
	geo_number,
	pollution_control,
	ent1_minpa,
	ent2_minpa,
	ent3_minpa,
	ent4_minpa,
	ent5_minpa,
	ent6_minpa,
	ent7_minpa,
	ent8_minpa,
	ent9_minpa,
	ent10_minpa,
	ent11_minpa,
	ent12_minpa,
	account_number,
	account_seq,
	prev_account_number,
	prev_account_seq,
	privacy_code,
	compliance_code    
)
select
	midpa.run_id,
	substring(midpa.data, 2, 7),
	substring(midpa.data, 14, 1),
	substring(midpa.data, 16, 1),
	substring(midpa.data, 17, 1),
	substring(midpa.data, 18, 4),
	substring(midpa.data, 22, 1),
	substring(midpa.data, 23, 3),
	substring(midpa.data, 26, 3),
	substring(midpa.data, 29, 1),
	substring(midpa.data, 34, 7),
	substring(midpa.data, 41, 30),
	substring(midpa.data, 71, 20),
	substring(midpa.data, 91, 30),
	substring(midpa.data, 121, 30),
	substring(midpa.data, 151, 30),
	substring(midpa.data, 181, 30),
	substring(midpa.data, 211, 30),
	substring(midpa.data, 241, 17),
	substring(midpa.data, 258, 3),
	substring(midpa.data, 261, 10),
	substring(midpa.data, 271, 20),
	substring(midpa.data, 297, 2),
	substring(midpa.data, 299, 2),
	substring(midpa.data, 301, 2),
	substring(midpa.data, 303, 2),
	substring(midpa.data, 305, 2),
	substring(midpa.data, 307, 2),
	substring(midpa.data, 309, 2),
	substring(midpa.data, 311, 2),
	substring(midpa.data, 313, 2),
	substring(midpa.data, 315, 2),
	substring(midpa.data, 317, 2),
	substring(midpa.data, 319, 2),
	convert(numeric(9,0), substring(midpa.data, 321, 9)),
	convert(numeric(9,0), substring(midpa.data, 330, 9)),
	convert(numeric(9,0), substring(midpa.data, 339, 9)),
	convert(numeric(9,0), substring(midpa.data, 348, 9)),
	convert(numeric(9,0), substring(midpa.data, 357, 9)),
	convert(numeric(9,0), substring(midpa.data, 366, 9)),
	convert(numeric(9,0), substring(midpa.data, 375, 9)),
	convert(numeric(9,0), substring(midpa.data, 384, 9)),
	convert(numeric(9,0), substring(midpa.data, 393, 9)),
	convert(numeric(9,0), substring(midpa.data, 402, 9)),
	convert(numeric(9,0), substring(midpa.data, 411, 9)),
	convert(numeric(9,0), substring(midpa.data, 420, 9)),
	convert(numeric(9,0), substring(midpa.data, 429, 9)),
	convert(numeric(9,0), substring(midpa.data, 438, 9)),
	convert(numeric(9,0), substring(midpa.data, 447, 9)),
	convert(numeric(9,0), substring(midpa.data, 456, 9)),
	convert(numeric(9,0), substring(midpa.data, 465, 9)),
	convert(numeric(9,0), substring(midpa.data, 474, 9)),
	convert(numeric(9,0), substring(midpa.data, 483, 9)),
	convert(numeric(9,0), substring(midpa.data, 492, 9)),
	convert(numeric(9,0), substring(midpa.data, 501, 9)),
	convert(numeric(9,0), substring(midpa.data, 510, 9)),
	convert(numeric(9,0), substring(midpa.data, 519, 9)),
	convert(numeric(9,0), substring(midpa.data, 528, 9)),
	convert(numeric(9,0), substring(midpa.data, 537, 9)),
	substring(midpa.data, 546, 7),
	substring(midpa.data, 553, 7),
	substring(midpa.data, 561, 1),
	substring(midpa.data, 562, 1),
	substring(midpa.data, 563, 1),
	substring(midpa.data, 564, 1),
	substring(midpa.data, 565, 1),
	substring(midpa.data, 566, 1),
	substring(midpa.data, 567, 1),
	substring(midpa.data, 568, 1),
	substring(midpa.data, 569, 1),
	substring(midpa.data, 570, 1),
	substring(midpa.data, 571, 1),
	substring(midpa.data, 572, 1),
	substring(midpa.data, 573, 1),
	substring(midpa.data, 574, 25),
	convert(numeric(9,0), substring(midpa.data, 599, 9)),
	substring(midpa.data, 608, 1),
	substring(midpa.data, 609, 1),
	substring(midpa.data, 610, 1),
	substring(midpa.data, 611, 1),
	substring(midpa.data, 612, 1),
	substring(midpa.data, 613, 1),
	substring(midpa.data, 614, 1),
	substring(midpa.data, 615, 1),
	substring(midpa.data, 616, 1),
	substring(midpa.data, 617, 1),
	substring(midpa.data, 618, 1),
	substring(midpa.data, 619, 1),
	substring(midpa.data, 620, 7),
	substring(midpa.data, 627, 7),
	substring(midpa.data, 634, 7),
	substring(midpa.data, 641, 7),
	substring(midpa.data, 648, 1),
	substring(midpa.data, 649, 2)
from
	mineral_import_data_pritchard_abbott as midpa with (nolock)
where
	midpa.run_id = @run_id
and	len(rtrim(ltrim(midpa.data))) > 7


update
	mineral_import_pritchard_abbott
set
	acres = (isnull(acres, 0) / 1000),
	decimal_interest = (isnull(decimal_interest, 0) / 1000000),
	value = dbo.fn_GetMaxValue(ent1_market, ent2_market, ent3_market, ent4_market, ent5_market, ent6_market, ent7_market, ent8_market, ent9_market, ent10_market, ent11_market, ent12_market)
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
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'update mineral_import_pritchard_abbott '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'set geo_id = '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + @szMineralGeoIDFormatSQL + ' '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'where run_id = ' + convert(varchar(12), @run_id) + ' '
	set @szMineralGeoIDSQL = @szMineralGeoIDSQL + 'and prop_type in (1,2)'

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
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'update mineral_import_pritchard_abbott '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'set geo_id = '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + @szPersonalGeoIDFormatSQL + ' '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'where run_id = ' + convert(varchar(12), @run_id) + ' '
	set @szPersonalGeoIDSQL = @szPersonalGeoIDSQL + 'and prop_type not in (1,2)'

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
	set @szMineralLegalSQL = @szMineralLegalSQL + 'update mineral_import_pritchard_abbott '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'set legal_desc = '
	set @szMineralLegalSQL = @szMineralLegalSQL + @szMineralLegalFormatSQL + ' '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'where run_id = ' + convert(varchar(12), @run_id) + ' '
	set @szMineralLegalSQL = @szMineralLegalSQL + 'and prop_type in (1,2)'

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
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'update mineral_import_pritchard_abbott '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'set legal_desc = '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + @szPersonalLegalFormatSQL + ' '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'where run_id = ' + convert(varchar(12), @run_id) + ' '
	set @szPersonalLegalSQL = @szPersonalLegalSQL + 'and prop_type not in (1,2)'

	exec (@szPersonalLegalSQL)
end

GO

