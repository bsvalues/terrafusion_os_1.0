CREATE TABLE [dbo].[pp_rendition_prop_penalty] (
    [prop_id]                     INT             NOT NULL,
    [owner_id]                    INT             NOT NULL,
    [sup_num]                     INT             NOT NULL,
    [rendition_year]              NUMERIC (4)     NOT NULL,
    [owner_name]                  VARCHAR (70)    NULL,
    [legal_desc]                  VARCHAR (255)   NULL,
    [situs_address]               VARCHAR (140)   NULL,
    [market_value]                NUMERIC (14)    NULL,
    [rendition_dt]                DATETIME        NULL,
    [rendition_penalty]           NUMERIC (14, 2) NULL,
    [rendition_fraud_penalty]     NUMERIC (14, 2) NULL,
    [geo_id]                      VARCHAR (50)    NULL,
    [ref_id1]                     VARCHAR (50)    NULL,
    [ref_id2]                     VARCHAR (50)    NULL,
    [late_rendition_penalty_flag] BIT             NULL,
    [fraud_penalty_flag]          BIT             NULL,
    CONSTRAINT [CPK_pp_rendition_prop_penalty] PRIMARY KEY CLUSTERED ([rendition_year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[pp_rendition_prop_penalty]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

 
create trigger tr_pp_rendition_prop_penalty_delete_ChangeLog
on pp_rendition_prop_penalty
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
          chg_log_tables = 'pp_rendition_prop_penalty' and
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
 
declare @prop_id int
declare @owner_id int
declare @sup_num int
declare @rendition_year numeric(4,0)
 
declare curRows cursor
for
     select prop_id, owner_id, sup_num, rendition_year from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @owner_id, @sup_num, @rendition_year
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 936, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
 
     fetch next from curRows into @prop_id, @owner_id, @sup_num, @rendition_year
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_pp_rendition_prop_penalty_insert_ChangeLog
on pp_rendition_prop_penalty
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
 
declare @prop_id int
declare @owner_id int
declare @sup_num int
declare @rendition_year numeric(4,0)
declare @owner_name varchar(70)
declare @legal_desc varchar(255)
declare @situs_address varchar(140)
declare @market_value numeric(14,0)
declare @rendition_dt datetime
declare @rendition_penalty numeric(14,2)
declare @rendition_fraud_penalty numeric(14,2)
declare @geo_id varchar(50)
declare @ref_id1 varchar(50)
declare @ref_id2 varchar(50)
declare @late_rendition_penalty_flag bit
declare @fraud_penalty_flag bit
 
declare curRows cursor
for
     select prop_id, owner_id, sup_num, rendition_year, owner_name, legal_desc, situs_address, market_value, rendition_dt, rendition_penalty, rendition_fraud_penalty, geo_id, ref_id1, ref_id2, late_rendition_penalty_flag, fraud_penalty_flag from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @owner_id, @sup_num, @rendition_year, @owner_name, @legal_desc, @situs_address, @market_value, @rendition_dt, @rendition_penalty, @rendition_fraud_penalty, @geo_id, @ref_id1, @ref_id2, @late_rendition_penalty_flag, @fraud_penalty_flag
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 3493, null, convert(varchar(255), @owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'rendition_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 4381, null, convert(varchar(255), @rendition_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'owner_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 3496, null, convert(varchar(255), @owner_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'legal_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 2775, null, convert(varchar(255), @legal_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'situs_address' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 8969, null, convert(varchar(255), @situs_address), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'market_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 3014, null, convert(varchar(255), @market_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'rendition_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 8959, null, convert(varchar(255), @rendition_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'rendition_penalty' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 8961, null, convert(varchar(255), @rendition_penalty), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'rendition_fraud_penalty' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 8960, null, convert(varchar(255), @rendition_fraud_penalty), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'geo_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 2006, null, convert(varchar(255), @geo_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'ref_id1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 4327, null, convert(varchar(255), @ref_id1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'ref_id2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 4328, null, convert(varchar(255), @ref_id2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'late_rendition_penalty_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 9245, null, convert(varchar(255), @late_rendition_penalty_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_rendition_prop_penalty' and
               chg_log_columns = 'fraud_penalty_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 936, 9246, null, convert(varchar(255), @fraud_penalty_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @prop_id, @owner_id, @sup_num, @rendition_year, @owner_name, @legal_desc, @situs_address, @market_value, @rendition_dt, @rendition_penalty, @rendition_fraud_penalty, @geo_id, @ref_id1, @ref_id2, @late_rendition_penalty_flag, @fraud_penalty_flag
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_pp_rendition_prop_penalty_update_ChangeLog
on pp_rendition_prop_penalty
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
 
declare @old_prop_id int
declare @new_prop_id int
declare @old_owner_id int
declare @new_owner_id int
declare @old_sup_num int
declare @new_sup_num int
declare @old_rendition_year numeric(4,0)
declare @new_rendition_year numeric(4,0)
declare @old_owner_name varchar(70)
declare @new_owner_name varchar(70)
declare @old_legal_desc varchar(255)
declare @new_legal_desc varchar(255)
declare @old_situs_address varchar(140)
declare @new_situs_address varchar(140)
declare @old_market_value numeric(14,0)
declare @new_market_value numeric(14,0)
declare @old_rendition_dt datetime
declare @new_rendition_dt datetime
declare @old_rendition_penalty numeric(14,2)
declare @new_rendition_penalty numeric(14,2)
declare @old_rendition_fraud_penalty numeric(14,2)
declare @new_rendition_fraud_penalty numeric(14,2)
declare @old_geo_id varchar(50)
declare @new_geo_id varchar(50)
declare @old_ref_id1 varchar(50)
declare @new_ref_id1 varchar(50)
declare @old_ref_id2 varchar(50)
declare @new_ref_id2 varchar(50)
declare @old_late_rendition_penalty_flag bit
declare @new_late_rendition_penalty_flag bit
declare @old_fraud_penalty_flag bit
declare @new_fraud_penalty_flag bit
 
declare curRows cursor
for
     select d.prop_id, d.owner_id, d.sup_num, d.rendition_year, d.owner_name, d.legal_desc, d.situs_address, d.market_value, d.rendition_dt, d.rendition_penalty, d.rendition_fraud_penalty, d.geo_id, d.ref_id1, d.ref_id2, d.late_rendition_penalty_flag, d.fraud_penalty_flag, i.prop_id, i.owner_id, i.sup_num, i.rendition_year, i.owner_name, i.legal_desc, i.situs_address, i.market_value, i.rendition_dt, i.rendition_penalty, i.rendition_fraud_penalty, i.geo_id, i.ref_id1, i.ref_id2, i.late_rendition_penalty_flag, i.fraud_penalty_flag
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.owner_id = i.owner_id and
     d.sup_num = i.sup_num and
     d.rendition_year = i.rendition_year
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_owner_id, @old_sup_num, @old_rendition_year, @old_owner_name, @old_legal_desc, @old_situs_address, @old_market_value, @old_rendition_dt, @old_rendition_penalty, @old_rendition_fraud_penalty, @old_geo_id, @old_ref_id1, @old_ref_id2, @old_late_rendition_penalty_flag, @old_fraud_penalty_flag, @new_prop_id, @new_owner_id, @new_sup_num, @new_rendition_year, @new_owner_name, @new_legal_desc, @new_situs_address, @new_market_value, @new_rendition_dt, @new_rendition_penalty, @new_rendition_fraud_penalty, @new_geo_id, @new_ref_id1, @new_ref_id2, @new_late_rendition_penalty_flag, @new_fraud_penalty_flag
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_prop_id <> @new_prop_id
          or
          ( @old_prop_id is null and @new_prop_id is not null ) 
          or
          ( @old_prop_id is not null and @new_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_owner_id <> @new_owner_id
          or
          ( @old_owner_id is null and @new_owner_id is not null ) 
          or
          ( @old_owner_id is not null and @new_owner_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 3493, convert(varchar(255), @old_owner_id), convert(varchar(255), @new_owner_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
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
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_rendition_year <> @new_rendition_year
          or
          ( @old_rendition_year is null and @new_rendition_year is not null ) 
          or
          ( @old_rendition_year is not null and @new_rendition_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'rendition_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 4381, convert(varchar(255), @old_rendition_year), convert(varchar(255), @new_rendition_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_owner_name <> @new_owner_name
          or
          ( @old_owner_name is null and @new_owner_name is not null ) 
          or
          ( @old_owner_name is not null and @new_owner_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'owner_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 3496, convert(varchar(255), @old_owner_name), convert(varchar(255), @new_owner_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_legal_desc <> @new_legal_desc
          or
          ( @old_legal_desc is null and @new_legal_desc is not null ) 
          or
          ( @old_legal_desc is not null and @new_legal_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'legal_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 2775, convert(varchar(255), @old_legal_desc), convert(varchar(255), @new_legal_desc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_situs_address <> @new_situs_address
          or
          ( @old_situs_address is null and @new_situs_address is not null ) 
          or
          ( @old_situs_address is not null and @new_situs_address is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'situs_address' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 8969, convert(varchar(255), @old_situs_address), convert(varchar(255), @new_situs_address), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_market_value <> @new_market_value
          or
          ( @old_market_value is null and @new_market_value is not null ) 
          or
          ( @old_market_value is not null and @new_market_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'market_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 3014, convert(varchar(255), @old_market_value), convert(varchar(255), @new_market_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_rendition_dt <> @new_rendition_dt
          or
          ( @old_rendition_dt is null and @new_rendition_dt is not null ) 
          or
          ( @old_rendition_dt is not null and @new_rendition_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'rendition_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 8959, convert(varchar(255), @old_rendition_dt), convert(varchar(255), @new_rendition_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_rendition_penalty <> @new_rendition_penalty
          or
          ( @old_rendition_penalty is null and @new_rendition_penalty is not null ) 
          or
          ( @old_rendition_penalty is not null and @new_rendition_penalty is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'rendition_penalty' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 8961, convert(varchar(255), @old_rendition_penalty), convert(varchar(255), @new_rendition_penalty), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_rendition_fraud_penalty <> @new_rendition_fraud_penalty
          or
          ( @old_rendition_fraud_penalty is null and @new_rendition_fraud_penalty is not null ) 
          or
          ( @old_rendition_fraud_penalty is not null and @new_rendition_fraud_penalty is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'rendition_fraud_penalty' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 8960, convert(varchar(255), @old_rendition_fraud_penalty), convert(varchar(255), @new_rendition_fraud_penalty), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_geo_id <> @new_geo_id
          or
          ( @old_geo_id is null and @new_geo_id is not null ) 
          or
          ( @old_geo_id is not null and @new_geo_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'geo_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 2006, convert(varchar(255), @old_geo_id), convert(varchar(255), @new_geo_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ref_id1 <> @new_ref_id1
          or
          ( @old_ref_id1 is null and @new_ref_id1 is not null ) 
          or
          ( @old_ref_id1 is not null and @new_ref_id1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'ref_id1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 4327, convert(varchar(255), @old_ref_id1), convert(varchar(255), @new_ref_id1), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ref_id2 <> @new_ref_id2
          or
          ( @old_ref_id2 is null and @new_ref_id2 is not null ) 
          or
          ( @old_ref_id2 is not null and @new_ref_id2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'ref_id2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 4328, convert(varchar(255), @old_ref_id2), convert(varchar(255), @new_ref_id2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_late_rendition_penalty_flag <> @new_late_rendition_penalty_flag
          or
          ( @old_late_rendition_penalty_flag is null and @new_late_rendition_penalty_flag is not null ) 
          or
          ( @old_late_rendition_penalty_flag is not null and @new_late_rendition_penalty_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'late_rendition_penalty_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 9245, convert(varchar(255), @old_late_rendition_penalty_flag), convert(varchar(255), @new_late_rendition_penalty_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_fraud_penalty_flag <> @new_fraud_penalty_flag
          or
          ( @old_fraud_penalty_flag is null and @new_fraud_penalty_flag is not null ) 
          or
          ( @old_fraud_penalty_flag is not null and @new_fraud_penalty_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_rendition_prop_penalty' and
                    chg_log_columns = 'fraud_penalty_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 936, 9246, convert(varchar(255), @old_fraud_penalty_flag), convert(varchar(255), @new_fraud_penalty_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_owner_id, @old_sup_num, @old_rendition_year, @old_owner_name, @old_legal_desc, @old_situs_address, @old_market_value, @old_rendition_dt, @old_rendition_penalty, @old_rendition_fraud_penalty, @old_geo_id, @old_ref_id1, @old_ref_id2, @old_late_rendition_penalty_flag, @old_fraud_penalty_flag, @new_prop_id, @new_owner_id, @new_sup_num, @new_rendition_year, @new_owner_name, @new_legal_desc, @new_situs_address, @new_market_value, @new_rendition_dt, @new_rendition_penalty, @new_rendition_fraud_penalty, @new_geo_id, @new_ref_id1, @new_ref_id2, @new_late_rendition_penalty_flag, @new_fraud_penalty_flag
end
 
close curRows
deallocate curRows

GO

