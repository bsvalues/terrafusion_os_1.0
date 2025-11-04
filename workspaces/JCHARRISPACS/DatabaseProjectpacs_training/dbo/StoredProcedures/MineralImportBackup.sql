
create procedure MineralImportBackup
	@pacs_user_id int,
	@run_id int
as

set nocount on
declare @err int

-- Drop the local temporary table this procedure uses 
If object_id('tempdb..#tmp_yr')  IS NOT NULL
Begin
	drop table #tmp_yr
End 

declare @text varchar(2000)
declare @run_id_str varchar(20)

set @run_id_str=convert(varchar(20),@run_id)

-- Make a list of years from the import
select distinct
	prop_val_yr 
into
	#tmp_yr
from
	mineral_import_property
where
	run_id = @run_id

-- Note: No select list is provided during backups, the schema of these tables should
-- be kept in sync, and we want it to fail if they are not other wise it will not be
-- a valid backup 

-- Backup account table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_account_' + @run_id_str
set @text = @text + ' from account with(nolock)'
exec(@text)

if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end

set @text = ''
set @text = @text + ' select * into mineral_import_backup_address_' + @run_id_str
set @text = @text + ' from address with(nolock)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end



-- Backup property_val table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_property_val_' + @run_id_str
set @text = @text + ' from property_val as pv with(nolock)'
set @text = @text + ' where pv.prop_val_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end

-- Backup property table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_property_' + @run_id_str
set @text = @text + ' from property as p with(nolock)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end

-- Backup the mineral_acct table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_mineral_acct_' + @run_id_str
set @text = @text + ' from mineral_acct as ma with(nolock)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end


-- Backup prop supp assoc
set @text = ''
set @text = @text + ' select * into mineral_import_backup_prop_supp_assoc_' + @run_id_str
set @text = @text + ' from prop_supp_assoc as psa with(nolock)'
set @text = @text + ' where psa.owner_tax_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)

if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end

-- Backup owner table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_owner_' + @run_id_str
set @text = @text + ' from owner as o with(nolock)'
set @text = @text + ' where o.owner_tax_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end

-- Backup entity prop assoc 
set @text = ''
set @text = @text + ' select * into mineral_import_entity_prop_assoc_' + @run_id_str
set @text = @text + ' from entity_prop_assoc as epa with(nolock)'
set @text = @text + ' where epa.tax_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end

-- Backup personal property segments
set @text = ''
set @text = @text + ' select * into mineral_import_pers_prop_seg_' + @run_id_str
set @text = @text + ' from pers_prop_seg as pps with(nolock)'
set @text = @text + ' where pps.prop_val_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end

-- Backup special entity exemptions
set @text = ''
set @text = @text + ' select * into mineral_import_special_entity_exemption_' + @run_id_str
set @text = @text + ' from property_special_entity_exemption as e with(nolock)'
set @text = @text + ' where e.exmpt_tax_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end

set @text = ''
set @text = @text + ' select * into mineral_import_property_exemption_' + @run_id_str
set @text = @text + ' from property_exemption as e with(nolock)'
set @text = @text + ' where e.exmpt_tax_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end


-- Backup agent table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_agent_' + @run_id_str
set @text = @text + ' from agent as a with(nolock)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end


-- Backup agent_assoc table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_agent_assoc_' + @run_id_str
set @text = @text + ' from agent_assoc as aa with(nolock)'
set @text = @text + ' where aa.owner_tax_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)


-- Backup pers_prop_rendition table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_pers_prop_rendition_' + @run_id_str
set @text = @text + ' from pers_prop_rendition as ppr with(nolock)'
set @text = @text + ' where ppr.rendition_year in (select prop_val_yr from #tmp_yr)'
exec(@text)


-- Backup pp_rendition_tracking table
set @text = ''
set @text = @text + ' select * into mineral_import_backup_pp_rendition_tracking_' + @run_id_str
set @text = @text + ' from pp_rendition_tracking as prt with(nolock)'
set @text = @text + ' where prt.prop_val_yr in (select prop_val_yr from #tmp_yr)'
exec(@text)


if @@ERROR <> 0
begin
	set @err = @@error
	return @err
end


drop table #tmp_yr

GO

