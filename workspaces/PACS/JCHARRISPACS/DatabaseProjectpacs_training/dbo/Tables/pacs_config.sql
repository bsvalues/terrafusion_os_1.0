CREATE TABLE [dbo].[pacs_config] (
    [szGroup]       VARCHAR (23)  NOT NULL,
    [szConfigName]  VARCHAR (63)  NOT NULL,
    [szConfigValue] VARCHAR (511) NOT NULL,
    CONSTRAINT [CPK_pacs_config] PRIMARY KEY CLUSTERED ([szGroup] ASC, [szConfigName] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_pacs_config_delete_insert_update_MemTable
on pacs_config
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'pacs_config'

GO

 
create trigger tr_pacs_config_update_ChangeLog
on pacs_config
for update
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @szConfigName varchar(63)

declare @old_szConfigValue varchar(511)
declare @new_szConfigValue varchar(511)

 
declare curRows cursor
for
     select i.szConfigName,d.szConfigValue,i.szConfigValue
from deleted as d
join inserted as i on 
     d.szConfigName = i.szConfigName
for read only
 
open curRows
fetch next from curRows into @szConfigName, @old_szConfigValue,
                              @new_szConfigValue
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @szConfigName = 'Ignore Oct 31' and 
          @old_szConfigValue <> @new_szConfigValue
          or
          ( @old_szConfigValue is null and @new_szConfigValue is not null ) 
          or
          ( @old_szConfigValue is not null and @new_szConfigValue is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_config' and
                    chg_log_columns = 'szConfigValue' and
                    chg_log_audit = 1
          )
          begin
				
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1074, 9944, convert(varchar(255), @old_szConfigValue), convert(varchar(255), @new_szConfigValue), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9944, convert(varchar(24), @new_szConfigValue), @new_szConfigValue)
              
          end
     end
 

fetch next from curRows into @szConfigName, @old_szConfigValue,
                              @new_szConfigValue
end
 
close curRows
deallocate curRows

GO

