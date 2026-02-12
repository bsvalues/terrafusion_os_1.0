CREATE TABLE [dbo].[ms_manuf_mult] (
    [ms_year]    NUMERIC (4)    NOT NULL,
    [local_mult] NUMERIC (6, 4) NULL,
    [cost_mult]  NUMERIC (6, 4) NULL,
    CONSTRAINT [CPK_ms_manuf_mult] PRIMARY KEY CLUSTERED ([ms_year] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_ms_manuf_mult_delete_ChangeLog
on ms_manuf_mult
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
          chg_log_tables = 'ms_manuf_mult' and
          chg_log_audit = 1
)
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
select @tvar_lFutureYear = future_yr
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
 
declare @ms_year numeric(4,0)
 
declare curRows cursor
for
     select case ms_year when 0 then @tvar_lFutureYear else ms_year end from deleted
for read only
 
open curRows
fetch next from curRows into @ms_year
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @ms_year)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 450, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @ms_year), case when @ms_year > @tvar_intMin and @ms_year < @tvar_intMax then convert(int, round(@ms_year, 0, 1)) else 0 end)
 
     fetch next from curRows into @ms_year
end
 
close curRows
deallocate curRows

GO



create trigger tr_ms_manuf_mult_insert_ChangeLog
on ms_manuf_mult
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
select @tvar_lFutureYear = future_yr
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
 
declare @ms_year numeric(4,0)
declare @local_mult numeric(6,4)
declare @cost_mult numeric(6,4)
 
declare curRows cursor
for
     select case ms_year when 0 then @tvar_lFutureYear else ms_year end, local_mult, cost_mult from inserted
for read only
 
open curRows
fetch next from curRows into @ms_year, @local_mult, @cost_mult
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @ms_year)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'ms_manuf_mult' and
               chg_log_columns = 'ms_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 450, 3211, null, convert(varchar(255), @ms_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @ms_year), case when @ms_year > @tvar_intMin and @ms_year < @tvar_intMax then convert(int, round(@ms_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'ms_manuf_mult' and
               chg_log_columns = 'local_mult' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 450, 2887, null, convert(varchar(255), @local_mult), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @ms_year), case when @ms_year > @tvar_intMin and @ms_year < @tvar_intMax then convert(int, round(@ms_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'ms_manuf_mult' and
               chg_log_columns = 'cost_mult' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 450, 901, null, convert(varchar(255), @cost_mult), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @ms_year), case when @ms_year > @tvar_intMin and @ms_year < @tvar_intMax then convert(int, round(@ms_year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @ms_year, @local_mult, @cost_mult
end
 
close curRows
deallocate curRows

GO



create trigger tr_ms_manuf_mult_update_ChangeLog
on ms_manuf_mult
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
select @tvar_lFutureYear = future_yr
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
 
declare @old_ms_year numeric(4,0)
declare @new_ms_year numeric(4,0)
declare @old_local_mult numeric(6,4)
declare @new_local_mult numeric(6,4)
declare @old_cost_mult numeric(6,4)
declare @new_cost_mult numeric(6,4)
 
declare curRows cursor
for
     select case d.ms_year when 0 then @tvar_lFutureYear else d.ms_year end, d.local_mult, d.cost_mult, case i.ms_year when 0 then @tvar_lFutureYear else i.ms_year end, i.local_mult, i.cost_mult
from deleted as d
join inserted as i on 
     d.ms_year = i.ms_year
for read only
 
open curRows
fetch next from curRows into @old_ms_year, @old_local_mult, @old_cost_mult, @new_ms_year, @new_local_mult, @new_cost_mult
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @new_ms_year)
 
     if (
          @old_ms_year <> @new_ms_year
          or
          ( @old_ms_year is null and @new_ms_year is not null ) 
          or
          ( @old_ms_year is not null and @new_ms_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'ms_manuf_mult' and
                    chg_log_columns = 'ms_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 450, 3211, convert(varchar(255), @old_ms_year), convert(varchar(255), @new_ms_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @new_ms_year), case when @new_ms_year > @tvar_intMin and @new_ms_year < @tvar_intMax then convert(int, round(@new_ms_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_local_mult <> @new_local_mult
          or
          ( @old_local_mult is null and @new_local_mult is not null ) 
          or
          ( @old_local_mult is not null and @new_local_mult is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'ms_manuf_mult' and
                    chg_log_columns = 'local_mult' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 450, 2887, convert(varchar(255), @old_local_mult), convert(varchar(255), @new_local_mult) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @new_ms_year), case when @new_ms_year > @tvar_intMin and @new_ms_year < @tvar_intMax then convert(int, round(@new_ms_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cost_mult <> @new_cost_mult
          or
          ( @old_cost_mult is null and @new_cost_mult is not null ) 
          or
          ( @old_cost_mult is not null and @new_cost_mult is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'ms_manuf_mult' and
                    chg_log_columns = 'cost_mult' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 450, 901, convert(varchar(255), @old_cost_mult), convert(varchar(255), @new_cost_mult) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @new_ms_year), case when @new_ms_year > @tvar_intMin and @new_ms_year < @tvar_intMax then convert(int, round(@new_ms_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_ms_year, @old_local_mult, @old_cost_mult, @new_ms_year, @new_local_mult, @new_cost_mult
end
 
close curRows
deallocate curRows

GO

