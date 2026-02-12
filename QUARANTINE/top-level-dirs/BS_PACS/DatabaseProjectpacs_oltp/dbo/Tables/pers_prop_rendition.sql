CREATE TABLE [dbo].[pers_prop_rendition] (
    [prop_id]         INT           NOT NULL,
    [rendition_year]  NUMERIC (4)   NOT NULL,
    [rendition_date]  DATETIME      NULL,
    [signed_by]       VARCHAR (50)  NULL,
    [notary_flag]     CHAR (1)      NULL,
    [notary]          VARCHAR (50)  NULL,
    [comment]         VARCHAR (255) NULL,
    [verified_flag]   CHAR (1)      NULL,
    [pacs_user_id]    INT           NULL,
    [value_flag]      CHAR (1)      NULL,
    [rendition_value] NUMERIC (14)  NULL,
    [active_flag]     CHAR (1)      NULL,
    [filing_status]   VARCHAR (25)  NULL,
    CONSTRAINT [CPK_pers_prop_rendition] PRIMARY KEY CLUSTERED ([prop_id] ASC, [rendition_year] ASC) WITH (FILLFACTOR = 80),
    CONSTRAINT [CFK_pers_prop_rendition_filing_status] FOREIGN KEY ([filing_status]) REFERENCES [dbo].[pp_rendition_filing_status] ([code])
);


GO

 
create trigger tr_pers_prop_rendition_insert_ChangeLog
on pers_prop_rendition
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
declare @rendition_year numeric(4,0)
declare @rendition_date datetime
declare @signed_by varchar(50)
declare @notary_flag char(1)
declare @notary varchar(50)
declare @comment varchar(255)
declare @verified_flag char(1)
declare @pacs_user_id int
declare @value_flag char(1)
declare @rendition_value numeric(14,0)
declare @active_flag char(1)
declare @filing_status varchar(25)
 
