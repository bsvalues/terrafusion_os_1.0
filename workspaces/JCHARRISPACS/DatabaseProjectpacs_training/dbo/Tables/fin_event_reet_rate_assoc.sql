CREATE TABLE [dbo].[fin_event_reet_rate_assoc] (
    [reet_rate_id]     INT          NOT NULL,
    [tax_district_id]  INT          NOT NULL,
    [uga_indicator_cd] VARCHAR (10) NOT NULL,
    [fin_account_id]   INT          NOT NULL,
    [event_cd]         VARCHAR (15) NOT NULL,
    [action]           BIT          NOT NULL,
    [description]      VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_fin_event_reet_rate_assoc] PRIMARY KEY CLUSTERED ([reet_rate_id] ASC, [tax_district_id] ASC, [uga_indicator_cd] ASC, [description] ASC, [fin_account_id] ASC, [event_cd] ASC, [action] ASC),
    CONSTRAINT [CFK_fin_event_reet_rate_assoc_description] FOREIGN KEY ([description]) REFERENCES [dbo].[fin_reet_rate_description] ([description_cd]),
    CONSTRAINT [CFK_fin_event_reet_rate_assoc_event_cd] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[fin_event_code] ([event_cd]),
    CONSTRAINT [CFK_fin_event_reet_rate_assoc_fin_account_id] FOREIGN KEY ([fin_account_id]) REFERENCES [dbo].[fin_account] ([fin_account_id]),
    CONSTRAINT [CFK_fin_event_reet_rate_assoc_reet_rate_id_tax_district_id_uga_indicator_cd_description] FOREIGN KEY ([reet_rate_id], [tax_district_id], [uga_indicator_cd], [description], [event_cd]) REFERENCES [dbo].[reet_rate_uga_desc_assoc] ([reet_rate_id], [tax_district_id], [uga_indicator_cd], [description], [event_cd])
);


GO

 
create trigger tr_fin_event_reet_rate_assoc_insert_ChangeLog
on fin_event_reet_rate_assoc
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
 
declare @reet_rate_id int
declare @tax_district_id int
declare @uga_indicator_cd varchar(10)
declare @fin_account_id int
declare @event_cd varchar(10)
declare @action bit
declare @description varchar(50)
 
declare curRows cursor
for
     select reet_rate_id, tax_district_id, uga_indicator_cd, fin_account_id, event_cd, action, description from inserted
for read only
 
open curRows
fetch next from curRows into @reet_rate_id, @tax_district_id, @uga_indicator_cd, @fin_account_id, @event_cd, @action, @description
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@reet_rate_id as varchar) + '-' + cast(@tax_district_id as varchar) + '-' + @uga_indicator_cd + '-' + @description + '-' + @event_cd
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_reet_rate_assoc' and
               chg_log_columns = 'reet_rate_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1202, 9485, null, convert(varchar(255), @reet_rate_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @reet_rate_id), @reet_rate_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @uga_indicator_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @description), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_reet_rate_assoc' and
               chg_log_columns = 'tax_district_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1202, 9377, null, convert(varchar(255), @tax_district_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @reet_rate_id), @reet_rate_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @uga_indicator_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @description), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_reet_rate_assoc' and
               chg_log_columns = 'uga_indicator_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1202, 9484, null, convert(varchar(255), @uga_indicator_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @reet_rate_id), @reet_rate_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @uga_indicator_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @description), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_reet_rate_assoc' and
               chg_log_columns = 'fin_account_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1202, 9483, null, convert(varchar(255), @fin_account_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @reet_rate_id), @reet_rate_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @uga_indicator_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @description), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_reet_rate_assoc' and
               chg_log_columns = 'event_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1202, 1785, null, convert(varchar(255), @event_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @reet_rate_id), @reet_rate_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @uga_indicator_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @description), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_reet_rate_assoc' and
               chg_log_columns = 'action' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1202, 52, null, convert(varchar(255), @action), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @reet_rate_id), @reet_rate_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @uga_indicator_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @description), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_reet_rate_assoc' and
               chg_log_columns = 'description' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1202, 1318, null, convert(varchar(255), @description), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @reet_rate_id), @reet_rate_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @uga_indicator_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @description), 0)
     end
 
     fetch next from curRows into @reet_rate_id, @tax_district_id, @uga_indicator_cd, @fin_account_id, @event_cd, @action, @description
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_fin_event_reet_rate_assoc_update_ChangeLog
on fin_event_reet_rate_assoc
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
 
declare @old_reet_rate_id int
declare @new_reet_rate_id int
declare @old_tax_district_id int
declare @new_tax_district_id int
declare @old_uga_indicator_cd varchar(10)
declare @new_uga_indicator_cd varchar(10)
declare @old_fin_account_id int
declare @new_fin_account_id int
declare @old_event_cd varchar(10)
declare @new_event_cd varchar(10)
declare @old_action bit
declare @new_action bit
declare @old_description varchar(50)
declare @new_description varchar(50)
 
declare curRows cursor
for
     select d.reet_rate_id, d.tax_district_id, d.uga_indicator_cd, d.fin_account_id, d.event_cd, d.action, d.description, i.reet_rate_id, i.tax_district_id, i.uga_indicator_cd, i.fin_account_id, i.event_cd, i.action, i.description
from deleted as d
join inserted as i on 
     d.reet_rate_id = i.reet_rate_id and
     d.tax_district_id = i.tax_district_id and
     d.uga_indicator_cd = i.uga_indicator_cd and
     d.fin_account_id = i.fin_account_id and
     d.event_cd = i.event_cd and
     d.action = i.action and
     d.description = i.description
