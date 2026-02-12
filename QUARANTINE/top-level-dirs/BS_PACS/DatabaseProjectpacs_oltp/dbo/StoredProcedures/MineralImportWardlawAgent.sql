



create procedure MineralImportWardlawAgent
	@run_id int,
	@year numeric(4),
	@appr_company_id int,
	@agent_file varchar(255)
as


delete
	mineral_import_agent_wardlaw
where
	run_id is null


declare @szFormatFile varchar(255)
select
	@szFormatFile = mineral_import_format_file_path + '\mineral_import_agent_format_wardlaw.txt'
from
	pacs_system with (nolock)


declare @szSQL varchar(2048)
set @szSQL = 'bulk insert mineral_import_agent_wardlaw '
set @szSQL = @szSQL + 'from ''' + @agent_file + ''' '
set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''')'

exec (@szSQL)


update
	mineral_import_agent_wardlaw
set
	run_id = @run_id
where
	run_id is null




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
	miaw.agent_code,
	miaw.agent_name,
	miaw.address,
	'',
	'',
	miaw.city,
	miaw.state,
	miaw.zip_code,
	'WDL',
	getdate(),
	@appr_company_id
from
	mineral_import_agent_wardlaw as miaw with (nolock)
where
	miaw.run_id = @run_id

GO

