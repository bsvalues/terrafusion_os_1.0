



create procedure dbo.MineralImportPritchardAbbottAgent
	@run_id int,
	@year numeric(4),
	@appr_company_id int,
	@agent_file varchar(255)
as


delete
	mineral_import_agent_data_pritchard_abbott
where
	run_id is null


delete
	mineral_import_agent_pritchard_abbott
where
	run_id is null


declare @szFormatFile varchar(255)
select
	@szFormatFile = mineral_import_format_file_path + '\mineral_import_agent_format_pritchard_abbott.txt'
from
	pacs_system with (nolock)


declare @szSQL varchar(2048)
set @szSQL = 'bulk insert mineral_import_agent_data_pritchard_abbott '
set @szSQL = @szSQL + 'from ''' + @agent_file + ''' '
set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''')'

exec (@szSQL)


update
	mineral_import_agent_data_pritchard_abbott
set
	run_id = @run_id
where
	run_id is null



insert into
	mineral_import_agent_pritchard_abbott
(
	run_id,
	agent_number,
	agent_name,
	agent_firm,
	street,
	city,
	state,
	zip,
	dash,
	plus_four
)
select
	miadpa.run_id,
	substring(miadpa.data, 1, 3),
	substring(miadpa.data, 4, 30),
	substring(miadpa.data, 34, 30),
	substring(miadpa.data, 64, 30),
	substring(miadpa.data, 94, 16),
	substring(miadpa.data, 110, 2),
	substring(miadpa.data, 112, 5),
	substring(miadpa.data, 117, 1),
	substring(miadpa.data, 118, 4)
from
	mineral_import_agent_data_pritchard_abbott as miadpa with (nolock)
where
	miadpa.run_id = @run_id
and	len(ltrim(rtrim(miadpa.data))) > 3


insert into
	mineral_import_agent
(
	run_id,
	acct_id,
	agent_code,
	file_as_name,
	addr_line1,
	addr_line2,
	addr_line3,
	addr_city,
	addr_st,
	addr_zip,
	source,
	acct_create_dt,
	appr_company_id
)
select distinct
	@run_id,
	0,
	miapa.agent_number,
	miapa.agent_name,
	miapa.agent_firm,
	miapa.street,
	'',
	miapa.city,
	miapa.state,
	miapa.zip + miapa.dash + miapa.plus_four,
	'P&A',
	getdate(),
	@appr_company_id
from
	mineral_import_agent_pritchard_abbott as miapa with (nolock)
where
	miapa.run_id = @run_id

GO