for read only
 
open curRows
fetch next from curRows into @old_reet_rate_id, @old_tax_district_id, @old_uga_indicator_cd, @old_fin_account_id, @old_event_cd, @old_action, @old_description, @new_reet_rate_id, @new_tax_district_id, @new_uga_indicator_cd, @new_fin_account_id, @new_event_cd, @new_action, @new_description
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@old_reet_rate_id as varchar) + '-' + cast(@old_tax_district_id as varchar) + '-' + @old_uga_indicator_cd + '-' + @old_description + '-' + @old_event_cd
 
     if (
          @old_reet_rate_id <> @new_reet_rate_id
          or
          ( @old_reet_rate_id is null and @new_reet_rate_id is not null ) 
          or
          ( @old_reet_rate_id is not null and @new_reet_rate_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_reet_rate_assoc' and
                    chg_log_columns = 'reet_rate_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1202, 9485, convert(varchar(255), @old_reet_rate_id), convert(varchar(255), @new_reet_rate_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @new_reet_rate_id), @new_reet_rate_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @new_uga_indicator_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @new_description), 0)
          end
     end
 
     if (
          @old_tax_district_id <> @new_tax_district_id
          or
          ( @old_tax_district_id is null and @new_tax_district_id is not null ) 
          or
          ( @old_tax_district_id is not null and @new_tax_district_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_reet_rate_assoc' and
                    chg_log_columns = 'tax_district_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1202, 9377, convert(varchar(255), @old_tax_district_id), convert(varchar(255), @new_tax_district_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @new_reet_rate_id), @new_reet_rate_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @new_uga_indicator_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @new_description), 0)
          end
     end
 
     if (
          @old_uga_indicator_cd <> @new_uga_indicator_cd
          or
          ( @old_uga_indicator_cd is null and @new_uga_indicator_cd is not null ) 
          or
          ( @old_uga_indicator_cd is not null and @new_uga_indicator_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_reet_rate_assoc' and
                    chg_log_columns = 'uga_indicator_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1202, 9484, convert(varchar(255), @old_uga_indicator_cd), convert(varchar(255), @new_uga_indicator_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @new_reet_rate_id), @new_reet_rate_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @new_uga_indicator_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @new_description), 0)
          end
     end
 
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
                    chg_log_tables = 'fin_event_reet_rate_assoc' and
                    chg_log_columns = 'fin_account_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1202, 9483, convert(varchar(255), @old_fin_account_id), convert(varchar(255), @new_fin_account_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @new_reet_rate_id), @new_reet_rate_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @new_uga_indicator_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @new_description), 0)
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
                    chg_log_tables = 'fin_event_reet_rate_assoc' and
                    chg_log_columns = 'event_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1202, 1785, convert(varchar(255), @old_event_cd), convert(varchar(255), @new_event_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @new_reet_rate_id), @new_reet_rate_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @new_uga_indicator_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @new_description), 0)
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
                    chg_log_tables = 'fin_event_reet_rate_assoc' and
                    chg_log_columns = 'action' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1202, 52, convert(varchar(255), @old_action), convert(varchar(255), @new_action), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @new_reet_rate_id), @new_reet_rate_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @new_uga_indicator_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @new_description), 0)
          end
     end
 
     if (
          @old_description <> @new_description
          or
          ( @old_description is null and @new_description is not null ) 
          or
          ( @old_description is not null and @new_description is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_reet_rate_assoc' and
                    chg_log_columns = 'description' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1202, 1318, convert(varchar(255), @old_description), convert(varchar(255), @new_description), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @new_reet_rate_id), @new_reet_rate_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @new_uga_indicator_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @new_description), 0)
          end
     end
 
     fetch next from curRows into @old_reet_rate_id, @old_tax_district_id, @old_uga_indicator_cd, @old_fin_account_id, @old_event_cd, @old_action, @old_description, @new_reet_rate_id, @new_tax_district_id, @new_uga_indicator_cd, @new_fin_account_id, @new_event_cd, @new_action, @new_description
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_fin_event_reet_rate_assoc_delete_ChangeLog
on fin_event_reet_rate_assoc
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
          chg_log_tables = 'fin_event_reet_rate_assoc' and
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
 
declare @reet_rate_id int
declare @tax_district_id int
declare @uga_indicator_cd varchar(10)
declare @fin_account_id int
declare @event_cd varchar(15)
declare @action bit
declare @description varchar(50)
 
declare curRows cursor
for
     select reet_rate_id, tax_district_id, uga_indicator_cd, fin_account_id, event_cd, action, description from deleted
for read only
 
open curRows
fetch next from curRows into @reet_rate_id, @tax_district_id, @uga_indicator_cd, @fin_account_id, @event_cd, @action, @description
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@reet_rate_id as varchar) + '-' + cast(@tax_district_id as varchar) + '-' + @uga_indicator_cd + '-' + @description + '-' + @event_cd
		set @tvar_szOldValue = cast(@fin_account_id as varchar)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1202, 9483, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9485, convert(varchar(24), @reet_rate_id), @reet_rate_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9484, convert(varchar(24), @uga_indicator_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1318, convert(varchar(24), @description), 0)
 
     fetch next from curRows into @reet_rate_id, @tax_district_id, @uga_indicator_cd, @fin_account_id, @event_cd, @action, @description
end
 
close curRows
deallocate curRows

GO