declare curRows cursor
for
     select prop_id, rendition_year, rendition_date, signed_by, notary_flag, notary, comment, verified_flag, pacs_user_id, value_flag, rendition_value, active_flag, filing_status from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @rendition_year, @rendition_date, @signed_by, @notary_flag, @notary, @comment, @verified_flag, @pacs_user_id, @value_flag, @rendition_value, @active_flag, @filing_status
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @rendition_year)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'rendition_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 4381, null, convert(varchar(255), @rendition_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'rendition_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 4378, null, convert(varchar(255), @rendition_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'signed_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 4736, null, convert(varchar(255), @signed_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'notary_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 3338, null, convert(varchar(255), @notary_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'notary' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 3337, null, convert(varchar(255), @notary), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 827, null, convert(varchar(255), @comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'verified_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 5502, null, convert(varchar(255), @verified_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'pacs_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 3525, null, convert(varchar(255), @pacs_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'value_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 5486, null, convert(varchar(255), @value_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'rendition_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 4380, null, convert(varchar(255), @rendition_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'active_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 55, null, convert(varchar(255), @active_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pers_prop_rendition' and
               chg_log_columns = 'filing_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 587, 9882, null, convert(varchar(255), @filing_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @prop_id, @rendition_year, @rendition_date, @signed_by, @notary_flag, @notary, @comment, @verified_flag, @pacs_user_id, @value_flag, @rendition_value, @active_flag, @filing_status
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_pers_prop_rendition_delete_ChangeLog
on pers_prop_rendition
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
          chg_log_tables = 'pers_prop_rendition' and
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
 
declare @prop_id int
declare @rendition_year numeric(4,0)
 
declare curRows cursor
for
     select prop_id, rendition_year from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @rendition_year
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @rendition_year)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 587, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @rendition_year), case when @rendition_year > @tvar_intMin and @rendition_year < @tvar_intMax then convert(int, round(@rendition_year, 0, 1)) else 0 end)
 
     fetch next from curRows into @prop_id, @rendition_year
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_pers_prop_rendition_update_ChangeLog
on pers_prop_rendition
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
declare @old_rendition_year numeric(4,0)
declare @new_rendition_year numeric(4,0)
declare @old_rendition_date datetime
declare @new_rendition_date datetime
declare @old_signed_by varchar(50)
declare @new_signed_by varchar(50)
declare @old_notary_flag char(1)
declare @new_notary_flag char(1)
declare @old_notary varchar(50)
declare @new_notary varchar(50)
declare @old_comment varchar(255)
declare @new_comment varchar(255)
declare @old_verified_flag char(1)
declare @new_verified_flag char(1)
declare @old_pacs_user_id int
declare @new_pacs_user_id int
declare @old_value_flag char(1)
declare @new_value_flag char(1)
declare @old_rendition_value numeric(14,0)
declare @new_rendition_value numeric(14,0)
declare @old_active_flag char(1)
declare @new_active_flag char(1)
declare @old_filing_status varchar(25)
declare @new_filing_status varchar(25)
 
declare curRows cursor
for
     select d.prop_id, d.rendition_year, d.rendition_date, d.signed_by, d.notary_flag, d.notary, d.comment, d.verified_flag, d.pacs_user_id, d.value_flag, d.rendition_value, d.active_flag, d.filing_status, 
            i.prop_id, i.rendition_year, i.rendition_date, i.signed_by, i.notary_flag, i.notary, i.comment, i.verified_flag, i.pacs_user_id, i.value_flag, i.rendition_value, i.active_flag, i.filing_status
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.rendition_year = i.rendition_year
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_rendition_year, @old_rendition_date, @old_signed_by, @old_notary_flag, @old_notary, @old_comment, @old_verified_flag, @old_pacs_user_id, @old_value_flag, @old_rendition_value, @old_active_flag, @old_filing_status, 
                             @new_prop_id, @new_rendition_year, @new_rendition_date, @new_signed_by, @new_notary_flag, @new_notary, @new_comment, @new_verified_flag, @new_pacs_user_id, @new_value_flag, @new_rendition_value, @new_active_flag, @new_filing_status
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @new_rendition_year)
 
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
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
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
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'rendition_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 4381, convert(varchar(255), @old_rendition_year), convert(varchar(255), @new_rendition_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_rendition_date <> @new_rendition_date
          or
          ( @old_rendition_date is null and @new_rendition_date is not null ) 
          or
          ( @old_rendition_date is not null and @new_rendition_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'rendition_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 4378, convert(varchar(255), @old_rendition_date), convert(varchar(255), @new_rendition_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_signed_by <> @new_signed_by
          or
          ( @old_signed_by is null and @new_signed_by is not null ) 
          or
          ( @old_signed_by is not null and @new_signed_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'signed_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 4736, convert(varchar(255), @old_signed_by), convert(varchar(255), @new_signed_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_notary_flag <> @new_notary_flag
          or
          ( @old_notary_flag is null and @new_notary_flag is not null ) 
          or
          ( @old_notary_flag is not null and @new_notary_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'notary_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 3338, convert(varchar(255), @old_notary_flag), convert(varchar(255), @new_notary_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_notary <> @new_notary
          or
          ( @old_notary is null and @new_notary is not null ) 
          or
          ( @old_notary is not null and @new_notary is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'notary' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 3337, convert(varchar(255), @old_notary), convert(varchar(255), @new_notary), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_comment <> @new_comment
          or
          ( @old_comment is null and @new_comment is not null ) 
          or
          ( @old_comment is not null and @new_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 827, convert(varchar(255), @old_comment), convert(varchar(255), @new_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_verified_flag <> @new_verified_flag
          or
          ( @old_verified_flag is null and @new_verified_flag is not null ) 
          or
          ( @old_verified_flag is not null and @new_verified_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'verified_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 5502, convert(varchar(255), @old_verified_flag), convert(varchar(255), @new_verified_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pacs_user_id <> @new_pacs_user_id
          or
          ( @old_pacs_user_id is null and @new_pacs_user_id is not null ) 
          or
          ( @old_pacs_user_id is not null and @new_pacs_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'pacs_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 3525, convert(varchar(255), @old_pacs_user_id), convert(varchar(255), @new_pacs_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_value_flag <> @new_value_flag
          or
          ( @old_value_flag is null and @new_value_flag is not null ) 
          or
          ( @old_value_flag is not null and @new_value_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'value_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 5486, convert(varchar(255), @old_value_flag), convert(varchar(255), @new_value_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_rendition_value <> @new_rendition_value
          or
          ( @old_rendition_value is null and @new_rendition_value is not null ) 
          or
          ( @old_rendition_value is not null and @new_rendition_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'rendition_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 4380, convert(varchar(255), @old_rendition_value), convert(varchar(255), @new_rendition_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_active_flag <> @new_active_flag
          or
          ( @old_active_flag is null and @new_active_flag is not null ) 
          or
          ( @old_active_flag is not null and @new_active_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'active_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 55, convert(varchar(255), @old_active_flag), convert(varchar(255), @new_active_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_filing_status <> @new_filing_status
          or
          ( @old_filing_status is null and @new_filing_status is not null ) 
          or
          ( @old_filing_status is not null and @new_filing_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pers_prop_rendition' and
                    chg_log_columns = 'filing_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 587, 9882, convert(varchar(255), @old_filing_status), convert(varchar(255), @new_filing_status), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4381, convert(varchar(24), @new_rendition_year), case when @new_rendition_year > @tvar_intMin and @new_rendition_year < @tvar_intMax then convert(int, round(@new_rendition_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_rendition_year, @old_rendition_date, @old_signed_by, @old_notary_flag, @old_notary, @old_comment, @old_verified_flag, @old_pacs_user_id, @old_value_flag, @old_rendition_value, @old_active_flag, @old_filing_status, 
                                  @new_prop_id, @new_rendition_year, @new_rendition_date, @new_signed_by, @new_notary_flag, @new_notary, @new_comment, @new_verified_flag, @new_pacs_user_id, @new_value_flag, @new_rendition_value, @new_active_flag, @new_filing_status
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Filing status of a personal property rendition', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pers_prop_rendition', @level2type = N'COLUMN', @level2name = N'filing_status';


GO

