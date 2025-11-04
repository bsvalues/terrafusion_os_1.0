



create procedure dbo.MineralImportTYPickett
	@run_id int,
	@year numeric(4),
	@appr_company_id int,
	@user_id int,
	@mineral_file varchar(255),
	@utility_file varchar(255),
	@agent_file varchar(255)
as


insert into
	dbo.mineral_import
(
	run_id,
	year,
	appr_company_id
)
values
(
	@run_id,
	@year,
	@appr_company_id
)


insert into
	dbo.mineral_import_status
(
	run_id,
	status_code,
	status_user_id,
	status_date
)
values
(
	@run_id,
	'IMPORT',
	@user_id,
	GetDate()
)


exec MineralImportTYPickettAgent @run_id, @year, @appr_company_id, @agent_file

if @mineral_file <> ''
begin
	exec MineralImportTYPickettMineralStaging @run_id, @year, @appr_company_id, @mineral_file
	exec MineralImportTYPickettMineralCommon @run_id, @year, @appr_company_id
end


if @utility_file <> ''
begin
	exec MineralImportTYPickettUtilityStaging @run_id, @year, @appr_company_id, @utility_file
	exec MineralImportTYPickettUtilityCommon @run_id, @year, @appr_company_id
end

GO

