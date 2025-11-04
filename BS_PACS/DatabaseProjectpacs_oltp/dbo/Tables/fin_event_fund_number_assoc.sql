CREATE TABLE [dbo].[fin_event_fund_number_assoc] (
    [fin_account_id]     INT          NOT NULL,
    [event_cd]           VARCHAR (15) NOT NULL,
    [action]             BIT          NOT NULL,
    [event_mapping_id]   INT          NOT NULL,
    [fund_number]        NUMERIC (16) NOT NULL,
    [is_primary_account] BIT          NULL,
    CONSTRAINT [cpk_fin_event_fund_number_assoc] PRIMARY KEY CLUSTERED ([fin_account_id] ASC, [event_mapping_id] ASC, [fund_number] ASC, [action] ASC, [event_cd] ASC)
);


GO

 
create trigger tr_fin_event_fund_number_assoc_update_ChangeLog
on fin_event_fund_number_assoc
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
declare @old_event_cd varchar(15)
declare @new_event_cd varchar(15)
declare @old_action bit
declare @new_action bit
declare @old_event_mapping_id int
declare @new_event_mapping_id int
declare @old_fund_number numeric(16,0)
declare @new_fund_number numeric(16,0)
declare @old_is_primary_account bit
declare @new_is_primary_account bit
 
declare curRows cursor
for
     select d.fin_account_id, d.event_cd, d.action, d.event_mapping_id, d.fund_number, d.is_primary_account, 
            i.fin_account_id, i.event_cd, i.action, i.event_mapping_id, i.fund_number, i.is_primary_account
from deleted as d
join inserted as i on 
     d.fin_account_id = i.fin_account_id and
     d.event_cd = i.event_cd and
     d.action = i.action and
     d.event_mapping_id = i.event_mapping_id and
     d.fund_number = i.fund_number
for read only
 
