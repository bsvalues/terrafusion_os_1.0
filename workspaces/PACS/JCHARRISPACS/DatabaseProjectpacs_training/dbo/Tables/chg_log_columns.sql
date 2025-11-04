CREATE TABLE [dbo].[chg_log_columns] (
    [chg_log_tables]      VARCHAR (50)  NOT NULL,
    [chg_log_columns]     VARCHAR (50)  NOT NULL,
    [chg_log_audit]       TINYINT       NOT NULL,
    [chg_log_description] VARCHAR (100) NOT NULL,
    [chg_log_module]      VARCHAR (50)  NULL,
    CONSTRAINT [CPK_chg_log_columns] PRIMARY KEY CLUSTERED ([chg_log_tables] ASC, [chg_log_columns] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_chg_log_description]
    ON [dbo].[chg_log_columns]([chg_log_description] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_chg_log_columns]
    ON [dbo].[chg_log_columns]([chg_log_columns] ASC) WITH (FILLFACTOR = 90);


GO

 
create trigger tr_chg_log_columns_update_ChangeLog
on chg_log_columns
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

declare @old_chg_log_tables varchar(50)
declare @new_chg_log_tables varchar(50)
declare @old_chg_log_columns varchar(50)
declare @new_chg_log_columns varchar(50) 
declare @old_chg_log_audit int
declare @new_chg_log_audit int

 
declare curRows cursor
for
     select d.chg_log_tables, d.chg_log_columns, d.chg_log_audit, 
            i.chg_log_tables, i.chg_log_columns, i.chg_log_audit
from deleted as d
join inserted as i on 
     d.chg_log_tables = i.chg_log_tables and
     d.chg_log_columns = i.chg_log_columns
for read only
 
open curRows
fetch next from curRows into @old_chg_log_tables, @old_chg_log_columns, @old_chg_log_audit,
			     @new_chg_log_tables, @new_chg_log_columns, @new_chg_log_audit
							
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_chg_log_audit <> @new_chg_log_audit
          or
          ( @old_chg_log_audit is null and @new_chg_log_audit is not null ) 
          or
          ( @old_chg_log_audit is not null and @new_chg_log_audit is null ) 
     )
     begin
		set @tvar_szRefID = @new_chg_log_columns
		
        insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
        values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 156, 700, convert(varchar(255), @old_chg_log_audit), convert(varchar(255), @new_chg_log_audit), @tvar_szRefID )
        set @tvar_lChangeID = @@identity

        insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 704, convert(varchar(50), @new_chg_log_tables), 0)
        insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 701, convert(varchar(50), @new_chg_log_columns), 0)
     end

	fetch next from curRows into @old_chg_log_tables, @old_chg_log_columns, @old_chg_log_audit,
				     @new_chg_log_tables, @new_chg_log_columns, @new_chg_log_audit							 
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_chg_log_columns_delete_ChangeLog
on chg_log_columns
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
declare @tvar_szOldValue varchar(255)
set @tvar_szOldValue = 'DELETED'
 
declare @tvar_key_prop_id int
 
declare @chg_log_tables varchar(50)
declare @chg_log_columns varchar(50)
declare @chg_log_audit int
 
declare curRows cursor
for
     select chg_log_tables, chg_log_columns, chg_log_audit from deleted
for read only
 
open curRows
fetch next from curRows into @chg_log_tables, @chg_log_columns, @chg_log_audit
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @chg_log_columns

 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 156, 700, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 704, convert(varchar(50), @chg_log_tables), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 701, convert(varchar(50), @chg_log_columns), 0)
 
     fetch next from curRows into @chg_log_tables, @chg_log_columns, @chg_log_audit
end
 
close curRows
deallocate curRows

GO

