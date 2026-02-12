CREATE TABLE [dbo].[prop_group_assoc] (
    [prop_id]       INT          NOT NULL,
    [prop_group_cd] VARCHAR (20) NOT NULL,
    [expiration_dt] DATETIME     NULL,
    [assessment_yr] NUMERIC (4)  NULL,
    [create_dt]     DATETIME     DEFAULT (getdate()) NOT NULL,
    [create_id]     INT          DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_prop_group_assoc] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_group_cd] ASC),
    CONSTRAINT [CFK_prop_group_assoc_prop_group_cd] FOREIGN KEY ([prop_group_cd]) REFERENCES [dbo].[prop_group_code] ([group_cd]),
    CONSTRAINT [CFK_prop_group_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

 
create trigger tr_prop_group_assoc_update_ChangeLog
on prop_group_assoc
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
declare @old_prop_group_cd varchar(20)
declare @new_prop_group_cd varchar(20)
declare @old_expiration_dt datetime
declare @new_expiration_dt datetime
declare @old_assessment_yr numeric(4,0)
declare @new_assessment_yr numeric(4,0)
declare @old_create_dt datetime
declare @new_create_dt datetime
declare @old_create_id int
declare @new_create_id int
 
declare curRows cursor
for
     select d.prop_id, d.prop_group_cd, d.expiration_dt, d.assessment_yr, d.create_dt, d.create_id, 
            i.prop_id, i.prop_group_cd, i.expiration_dt, i.assessment_yr, i.create_dt, i.create_id
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.prop_group_cd = i.prop_group_cd
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_prop_group_cd, @old_expiration_dt, @old_assessment_yr, @old_create_dt, @old_create_id, 
                             @new_prop_id, @new_prop_group_cd, @new_expiration_dt, @new_assessment_yr, @new_create_dt, @new_create_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_prop_group_cd
 
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
                    chg_log_tables = 'prop_group_assoc' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 633, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @new_prop_group_cd), 0)
          end
     end
 
     if (
          @old_prop_group_cd <> @new_prop_group_cd
          or
          ( @old_prop_group_cd is null and @new_prop_group_cd is not null ) 
          or
          ( @old_prop_group_cd is not null and @new_prop_group_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'prop_group_assoc' and
                    chg_log_columns = 'prop_group_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 633, 4025, convert(varchar(255), @old_prop_group_cd), convert(varchar(255), @new_prop_group_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @new_prop_group_cd), 0)
          end
     end
 
     if (
          @old_expiration_dt <> @new_expiration_dt
          or
          ( @old_expiration_dt is null and @new_expiration_dt is not null ) 
          or
          ( @old_expiration_dt is not null and @new_expiration_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'prop_group_assoc' and
                    chg_log_columns = 'expiration_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 633, 1842, convert(varchar(255), @old_expiration_dt), convert(varchar(255), @new_expiration_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @new_prop_group_cd), 0)
          end
     end
 
     if (
          @old_assessment_yr <> @new_assessment_yr
          or
          ( @old_assessment_yr is null and @new_assessment_yr is not null ) 
          or
          ( @old_assessment_yr is not null and @new_assessment_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'prop_group_assoc' and
                    chg_log_columns = 'assessment_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 633, 9801, convert(varchar(255), @old_assessment_yr), convert(varchar(255), @new_assessment_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @new_prop_group_cd), 0)
          end
     end
 
     if (
          @old_create_dt <> @new_create_dt
          or
          ( @old_create_dt is null and @new_create_dt is not null ) 
          or
          ( @old_create_dt is not null and @new_create_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'prop_group_assoc' and
                    chg_log_columns = 'create_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 633, 917, convert(varchar(255), @old_create_dt), convert(varchar(255), @new_create_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @new_prop_group_cd), 0)
          end
     end
 
     if (
          @old_create_id <> @new_create_id
          or
          ( @old_create_id is null and @new_create_id is not null ) 
          or
          ( @old_create_id is not null and @new_create_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'prop_group_assoc' and
                    chg_log_columns = 'create_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 633, 9800, convert(varchar(255), @old_create_id), convert(varchar(255), @new_create_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @new_prop_group_cd), 0)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_prop_group_cd, @old_expiration_dt, @old_assessment_yr, @old_create_dt, @old_create_id, 
                                  @new_prop_id, @new_prop_group_cd, @new_expiration_dt, @new_assessment_yr, @new_create_dt, @new_create_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_prop_group_assoc_delete_ChangeLog
on prop_group_assoc
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
          chg_log_tables = 'prop_group_assoc' and
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
declare @prop_group_cd varchar(20)
 
declare curRows cursor
for
     select prop_id, prop_group_cd from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_group_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @prop_group_cd
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 633, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @prop_group_cd), 0)
 
     fetch next from curRows into @prop_id, @prop_group_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_prop_group_assoc_insert_ChangeLog
on prop_group_assoc
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
declare @prop_group_cd varchar(20)
declare @expiration_dt datetime
declare @assessment_yr numeric(4,0)
declare @create_dt datetime
declare @create_id int
 
declare curRows cursor
for
     select prop_id, prop_group_cd, expiration_dt, assessment_yr, create_dt, create_id from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_group_cd, @expiration_dt, @assessment_yr, @create_dt, @create_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @prop_group_cd
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'prop_group_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 633, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @prop_group_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'prop_group_assoc' and
               chg_log_columns = 'prop_group_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 633, 4025, null, convert(varchar(255), @prop_group_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @prop_group_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'prop_group_assoc' and
               chg_log_columns = 'expiration_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 633, 1842, null, convert(varchar(255), @expiration_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @prop_group_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'prop_group_assoc' and
               chg_log_columns = 'assessment_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 633, 9801, null, convert(varchar(255), @assessment_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @prop_group_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'prop_group_assoc' and
               chg_log_columns = 'create_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 633, 917, null, convert(varchar(255), @create_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @prop_group_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'prop_group_assoc' and
               chg_log_columns = 'create_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 633, 9800, null, convert(varchar(255), @create_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4025, convert(varchar(24), @prop_group_cd), 0)
     end
 
     fetch next from curRows into @prop_id, @prop_group_cd, @expiration_dt, @assessment_yr, @create_dt, @create_id
end
 
close curRows
deallocate curRows

GO

