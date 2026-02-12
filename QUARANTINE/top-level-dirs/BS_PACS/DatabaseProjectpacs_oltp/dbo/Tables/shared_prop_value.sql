CREATE TABLE [dbo].[shared_prop_value] (
    [pacs_prop_id]    INT              NOT NULL,
    [shared_prop_id]  VARCHAR (30)     NOT NULL,
    [shared_year]     NUMERIC (4)      NOT NULL,
    [shared_cad_code] VARCHAR (5)      NOT NULL,
    [shared_value_id] INT              NOT NULL,
    [state_code]      VARCHAR (5)      NULL,
    [shared_value]    NUMERIC (14)     NULL,
    [acres]           NUMERIC (14, 4)  NULL,
    [ag_use_code]     VARCHAR (5)      NULL,
    [record_type]     VARCHAR (2)      NULL,
    [land_type_code]  CHAR (5)         NULL,
    [homesite_flag]   CHAR (1)         NULL,
    [ag_use_value]    NUMERIC (14)     NULL,
    [sup_num]         INT              NOT NULL,
    [hs_pct]          NUMERIC (13, 10) NULL,
    CONSTRAINT [CPK_shared_prop_value] PRIMARY KEY CLUSTERED ([shared_year] ASC, [sup_num] ASC, [pacs_prop_id] ASC, [shared_cad_code] ASC, [shared_prop_id] ASC, [shared_value_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_shared_prop_value_shared_cad_code] FOREIGN KEY ([shared_cad_code]) REFERENCES [dbo].[cad] ([CAD_code]),
    CONSTRAINT [CFK_shared_prop_value_shared_year_sup_num_pacs_prop_id_shared_cad_code_shared_prop_id] FOREIGN KEY ([shared_year], [sup_num], [pacs_prop_id], [shared_cad_code], [shared_prop_id]) REFERENCES [dbo].[shared_prop] ([shared_year], [sup_num], [pacs_prop_id], [shared_cad_code], [shared_prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_pacs_prop_id]
    ON [dbo].[shared_prop_value]([pacs_prop_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_shared_prop_value_delete_ChangeLog
on shared_prop_value
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
          chg_log_tables = 'shared_prop_value' and
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
 
declare @pacs_prop_id int
declare @shared_prop_id varchar(30)
declare @shared_year numeric(4,0)
declare @shared_cad_code varchar(5)
declare @shared_value_id int
declare @sup_num int
 
declare curRows cursor
for
     select pacs_prop_id, shared_prop_id, case shared_year when 0 then @tvar_lFutureYear else shared_year end, shared_cad_code, shared_value_id, sup_num from deleted
for read only
 
open curRows
fetch next from curRows into @pacs_prop_id, @shared_prop_id, @shared_year, @shared_cad_code, @shared_value_id, @sup_num
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @shared_cad_code + '-' + convert(varchar(12), @shared_value_id)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 761, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
 
     fetch next from curRows into @pacs_prop_id, @shared_prop_id, @shared_year, @shared_cad_code, @shared_value_id, @sup_num
end
 
close curRows
deallocate curRows

GO



create trigger tr_shared_prop_value_insert_ChangeLog
on shared_prop_value
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
 
declare @pacs_prop_id int
declare @shared_prop_id varchar(30)
declare @shared_year numeric(4,0)
declare @shared_cad_code varchar(5)
declare @shared_value_id int
declare @state_code varchar(5)
declare @shared_value numeric(14,0)
declare @acres numeric(14,4)
declare @ag_use_code varchar(5)
declare @record_type varchar(2)
declare @land_type_code char(5)
declare @homesite_flag char(1)
declare @ag_use_value numeric(14,0)
declare @sup_num int
 
declare curRows cursor
for
     select pacs_prop_id, shared_prop_id, case shared_year when 0 then @tvar_lFutureYear else shared_year end, shared_cad_code, shared_value_id, state_code, shared_value, acres, ag_use_code, record_type, land_type_code, homesite_flag, ag_use_value, sup_num from inserted
for read only
 
open curRows
fetch next from curRows into @pacs_prop_id, @shared_prop_id, @shared_year, @shared_cad_code, @shared_value_id, @state_code, @shared_value, @acres, @ag_use_code, @record_type, @land_type_code, @homesite_flag, @ag_use_value, @sup_num
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @shared_cad_code + '-' + convert(varchar(12), @shared_value_id)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'pacs_prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 3521, null, convert(varchar(255), @pacs_prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'shared_prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 4715, null, convert(varchar(255), @shared_prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'shared_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 4723, null, convert(varchar(255), @shared_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'shared_cad_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 4708, null, convert(varchar(255), @shared_cad_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'shared_value_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 4722, null, convert(varchar(255), @shared_value_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'state_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 4931, null, convert(varchar(255), @state_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'shared_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 4721, null, convert(varchar(255), @shared_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'acres' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 48, null, convert(varchar(255), @acres), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'ag_use_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 140, null, convert(varchar(255), @ag_use_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'record_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 4320, null, convert(varchar(255), @record_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'land_type_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 2694, null, convert(varchar(255), @land_type_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'homesite_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 2064, null, convert(varchar(255), @homesite_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'ag_use_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 144, null, convert(varchar(255), @ag_use_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop_value' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 761, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @shared_prop_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @shared_value_id), @shared_value_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     fetch next from curRows into @pacs_prop_id, @shared_prop_id, @shared_year, @shared_cad_code, @shared_value_id, @state_code, @shared_value, @acres, @ag_use_code, @record_type, @land_type_code, @homesite_flag, @ag_use_value, @sup_num
end
 
close curRows
deallocate curRows

GO



create trigger tr_shared_prop_value_update_ChangeLog
on shared_prop_value
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
 
declare @old_pacs_prop_id int
declare @new_pacs_prop_id int
declare @old_shared_prop_id varchar(30)
declare @new_shared_prop_id varchar(30)
declare @old_shared_year numeric(4,0)
declare @new_shared_year numeric(4,0)
declare @old_shared_cad_code varchar(5)
declare @new_shared_cad_code varchar(5)
declare @old_shared_value_id int
declare @new_shared_value_id int
declare @old_state_code varchar(5)
declare @new_state_code varchar(5)
declare @old_shared_value numeric(14,0)
declare @new_shared_value numeric(14,0)
declare @old_acres numeric(14,4)
declare @new_acres numeric(14,4)
declare @old_ag_use_code varchar(5)
declare @new_ag_use_code varchar(5)
declare @old_record_type varchar(2)
declare @new_record_type varchar(2)
declare @old_land_type_code char(5)
declare @new_land_type_code char(5)
declare @old_homesite_flag char(1)
declare @new_homesite_flag char(1)
declare @old_ag_use_value numeric(14,0)
declare @new_ag_use_value numeric(14,0)
declare @old_sup_num int
declare @new_sup_num int
 
declare curRows cursor
for
     select d.pacs_prop_id, d.shared_prop_id, case d.shared_year when 0 then @tvar_lFutureYear else d.shared_year end, d.shared_cad_code, d.shared_value_id, d.state_code, d.shared_value, d.acres, d.ag_use_code, d.record_type, d.land_type_code, d.homesite_flag, d.ag_use_value, d.sup_num, i.pacs_prop_id, i.shared_prop_id, case i.shared_year when 0 then @tvar_lFutureYear else i.shared_year end, i.shared_cad_code, i.shared_value_id, i.state_code, i.shared_value, i.acres, i.ag_use_code, i.record_type, i.land_type_code, i.homesite_flag, i.ag_use_value, i.sup_num
from deleted as d
join inserted as i on 
     d.pacs_prop_id = i.pacs_prop_id and
     d.shared_prop_id = i.shared_prop_id and
     d.shared_year = i.shared_year and
     d.shared_cad_code = i.shared_cad_code and
     d.shared_value_id = i.shared_value_id and
     d.sup_num = i.sup_num
for read only
 
open curRows
fetch next from curRows into @old_pacs_prop_id, @old_shared_prop_id, @old_shared_year, @old_shared_cad_code, @old_shared_value_id, @old_state_code, @old_shared_value, @old_acres, @old_ag_use_code, @old_record_type, @old_land_type_code, @old_homesite_flag, @old_ag_use_value, @old_sup_num, @new_pacs_prop_id, @new_shared_prop_id, @new_shared_year, @new_shared_cad_code, @new_shared_value_id, @new_state_code, @new_shared_value, @new_acres, @new_ag_use_code, @new_record_type, @new_land_type_code, @new_homesite_flag, @new_ag_use_value, @new_sup_num
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_shared_cad_code + '-' + convert(varchar(12), @new_shared_value_id)
 
     if (
          @old_pacs_prop_id <> @new_pacs_prop_id
          or
          ( @old_pacs_prop_id is null and @new_pacs_prop_id is not null ) 
          or
          ( @old_pacs_prop_id is not null and @new_pacs_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'pacs_prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 3521, convert(varchar(255), @old_pacs_prop_id), convert(varchar(255), @new_pacs_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_shared_prop_id <> @new_shared_prop_id
          or
          ( @old_shared_prop_id is null and @new_shared_prop_id is not null ) 
          or
          ( @old_shared_prop_id is not null and @new_shared_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'shared_prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 4715, convert(varchar(255), @old_shared_prop_id), convert(varchar(255), @new_shared_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_shared_year <> @new_shared_year
          or
          ( @old_shared_year is null and @new_shared_year is not null ) 
          or
          ( @old_shared_year is not null and @new_shared_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'shared_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 4723, convert(varchar(255), @old_shared_year), convert(varchar(255), @new_shared_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_shared_cad_code <> @new_shared_cad_code
          or
          ( @old_shared_cad_code is null and @new_shared_cad_code is not null ) 
          or
          ( @old_shared_cad_code is not null and @new_shared_cad_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'shared_cad_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 4708, convert(varchar(255), @old_shared_cad_code), convert(varchar(255), @new_shared_cad_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_shared_value_id <> @new_shared_value_id
          or
          ( @old_shared_value_id is null and @new_shared_value_id is not null ) 
          or
          ( @old_shared_value_id is not null and @new_shared_value_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'shared_value_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 4722, convert(varchar(255), @old_shared_value_id), convert(varchar(255), @new_shared_value_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_state_code <> @new_state_code
          or
          ( @old_state_code is null and @new_state_code is not null ) 
          or
          ( @old_state_code is not null and @new_state_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'state_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 4931, convert(varchar(255), @old_state_code), convert(varchar(255), @new_state_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_shared_value <> @new_shared_value
          or
          ( @old_shared_value is null and @new_shared_value is not null ) 
          or
          ( @old_shared_value is not null and @new_shared_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'shared_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 4721, convert(varchar(255), @old_shared_value), convert(varchar(255), @new_shared_value) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_acres <> @new_acres
          or
          ( @old_acres is null and @new_acres is not null ) 
          or
          ( @old_acres is not null and @new_acres is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'acres' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 48, convert(varchar(255), @old_acres), convert(varchar(255), @new_acres) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_ag_use_code <> @new_ag_use_code
          or
          ( @old_ag_use_code is null and @new_ag_use_code is not null ) 
          or
          ( @old_ag_use_code is not null and @new_ag_use_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'ag_use_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 140, convert(varchar(255), @old_ag_use_code), convert(varchar(255), @new_ag_use_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_record_type <> @new_record_type
          or
          ( @old_record_type is null and @new_record_type is not null ) 
          or
          ( @old_record_type is not null and @new_record_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'record_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 4320, convert(varchar(255), @old_record_type), convert(varchar(255), @new_record_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_land_type_code <> @new_land_type_code
          or
          ( @old_land_type_code is null and @new_land_type_code is not null ) 
          or
          ( @old_land_type_code is not null and @new_land_type_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'land_type_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 2694, convert(varchar(255), @old_land_type_code), convert(varchar(255), @new_land_type_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_homesite_flag <> @new_homesite_flag
          or
          ( @old_homesite_flag is null and @new_homesite_flag is not null ) 
          or
          ( @old_homesite_flag is not null and @new_homesite_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'homesite_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 2064, convert(varchar(255), @old_homesite_flag), convert(varchar(255), @new_homesite_flag) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_ag_use_value <> @new_ag_use_value
          or
          ( @old_ag_use_value is null and @new_ag_use_value is not null ) 
          or
          ( @old_ag_use_value is not null and @new_ag_use_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'ag_use_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 144, convert(varchar(255), @old_ag_use_value), convert(varchar(255), @new_ag_use_value) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_sup_num <> @new_sup_num
          or
          ( @old_sup_num is null and @new_sup_num is not null ) 
          or
          ( @old_sup_num is not null and @new_sup_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop_value' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 761, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4715, convert(varchar(24), @new_shared_prop_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4722, convert(varchar(24), @new_shared_value_id), @new_shared_value_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     fetch next from curRows into @old_pacs_prop_id, @old_shared_prop_id, @old_shared_year, @old_shared_cad_code, @old_shared_value_id, @old_state_code, @old_shared_value, @old_acres, @old_ag_use_code, @old_record_type, @old_land_type_code, @old_homesite_flag, @old_ag_use_value, @old_sup_num, @new_pacs_prop_id, @new_shared_prop_id, @new_shared_year, @new_shared_cad_code, @new_shared_value_id, @new_state_code, @new_shared_value, @new_acres, @new_ag_use_code, @new_record_type, @new_land_type_code, @new_homesite_flag, @new_ag_use_value, @new_sup_num
end
 
close curRows
deallocate curRows

GO

