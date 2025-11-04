CREATE TABLE [dbo].[fin_event_fund_assoc] (
    [fin_account_id]     INT          NOT NULL,
    [event_cd]           VARCHAR (15) NOT NULL,
    [action]             BIT          NOT NULL,
    [year]               NUMERIC (4)  NOT NULL,
    [tax_district_id]    INT          NOT NULL,
    [levy_cd]            VARCHAR (10) NOT NULL,
    [fund_id]            INT          NOT NULL,
    [is_primary_account] BIT          NULL,
    CONSTRAINT [CPK_fin_event_fund_assoc] PRIMARY KEY CLUSTERED ([fin_account_id] ASC, [event_cd] ASC, [action] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [fund_id] ASC),
    CONSTRAINT [CFK_fin_event_fund_assoc_event_cd] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[fin_event_code] ([event_cd]),
    CONSTRAINT [CFK_fin_event_fund_assoc_fin_account_id] FOREIGN KEY ([fin_account_id]) REFERENCES [dbo].[fin_account] ([fin_account_id])
);


GO

 
create trigger tr_fin_event_fund_assoc_insert_ChangeLog
on fin_event_fund_assoc
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
 
declare @fin_account_id int
declare @event_cd varchar(10)
declare @action bit
declare @year numeric(4,0)
declare @tax_district_id int
declare @levy_cd varchar(10)
declare @fund_id int
declare @is_primary_account bit
 
declare curRows cursor
for
     select fin_account_id, event_cd, action, year, tax_district_id, levy_cd, fund_id, is_primary_account from inserted
for read only
 
open curRows
fetch next from curRows into @fin_account_id, @event_cd, @action, @year, @tax_district_id, @levy_cd, @fund_id, @is_primary_account
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@year as varchar) + '-' + cast(@tax_district_id as varchar) + '-' + @levy_cd + '-' + cast(@fund_id as varchar) + '-' + @event_cd
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_assoc' and
               chg_log_columns = 'fin_account_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1196, 9483, null, convert(varchar(255), @fin_account_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_assoc' and
               chg_log_columns = 'event_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1196, 1785, null, convert(varchar(255), @event_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_assoc' and
               chg_log_columns = 'action' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1196, 52, null, convert(varchar(255), @action), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_assoc' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1196, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_assoc' and
               chg_log_columns = 'tax_district_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1196, 9377, null, convert(varchar(255), @tax_district_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_assoc' and
               chg_log_columns = 'levy_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1196, 9375, null, convert(varchar(255), @levy_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_assoc' and
               chg_log_columns = 'fund_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1196, 9489, null, convert(varchar(255), @fund_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_assoc' and
               chg_log_columns = 'is_primary_account' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1196, 9490, null, convert(varchar(255), @is_primary_account), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
     end
 
     fetch next from curRows into @fin_account_id, @event_cd, @action, @year, @tax_district_id, @levy_cd, @fund_id, @is_primary_account
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_fin_event_fund_assoc_delete_ChangeLog
on fin_event_fund_assoc
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
          chg_log_tables = 'fin_event_fund_assoc' and
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
declare @tvar_szOldValue varchar(255)
set @tvar_szOldValue = 'DELETED'
 
declare @tvar_key_prop_id int
 
declare @fin_account_id int
declare @event_cd varchar(15)
declare @action bit
declare @year numeric(4,0)
declare @tax_district_id int
declare @levy_cd varchar(10)
declare @fund_id int
 
declare curRows cursor
for
     select fin_account_id, event_cd, action, year, tax_district_id, levy_cd, fund_id from deleted
for read only
 
open curRows
fetch next from curRows into @fin_account_id, @event_cd, @action, @year, @tax_district_id, @levy_cd, @fund_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@year as varchar) + '-' + cast(@tax_district_id as varchar) + '-' + @levy_cd + '-' + cast(@fund_id as varchar) + '-' + @event_cd
		set @tvar_szOldValue = cast(@fin_account_id as varchar)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1196, 9483, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @fund_id), @fund_id)
 
     fetch next from curRows into @fin_account_id, @event_cd, @action, @year, @tax_district_id, @levy_cd, @fund_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_fin_event_fund_assoc_update_ChangeLog
on fin_event_fund_assoc
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
 
declare @old_fin_account_id int
declare @new_fin_account_id int
declare @old_event_cd varchar(10)
declare @new_event_cd varchar(10)
declare @old_action bit
declare @new_action bit
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_tax_district_id int
declare @new_tax_district_id int
declare @old_levy_cd varchar(10)
declare @new_levy_cd varchar(10)
declare @old_fund_id int
declare @new_fund_id int
declare @old_is_primary_account bit
declare @new_is_primary_account bit
 
declare curRows cursor
for
     select d.fin_account_id, d.event_cd, d.action, d.year, d.tax_district_id, d.levy_cd, d.fund_id, d.is_primary_account, i.fin_account_id, i.event_cd, i.action, i.year, i.tax_district_id, i.levy_cd, i.fund_id, i.is_primary_account
from deleted as d
join inserted as i on 
     d.event_cd = i.event_cd and
     d.year = i.year and
     d.tax_district_id = i.tax_district_id and
     d.levy_cd = i.levy_cd and
     d.fund_id = i.fund_id
for read only
 
open curRows
fetch next from curRows into @old_fin_account_id, @old_event_cd, @old_action, @old_year, @old_tax_district_id, @old_levy_cd, @old_fund_id, @old_is_primary_account, @new_fin_account_id, @new_event_cd, @new_action, @new_year, @new_tax_district_id, @new_levy_cd, @new_fund_id, @new_is_primary_account
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@old_year as varchar) + '-' + cast(@old_tax_district_id as varchar) + '-' + @old_levy_cd + '-' + cast(@old_fund_id as varchar) + '-' + @old_event_cd
 
     if (
          @old_fin_account_id <> @new_fin_account_id
          or
          ( @old_fin_account_id is null and @new_fin_account_id is not null ) 
          or
          ( @old_fin_account_id is not null and @new_fin_account_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_fund_assoc' and
                    chg_log_columns = 'fin_account_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1196, 9483, convert(varchar(255), @old_fin_account_id), convert(varchar(255), @new_fin_account_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @new_fund_id), @new_fund_id)
          end
     end
 
     if (
          @old_action <> @new_action
          or
          ( @old_action is null and @new_action is not null ) 
          or
          ( @old_action is not null and @new_action is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_fund_assoc' and
                    chg_log_columns = 'action' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1196, 52, convert(varchar(255), @old_action), convert(varchar(255), @new_action), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @new_fund_id), @new_fund_id)
          end
     end
 
     if (
          @old_is_primary_account <> @new_is_primary_account
          or
          ( @old_is_primary_account is null and @new_is_primary_account is not null ) 
          or
          ( @old_is_primary_account is not null and @new_is_primary_account is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_fund_assoc' and
                    chg_log_columns = 'is_primary_account' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1196, 9490, convert(varchar(255), @old_is_primary_account), convert(varchar(255), @new_is_primary_account), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9489, convert(varchar(24), @new_fund_id), @new_fund_id)
          end
     end
 
     fetch next from curRows into @old_fin_account_id, @old_event_cd, @old_action, @old_year, @old_tax_district_id, @old_levy_cd, @old_fund_id, @old_is_primary_account, @new_fin_account_id, @new_event_cd, @new_action, @new_year, @new_tax_district_id, @new_levy_cd, @new_fund_id, @new_is_primary_account
end
 
close curRows
deallocate curRows

GO

