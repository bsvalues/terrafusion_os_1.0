CREATE TABLE [dbo].[sale_additional_codes] (
    [chg_of_owner_id] INT          NOT NULL,
    [sale_cd]         VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_sale_additional_codes] PRIMARY KEY CLUSTERED ([chg_of_owner_id] ASC, [sale_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sale_additional_codes_chg_of_owner_id] FOREIGN KEY ([chg_of_owner_id]) REFERENCES [dbo].[sale] ([chg_of_owner_id]),
    CONSTRAINT [CFK_sale_additional_codes_sale_cd] FOREIGN KEY ([sale_cd]) REFERENCES [dbo].[additional_sale_code] ([sale_cd])
);


GO

 
create trigger tr_sale_additional_codes_update_ChangeLog
on sale_additional_codes
for update
not for replication
as
begin
	if ( @@rowcount = 0 )
			 return;
	 
	set nocount on;

	RAISERROR ( '''tr_sale_additional_codes_update_ChangeLog'': Update operations are not supported by the change log functionality', 16, 0);
end

GO

 
create trigger tr_sale_additional_codes_delete_ChangeLog
on sale_additional_codes
for delete
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
 
if not exists (
     select chg_log_audit
     from chg_log_columns with(nolock)
     where
          chg_log_tables = 'sale_additional_codes' and
          chg_log_audit = 1
)
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
 
declare @chg_of_owner_id int
declare @sale_cd varchar(10)
 
declare curRows cursor
for
     select chg_of_owner_id, sale_cd from deleted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @sale_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@chg_of_owner_id as varchar) + '-' + @sale_cd
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1203, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9495, convert(varchar(24), @sale_cd), 0)
 
     fetch next from curRows into @chg_of_owner_id, @sale_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_sale_additional_codes_insert_ChangeLog
on sale_additional_codes
for insert
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
 
declare @chg_of_owner_id int
declare @sale_cd varchar(10)
 
declare curRows cursor
for
     select chg_of_owner_id, sale_cd from inserted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @sale_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@chg_of_owner_id as varchar) + '-' + @sale_cd
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_additional_codes' and
               chg_log_columns = 'chg_of_owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1203, 713, null, convert(varchar(255), @chg_of_owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9495, convert(varchar(24), @sale_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_additional_codes' and
               chg_log_columns = 'sale_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1203, 9495, null, convert(varchar(255), @sale_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9495, convert(varchar(24), @sale_cd), 0)
     end
 
     fetch next from curRows into @chg_of_owner_id, @sale_cd
end
 
close curRows
deallocate curRows

GO

