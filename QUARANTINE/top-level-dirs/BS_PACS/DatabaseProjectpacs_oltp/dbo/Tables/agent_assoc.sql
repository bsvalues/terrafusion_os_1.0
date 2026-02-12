CREATE TABLE [dbo].[agent_assoc] (
    [owner_tax_yr]      NUMERIC (4)   NOT NULL,
    [agent_id]          INT           NOT NULL,
    [arb_mailings]      CHAR (1)      NULL,
    [prop_id]           INT           NOT NULL,
    [ca_mailings]       CHAR (1)      NULL,
    [owner_id]          INT           NOT NULL,
    [expired_dt_tm]     DATETIME      NULL,
    [ent_mailings]      CHAR (1)      NULL,
    [appl_dt]           DATETIME      NULL,
    [eff_dt]            DATETIME      NULL,
    [exp_dt]            DATETIME      NULL,
    [agent_cmnt]        VARCHAR (255) NULL,
    [purge_dt]          DATETIME      NULL,
    [auth_to_protest]   CHAR (1)      NULL,
    [auth_to_resolve]   CHAR (1)      NULL,
    [auth_confidential] CHAR (1)      NULL,
    [auth_other]        CHAR (1)      NULL,
    CONSTRAINT [CPK_agent_assoc] PRIMARY KEY CLUSTERED ([owner_tax_yr] ASC, [prop_id] ASC, [owner_id] ASC, [agent_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_agent_assoc_agent_id] FOREIGN KEY ([agent_id]) REFERENCES [dbo].[agent] ([agent_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[agent_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_agent_id]
    ON [dbo].[agent_assoc]([agent_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_agent_assoc_update_ChangeLog
on agent_assoc
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
 
declare @old_owner_tax_yr numeric(4,0)
declare @new_owner_tax_yr numeric(4,0)
declare @old_agent_id int
declare @new_agent_id int
declare @old_arb_mailings char(1)
declare @new_arb_mailings char(1)
declare @old_prop_id int
declare @new_prop_id int
declare @old_ca_mailings char(1)
declare @new_ca_mailings char(1)
declare @old_owner_id int
declare @new_owner_id int
declare @old_expired_dt_tm datetime
declare @new_expired_dt_tm datetime
declare @old_ent_mailings char(1)
declare @new_ent_mailings char(1)
declare @old_appl_dt datetime
declare @new_appl_dt datetime
declare @old_eff_dt datetime
declare @new_eff_dt datetime
declare @old_exp_dt datetime
declare @new_exp_dt datetime
declare @old_agent_cmnt varchar(255)
declare @new_agent_cmnt varchar(255)
declare @old_purge_dt datetime
declare @new_purge_dt datetime
declare @old_auth_to_protest char(1)
declare @new_auth_to_protest char(1)
declare @old_auth_to_resolve char(1)
declare @new_auth_to_resolve char(1)
declare @old_auth_confidential char(1)
declare @new_auth_confidential char(1)
declare @old_auth_other char(1)
declare @new_auth_other char(1)
 
declare curRows cursor
for
     select case d.owner_tax_yr when 0 then @tvar_lFutureYear else d.owner_tax_yr end, d.agent_id, d.arb_mailings, d.prop_id, d.ca_mailings, d.owner_id, d.expired_dt_tm, d.ent_mailings, d.appl_dt, d.eff_dt, d.exp_dt, d.agent_cmnt, d.purge_dt, d.auth_to_protest, d.auth_to_resolve, d.auth_confidential, d.auth_other, case i.owner_tax_yr when 0 then @tvar_lFutureYear else i.owner_tax_yr end, i.agent_id, i.arb_mailings, i.prop_id, i.ca_mailings, i.owner_id, i.expired_dt_tm, i.ent_mailings, i.appl_dt, i.eff_dt, i.exp_dt, i.agent_cmnt, i.purge_dt, i.auth_to_protest, i.auth_to_resolve, i.auth_confidential, i.auth_other
from deleted as d
join inserted as i on 
     d.owner_tax_yr = i.owner_tax_yr and
     d.agent_id = i.agent_id and
     d.prop_id = i.prop_id and
     d.owner_id = i.owner_id
for read only
 
open curRows
fetch next from curRows into @old_owner_tax_yr, @old_agent_id, @old_arb_mailings, @old_prop_id, @old_ca_mailings, @old_owner_id, @old_expired_dt_tm, @old_ent_mailings, @old_appl_dt, @old_eff_dt, @old_exp_dt, @old_agent_cmnt, @old_purge_dt, @old_auth_to_protest, @old_auth_to_resolve, @old_auth_confidential, @old_auth_other, @new_owner_tax_yr, @new_agent_id, @new_arb_mailings, @new_prop_id, @new_ca_mailings, @new_owner_id, @new_expired_dt_tm, @new_ent_mailings, @new_appl_dt, @new_eff_dt, @new_exp_dt, @new_agent_cmnt, @new_purge_dt, @new_auth_to_protest, @new_auth_to_resolve, @new_auth_confidential, @new_auth_other
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Agent: ' + a_account.file_as_name + ' Owner: ' + o_account.file_as_name
     from account as a_account with(nolock)
     join account as o_account with(nolock) on o_account.acct_id = @new_owner_id
     where a_account.acct_id = @new_agent_id
 
     if (
          @old_owner_tax_yr <> @new_owner_tax_yr
          or
          ( @old_owner_tax_yr is null and @new_owner_tax_yr is not null ) 
          or
          ( @old_owner_tax_yr is not null and @new_owner_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'owner_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 3505, convert(varchar(255), @old_owner_tax_yr), convert(varchar(255), @new_owner_tax_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_agent_id <> @new_agent_id
          or
          ( @old_agent_id is null and @new_agent_id is not null ) 
          or
          ( @old_agent_id is not null and @new_agent_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'agent_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 160, convert(varchar(255), @old_agent_id), convert(varchar(255), @new_agent_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_arb_mailings <> @new_arb_mailings
          or
          ( @old_arb_mailings is null and @new_arb_mailings is not null ) 
          or
          ( @old_arb_mailings is not null and @new_arb_mailings is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'arb_mailings' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 305, convert(varchar(255), @old_arb_mailings), convert(varchar(255), @new_arb_mailings) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
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
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_ca_mailings <> @new_ca_mailings
          or
          ( @old_ca_mailings is null and @new_ca_mailings is not null ) 
          or
          ( @old_ca_mailings is not null and @new_ca_mailings is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'ca_mailings' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 580, convert(varchar(255), @old_ca_mailings), convert(varchar(255), @new_ca_mailings) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
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
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 3493, convert(varchar(255), @old_owner_id), convert(varchar(255), @new_owner_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_expired_dt_tm <> @new_expired_dt_tm
          or
          ( @old_expired_dt_tm is null and @new_expired_dt_tm is not null ) 
          or
          ( @old_expired_dt_tm is not null and @new_expired_dt_tm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'expired_dt_tm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 1843, convert(varchar(255), @old_expired_dt_tm), convert(varchar(255), @new_expired_dt_tm) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_ent_mailings <> @new_ent_mailings
          or
          ( @old_ent_mailings is null and @new_ent_mailings is not null ) 
          or
          ( @old_ent_mailings is not null and @new_ent_mailings is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'ent_mailings' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 1453, convert(varchar(255), @old_ent_mailings), convert(varchar(255), @new_ent_mailings) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_appl_dt <> @new_appl_dt
          or
          ( @old_appl_dt is null and @new_appl_dt is not null ) 
          or
          ( @old_appl_dt is not null and @new_appl_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'appl_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 219, convert(varchar(255), @old_appl_dt), convert(varchar(255), @new_appl_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_eff_dt <> @new_eff_dt
          or
          ( @old_eff_dt is null and @new_eff_dt is not null ) 
          or
          ( @old_eff_dt is not null and @new_eff_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'eff_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 1416, convert(varchar(255), @old_eff_dt), convert(varchar(255), @new_eff_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_exp_dt <> @new_exp_dt
          or
          ( @old_exp_dt is null and @new_exp_dt is not null ) 
          or
          ( @old_exp_dt is not null and @new_exp_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'exp_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 1838, convert(varchar(255), @old_exp_dt), convert(varchar(255), @new_exp_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_agent_cmnt <> @new_agent_cmnt
          or
          ( @old_agent_cmnt is null and @new_agent_cmnt is not null ) 
          or
          ( @old_agent_cmnt is not null and @new_agent_cmnt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'agent_cmnt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 158, convert(varchar(255), @old_agent_cmnt), convert(varchar(255), @new_agent_cmnt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_purge_dt <> @new_purge_dt
          or
          ( @old_purge_dt is null and @new_purge_dt is not null ) 
          or
          ( @old_purge_dt is not null and @new_purge_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'purge_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 4186, convert(varchar(255), @old_purge_dt), convert(varchar(255), @new_purge_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_auth_to_protest <> @new_auth_to_protest
          or
          ( @old_auth_to_protest is null and @new_auth_to_protest is not null ) 
          or
          ( @old_auth_to_protest is not null and @new_auth_to_protest is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'auth_to_protest' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 380, convert(varchar(255), @old_auth_to_protest), convert(varchar(255), @new_auth_to_protest) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_auth_to_resolve <> @new_auth_to_resolve
          or
          ( @old_auth_to_resolve is null and @new_auth_to_resolve is not null ) 
          or
          ( @old_auth_to_resolve is not null and @new_auth_to_resolve is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'auth_to_resolve' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 381, convert(varchar(255), @old_auth_to_resolve), convert(varchar(255), @new_auth_to_resolve) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_auth_confidential <> @new_auth_confidential
          or
          ( @old_auth_confidential is null and @new_auth_confidential is not null ) 
          or
          ( @old_auth_confidential is not null and @new_auth_confidential is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'auth_confidential' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 378, convert(varchar(255), @old_auth_confidential), convert(varchar(255), @new_auth_confidential) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     if (
          @old_auth_other <> @new_auth_other
          or
          ( @old_auth_other is null and @new_auth_other is not null ) 
          or
          ( @old_auth_other is not null and @new_auth_other is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent_assoc' and
                    chg_log_columns = 'auth_other' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 73, 379, convert(varchar(255), @old_auth_other), convert(varchar(255), @new_auth_other) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
          end
     end
 
     fetch next from curRows into @old_owner_tax_yr, @old_agent_id, @old_arb_mailings, @old_prop_id, @old_ca_mailings, @old_owner_id, @old_expired_dt_tm, @old_ent_mailings, @old_appl_dt, @old_eff_dt, @old_exp_dt, @old_agent_cmnt, @old_purge_dt, @old_auth_to_protest, @old_auth_to_resolve, @old_auth_confidential, @old_auth_other, @new_owner_tax_yr, @new_agent_id, @new_arb_mailings, @new_prop_id, @new_ca_mailings, @new_owner_id, @new_expired_dt_tm, @new_ent_mailings, @new_appl_dt, @new_eff_dt, @new_exp_dt, @new_agent_cmnt, @new_purge_dt, @new_auth_to_protest, @new_auth_to_resolve, @new_auth_confidential, @new_auth_other
end
 
close curRows
deallocate curRows

GO


create trigger tr_agent_assoc_update
on agent_assoc
for update
not for replication

as

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'agent_assoc'
if ( @lTriggerEnable = 0 )
begin
	return
end

set nocount on

	update property_val set agent_update_dt = GetDate()
	from inserted, deleted
	where property_val.prop_id = inserted.prop_id
	and   property_val.prop_val_yr = inserted.owner_tax_yr
	and   inserted.prop_id = deleted.prop_id
	and   inserted.owner_tax_yr = deleted.owner_tax_yr
	and   inserted.owner_id     = deleted.owner_id
	and   IsNull(inserted.ent_mailings, '') <> IsNull(deleted.ent_mailings, '')
	and   inserted.ent_mailings = 'T'

	update property set col_agent_id=aa.agent_id, col_agent_update_dt=GetDate()
	from agent_assoc as aa
	
	inner join
	(
		select prop_id,agent_id,max(owner_tax_yr) as owner_tax_yr 
		from agent_assoc as o
		group by prop_id,agent_id
	) as maxyr on
			aa.prop_id=maxyr.prop_id
	and aa.agent_id=aa.agent_id
	and aa.owner_tax_yr=aa.owner_tax_yr

	inner join inserted as i on
			aa.agent_id=i.agent_id	
	and aa.prop_id=i.prop_id

	where aa.prop_id=property.prop_id 
	and isnull(property.col_agent_id, 0) <> i.agent_id
	and   i.ent_mailings = 'T' 
	-- and col_agent_override=0
	-- Jeremy Wilson 34889 changes
	-- Appraisal always overrides col_agent_id if this flag is true
	-- regardless of col_agent_override

set nocount off

GO



create trigger tr_agent_assoc_delete
on agent_assoc
for delete
not for replication

as

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'agent_assoc'
if ( @lTriggerEnable = 0 )
begin
	return
end

set nocount on

	update property_val set agent_update_dt = GetDate()
	from deleted
	where property_val.prop_id = deleted.prop_id
	and   property_val.prop_val_yr = deleted.owner_tax_yr
	and   deleted.ent_mailings = 'T'

	-- Jeremy Wilson 34889 changes
	-- Appraisal always changes col_agent_id only if the ent_mailings 
	-- flag is true regardless of col_agent_override
	-- if another agent exists on the property with the ent_mailings flag, 
	-- set col_agent_id to that agent, otherwise NULL the field
	declare @NextColAgentId int
	
	select @NextColAgentId = agent_assoc.agent_id 
	from agent_assoc 
	inner join deleted
		on agent_assoc.prop_id = deleted.prop_id
	where agent_assoc.eff_dt <= getdate() 
	and agent_assoc.exp_dt is null
	and agent_assoc.ent_mailings = 'T'

	update property
	set col_agent_id = @NextColAgentId, col_agent_update_dt=GetDate()
	from property
	inner join deleted as d
		on property.prop_id = d.prop_id
		and d.ent_mailings = 'T'

set nocount off

GO


create trigger tr_agent_assoc_insert
on agent_assoc
for insert
not for replication

as

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'agent_assoc'
if ( @lTriggerEnable = 0 )
begin
	return
end

set nocount on

	update property_val set agent_update_dt = GetDate()
	from inserted
	where property_val.prop_id = inserted.prop_id
	and   property_val.prop_val_yr = inserted.owner_tax_yr
	and   inserted.ent_mailings = 'T'

	update property set col_agent_id=aa.agent_id, col_agent_update_dt=GetDate()
	from agent_assoc as aa
	
	inner join
	(
		select prop_id,agent_id,max(owner_tax_yr) as owner_tax_yr 
		from agent_assoc as o
		group by prop_id,agent_id
	) as maxyr on
			aa.prop_id=maxyr.prop_id
	and aa.agent_id=aa.agent_id
	and aa.owner_tax_yr=aa.owner_tax_yr

	inner join inserted as i on
			aa.agent_id=i.agent_id	
	and aa.prop_id=i.prop_id

	where aa.prop_id=property.prop_id 
	and isnull(property.col_agent_id,0) <> i.agent_id
	and   i.ent_mailings = 'T'
	-- and col_agent_override=0 
	-- Jeremy Wilson 34889 changes
	-- Appraisal always overrides col_agent_id if this flag is true
	-- regardless of col_agent_override

	update autopay_enrollment set ownership_transfer_incomplete = 1
	from inserted
	where autopay_enrollment.prop_id = inserted.prop_id

set nocount off

GO



create trigger tr_agent_assoc_insert_ChangeLog
on agent_assoc
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
 
declare @owner_tax_yr numeric(4,0)
declare @agent_id int
declare @arb_mailings char(1)
declare @prop_id int
declare @ca_mailings char(1)
declare @owner_id int
declare @expired_dt_tm datetime
declare @ent_mailings char(1)
declare @appl_dt datetime
declare @eff_dt datetime
declare @exp_dt datetime
declare @agent_cmnt varchar(255)
declare @purge_dt datetime
declare @auth_to_protest char(1)
declare @auth_to_resolve char(1)
declare @auth_confidential char(1)
declare @auth_other char(1)
 
declare curRows cursor
for
     select case owner_tax_yr when 0 then @tvar_lFutureYear else owner_tax_yr end, agent_id, arb_mailings, prop_id, ca_mailings, owner_id, expired_dt_tm, ent_mailings, appl_dt, eff_dt, exp_dt, agent_cmnt, purge_dt, auth_to_protest, auth_to_resolve, auth_confidential, auth_other from inserted
for read only
 
open curRows
fetch next from curRows into @owner_tax_yr, @agent_id, @arb_mailings, @prop_id, @ca_mailings, @owner_id, @expired_dt_tm, @ent_mailings, @appl_dt, @eff_dt, @exp_dt, @agent_cmnt, @purge_dt, @auth_to_protest, @auth_to_resolve, @auth_confidential, @auth_other
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Agent: ' + a_account.file_as_name + ' Owner: ' + o_account.file_as_name
     from account as a_account with(nolock)
     join account as o_account with(nolock) on o_account.acct_id = @owner_id
     where a_account.acct_id = @agent_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'owner_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 3505, null, convert(varchar(255), @owner_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'agent_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 160, null, convert(varchar(255), @agent_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'arb_mailings' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 305, null, convert(varchar(255), @arb_mailings), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'ca_mailings' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 580, null, convert(varchar(255), @ca_mailings), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 3493, null, convert(varchar(255), @owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'expired_dt_tm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 1843, null, convert(varchar(255), @expired_dt_tm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'ent_mailings' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 1453, null, convert(varchar(255), @ent_mailings), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'appl_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 219, null, convert(varchar(255), @appl_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'eff_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 1416, null, convert(varchar(255), @eff_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'exp_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 1838, null, convert(varchar(255), @exp_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'agent_cmnt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 158, null, convert(varchar(255), @agent_cmnt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'purge_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 4186, null, convert(varchar(255), @purge_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'auth_to_protest' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 380, null, convert(varchar(255), @auth_to_protest), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'auth_to_resolve' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 381, null, convert(varchar(255), @auth_to_resolve), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'auth_confidential' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 378, null, convert(varchar(255), @auth_confidential), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent_assoc' and
               chg_log_columns = 'auth_other' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 73, 379, null, convert(varchar(255), @auth_other), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     end
 
     fetch next from curRows into @owner_tax_yr, @agent_id, @arb_mailings, @prop_id, @ca_mailings, @owner_id, @expired_dt_tm, @ent_mailings, @appl_dt, @eff_dt, @exp_dt, @agent_cmnt, @purge_dt, @auth_to_protest, @auth_to_resolve, @auth_confidential, @auth_other
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_agent_assoc_delete_ChangeLog
on agent_assoc
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
          chg_log_tables = 'agent_assoc' and
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
 
declare @owner_tax_yr numeric(4,0)
declare @agent_id int
declare @prop_id int
declare @owner_id int
 
declare curRows cursor
for
     select case owner_tax_yr when 0 then @tvar_lFutureYear else owner_tax_yr end, agent_id, prop_id, owner_id from deleted
for read only
 
open curRows
fetch next from curRows into @owner_tax_yr, @agent_id, @prop_id, @owner_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Agent: ' + a_account.file_as_name + ' Owner: ' + o_account.file_as_name
     from account as a_account with(nolock)
     join account as o_account with(nolock) on o_account.acct_id = @owner_id
     where a_account.acct_id = @agent_id
     set @tvar_szOldValue = cast(@agent_id as varchar)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 73, 160, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
 
     fetch next from curRows into @owner_tax_yr, @agent_id, @prop_id, @owner_id
end
 
close curRows
deallocate curRows

GO