open curRows
fetch next from curRows into @old_fin_account_id, @old_event_cd, @old_action, @old_event_mapping_id, @old_fund_number, @old_is_primary_account, 
                             @new_fin_account_id, @new_event_cd, @new_action, @new_event_mapping_id, @new_fund_number, @new_is_primary_account
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@old_event_mapping_id as varchar) + '-' + cast(@old_fund_number as varchar) + '-' + @old_event_cd
 
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
                    chg_log_tables = 'fin_event_fund_number_assoc' and
                    chg_log_columns = 'fin_account_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1671, 9483, convert(varchar(255), @old_fin_account_id), convert(varchar(255), @new_fin_account_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @new_event_mapping_id), @new_event_mapping_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @new_fund_number), case when @new_fund_number > @tvar_intMin and @new_fund_number < @tvar_intMax then convert(int, round(@new_fund_number, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_event_cd <> @new_event_cd
          or
          ( @old_event_cd is null and @new_event_cd is not null ) 
          or
          ( @old_event_cd is not null and @new_event_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_fund_number_assoc' and
                    chg_log_columns = 'event_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1671, 1785, convert(varchar(255), @old_event_cd), convert(varchar(255), @new_event_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @new_event_mapping_id), @new_event_mapping_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @new_fund_number), case when @new_fund_number > @tvar_intMin and @new_fund_number < @tvar_intMax then convert(int, round(@new_fund_number, 0, 1)) else 0 end)
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
                    chg_log_tables = 'fin_event_fund_number_assoc' and
                    chg_log_columns = 'action' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1671, 52, convert(varchar(255), @old_action), convert(varchar(255), @new_action), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @new_event_mapping_id), @new_event_mapping_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @new_fund_number), case when @new_fund_number > @tvar_intMin and @new_fund_number < @tvar_intMax then convert(int, round(@new_fund_number, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_event_mapping_id <> @new_event_mapping_id
          or
          ( @old_event_mapping_id is null and @new_event_mapping_id is not null ) 
          or
          ( @old_event_mapping_id is not null and @new_event_mapping_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_fund_number_assoc' and
                    chg_log_columns = 'event_mapping_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1671, 9593, convert(varchar(255), @old_event_mapping_id), convert(varchar(255), @new_event_mapping_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @new_event_mapping_id), @new_event_mapping_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @new_fund_number), case when @new_fund_number > @tvar_intMin and @new_fund_number < @tvar_intMax then convert(int, round(@new_fund_number, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_fund_number <> @new_fund_number
          or
          ( @old_fund_number is null and @new_fund_number is not null ) 
          or
          ( @old_fund_number is not null and @new_fund_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_fund_number_assoc' and
                    chg_log_columns = 'fund_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1671, 9594, convert(varchar(255), @old_fund_number), convert(varchar(255), @new_fund_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @new_event_mapping_id), @new_event_mapping_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @new_fund_number), case when @new_fund_number > @tvar_intMin and @new_fund_number < @tvar_intMax then convert(int, round(@new_fund_number, 0, 1)) else 0 end)
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
                    chg_log_tables = 'fin_event_fund_number_assoc' and
                    chg_log_columns = 'is_primary_account' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1671, 9490, convert(varchar(255), @old_is_primary_account), convert(varchar(255), @new_is_primary_account), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @new_event_mapping_id), @new_event_mapping_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @new_fund_number), case when @new_fund_number > @tvar_intMin and @new_fund_number < @tvar_intMax then convert(int, round(@new_fund_number, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_fin_account_id, @old_event_cd, @old_action, @old_event_mapping_id, @old_fund_number, @old_is_primary_account, 
                                  @new_fin_account_id, @new_event_cd, @new_action, @new_event_mapping_id, @new_fund_number, @new_is_primary_account
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_fin_event_fund_number_assoc_insert_ChangeLog
on fin_event_fund_number_assoc
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
declare @event_cd varchar(15)
declare @action bit
declare @event_mapping_id int
declare @fund_number numeric(16,0)
declare @is_primary_account bit
 
declare curRows cursor
for
     select fin_account_id, event_cd, action, event_mapping_id, fund_number, is_primary_account from inserted
for read only
 
open curRows
fetch next from curRows into @fin_account_id, @event_cd, @action, @event_mapping_id, @fund_number, @is_primary_account
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@event_mapping_id as varchar) + '-' + cast(@fund_number as varchar) + '-' + @event_cd
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_number_assoc' and
               chg_log_columns = 'fin_account_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1671, 9483, null, convert(varchar(255), @fin_account_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @event_mapping_id), @event_mapping_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @fund_number), case when @fund_number > @tvar_intMin and @fund_number < @tvar_intMax then convert(int, round(@fund_number, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_number_assoc' and
               chg_log_columns = 'event_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1671, 1785, null, convert(varchar(255), @event_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @event_mapping_id), @event_mapping_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @fund_number), case when @fund_number > @tvar_intMin and @fund_number < @tvar_intMax then convert(int, round(@fund_number, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_number_assoc' and
               chg_log_columns = 'action' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1671, 52, null, convert(varchar(255), @action), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @event_mapping_id), @event_mapping_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @fund_number), case when @fund_number > @tvar_intMin and @fund_number < @tvar_intMax then convert(int, round(@fund_number, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_number_assoc' and
               chg_log_columns = 'event_mapping_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1671, 9593, null, convert(varchar(255), @event_mapping_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @event_mapping_id), @event_mapping_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @fund_number), case when @fund_number > @tvar_intMin and @fund_number < @tvar_intMax then convert(int, round(@fund_number, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_number_assoc' and
               chg_log_columns = 'fund_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1671, 9594, null, convert(varchar(255), @fund_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @event_mapping_id), @event_mapping_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @fund_number), case when @fund_number > @tvar_intMin and @fund_number < @tvar_intMax then convert(int, round(@fund_number, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_fund_number_assoc' and
               chg_log_columns = 'is_primary_account' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1671, 9490, null, convert(varchar(255), @is_primary_account), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @event_mapping_id), @event_mapping_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @fund_number), case when @fund_number > @tvar_intMin and @fund_number < @tvar_intMax then convert(int, round(@fund_number, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @fin_account_id, @event_cd, @action, @event_mapping_id, @fund_number, @is_primary_account
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_fin_event_fund_number_assoc_delete_ChangeLog
on fin_event_fund_number_assoc
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
          chg_log_tables = 'fin_event_fund_number_assoc' and
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
declare @event_mapping_id int
declare @fund_number numeric(16,0)
 
declare curRows cursor
for
     select fin_account_id, event_cd, action, event_mapping_id, fund_number from deleted
for read only
 
open curRows
fetch next from curRows into @fin_account_id, @event_cd, @action, @event_mapping_id, @fund_number
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@event_mapping_id as varchar) + '-' + cast(@fund_number as varchar) + '-' + @event_cd
     set @tvar_szOldValue = cast(@fin_account_id as varchar)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1671, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9593, convert(varchar(24), @event_mapping_id), @event_mapping_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9594, convert(varchar(24), @fund_number), case when @fund_number > @tvar_intMin and @fund_number < @tvar_intMax then convert(int, round(@fund_number, 0, 1)) else 0 end)
 
     fetch next from curRows into @fin_account_id, @event_cd, @action, @event_mapping_id, @fund_number
end
 
close curRows
deallocate curRows

GO

