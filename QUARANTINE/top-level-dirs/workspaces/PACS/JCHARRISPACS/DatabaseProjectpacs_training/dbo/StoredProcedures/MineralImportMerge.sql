


create procedure MineralImportMerge
	@pacs_user_id int,
	@run_id int,
	@do_not_merge_zero_value_property bit = 0
as


set nocount on

declare @backup_err int
declare @year numeric(4,0)

-- Insert a status record
insert into
	mineral_import_status
(
	run_id,
	status_code,
	status_user_id,
	status_date
)
select
	@run_id,
	'MERGE',
	@pacs_user_id,
	GetDate()


delete
	chg_log_user
where
	machine = host_name()

exec SetChgLogUser -1
exec SetMachineLogChanges 0


-- Drop the local temporary table this procedure uses 
if object_id('tempdb..#tmp')  is not null
begin
	drop table #tmp
end 


-- First backup PACS tables that are to be modified
exec @backup_err = MineralImportBackup @pacs_user_id, @run_id 
if @backup_err <> 0
begin
	return @backup_err
end


-- Second move any zero value properties
if @do_not_merge_zero_value_property = 1
begin
	select
		* 
	into
		#tmp
	from
		mineral_import_property as mip with (nolock)
	where
		mip.run_id = @run_id
	and	value <= 0


	delete
		mineral_import_property
	where
		run_id = @run_id
	and	value <= 0
end


exec MineralImportMergeAgent @pacs_user_id, @run_id
exec MineralImportMergeOwner @pacs_user_id, @run_id
exec MineralImportMergeProperty @pacs_user_id, @run_id
exec MineralImportMergeExemption @pacs_user_id, @run_id


declare getyear scroll cursor
for
select distinct
	mip.prop_val_yr
from
	mineral_import_property as mip with (nolock)
where
	mip.run_id = @run_id 


open getyear
fetch next from getyear
into
	@year

while (@@fetch_status = 0)
begin
	exec RecalcProperty 0, @year, 0
	exec CalculateTaxable '', 0, @year

	fetch next from getyear
	into
		@year
end

close getyear
deallocate getyear


-- Restore any zero value properties
if @do_not_merge_zero_value_property = 1
begin
	insert into
		mineral_import_property
	select
		* 
	from
		#tmp

	drop table #tmp
end

exec SetMachineLogChanges 1

GO

