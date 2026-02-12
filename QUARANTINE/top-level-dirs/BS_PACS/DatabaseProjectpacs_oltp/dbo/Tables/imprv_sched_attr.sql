CREATE TABLE [dbo].[imprv_sched_attr] (
    [imprv_det_meth_cd]      CHAR (5)     NOT NULL,
    [imprv_det_type_cd]      CHAR (10)    NOT NULL,
    [imprv_det_class_cd]     CHAR (10)    NOT NULL,
    [imprv_yr]               NUMERIC (4)  NOT NULL,
    [imprv_attr_id]          INT          NOT NULL,
    [use_up_for_pct_base]    CHAR (1)     NULL,
    [imprv_det_sub_class_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_imprv_sched_attr] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC, [imprv_attr_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_imprv_sched_attr_imprv_yr_imprv_det_meth_cd_imprv_det_type_cd_imprv_det_class_cd_imprv_det_sub_class_cd] FOREIGN KEY ([imprv_yr], [imprv_det_meth_cd], [imprv_det_type_cd], [imprv_det_class_cd], [imprv_det_sub_class_cd]) REFERENCES [dbo].[imprv_sched] ([imprv_yr], [imprv_det_meth_cd], [imprv_det_type_cd], [imprv_det_class_cd], [imprv_det_sub_class_cd])
);


GO

 
create trigger tr_imprv_sched_attr_insert_ChangeLog
on imprv_sched_attr
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
 
declare @imprv_det_meth_cd char(5)
declare @imprv_det_type_cd char(10)
declare @imprv_det_class_cd char(10)
declare @imprv_yr numeric(4,0)
declare @imprv_attr_id int
declare @use_up_for_pct_base char(1)
declare @imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select imprv_det_meth_cd, imprv_det_type_cd, imprv_det_class_cd, case imprv_yr when 0 then @tvar_lFutureYear else imprv_yr end, imprv_attr_id, use_up_for_pct_base, imprv_det_sub_class_cd from inserted
for read only
 
open curRows
fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @imprv_attr_id, @use_up_for_pct_base, @imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @imprv_det_meth_cd + '-' + @imprv_det_type_cd + '-' + @imprv_det_class_cd + '-' + @imprv_det_sub_class_cd + '-' + convert(varchar(12), @imprv_attr_id) + '-' + convert(varchar(4), @imprv_yr)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_attr' and
               chg_log_columns = 'imprv_det_meth_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 328, 2257, null, convert(varchar(255), @imprv_det_meth_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @imprv_attr_id), @imprv_attr_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_attr' and
               chg_log_columns = 'imprv_det_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 328, 2263, null, convert(varchar(255), @imprv_det_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @imprv_attr_id), @imprv_attr_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_attr' and
               chg_log_columns = 'imprv_det_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 328, 2252, null, convert(varchar(255), @imprv_det_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @imprv_attr_id), @imprv_attr_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_attr' and
               chg_log_columns = 'imprv_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 328, 2332, null, convert(varchar(255), @imprv_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @imprv_attr_id), @imprv_attr_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_attr' and
               chg_log_columns = 'imprv_attr_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 328, 2212, null, convert(varchar(255), @imprv_attr_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @imprv_attr_id), @imprv_attr_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_attr' and
               chg_log_columns = 'use_up_for_pct_base' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 328, 5456, null, convert(varchar(255), @use_up_for_pct_base), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @imprv_attr_id), @imprv_attr_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_attr' and
               chg_log_columns = 'imprv_det_sub_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 328, 6106, null, convert(varchar(255), @imprv_det_sub_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @imprv_attr_id), @imprv_attr_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @imprv_attr_id, @use_up_for_pct_base, @imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_imprv_sched_attr_update_ChangeLog
on imprv_sched_attr
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
 
declare @old_imprv_det_meth_cd char(5)
declare @new_imprv_det_meth_cd char(5)
declare @old_imprv_det_type_cd char(10)
declare @new_imprv_det_type_cd char(10)
declare @old_imprv_det_class_cd char(10)
declare @new_imprv_det_class_cd char(10)
declare @old_imprv_yr numeric(4,0)
declare @new_imprv_yr numeric(4,0)
declare @old_imprv_attr_id int
declare @new_imprv_attr_id int
declare @old_use_up_for_pct_base char(1)
declare @new_use_up_for_pct_base char(1)
declare @old_imprv_det_sub_class_cd varchar(10)
declare @new_imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select d.imprv_det_meth_cd, d.imprv_det_type_cd, d.imprv_det_class_cd, case d.imprv_yr when 0 then @tvar_lFutureYear else d.imprv_yr end, d.imprv_attr_id, d.use_up_for_pct_base, d.imprv_det_sub_class_cd, 
            i.imprv_det_meth_cd, i.imprv_det_type_cd, i.imprv_det_class_cd, case i.imprv_yr when 0 then @tvar_lFutureYear else i.imprv_yr end, i.imprv_attr_id, i.use_up_for_pct_base, i.imprv_det_sub_class_cd
from deleted as d
join inserted as i on 
     d.imprv_det_meth_cd = i.imprv_det_meth_cd and
     d.imprv_det_type_cd = i.imprv_det_type_cd and
     d.imprv_det_class_cd = i.imprv_det_class_cd and
     d.imprv_yr = i.imprv_yr and
     d.imprv_attr_id = i.imprv_attr_id and
     d.imprv_det_sub_class_cd = i.imprv_det_sub_class_cd
for read only
 
open curRows
fetch next from curRows into @old_imprv_det_meth_cd, @old_imprv_det_type_cd, @old_imprv_det_class_cd, @old_imprv_yr, @old_imprv_attr_id, @old_use_up_for_pct_base, @old_imprv_det_sub_class_cd, 
                             @new_imprv_det_meth_cd, @new_imprv_det_type_cd, @new_imprv_det_class_cd, @new_imprv_yr, @new_imprv_attr_id, @new_use_up_for_pct_base, @new_imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_imprv_det_meth_cd + '-' + @new_imprv_det_type_cd + '-' + @new_imprv_det_class_cd + '-' + @new_imprv_det_sub_class_cd + '-' + convert(varchar(12), @new_imprv_attr_id) + '-' + convert(varchar(4), @new_imprv_yr)
 
     if (
          @old_imprv_det_meth_cd <> @new_imprv_det_meth_cd
          or
          ( @old_imprv_det_meth_cd is null and @new_imprv_det_meth_cd is not null ) 
          or
          ( @old_imprv_det_meth_cd is not null and @new_imprv_det_meth_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_attr' and
                    chg_log_columns = 'imprv_det_meth_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 328, 2257, convert(varchar(255), @old_imprv_det_meth_cd), convert(varchar(255), @new_imprv_det_meth_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @new_imprv_attr_id), @new_imprv_attr_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_det_type_cd <> @new_imprv_det_type_cd
          or
          ( @old_imprv_det_type_cd is null and @new_imprv_det_type_cd is not null ) 
          or
          ( @old_imprv_det_type_cd is not null and @new_imprv_det_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_attr' and
                    chg_log_columns = 'imprv_det_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 328, 2263, convert(varchar(255), @old_imprv_det_type_cd), convert(varchar(255), @new_imprv_det_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @new_imprv_attr_id), @new_imprv_attr_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_det_class_cd <> @new_imprv_det_class_cd
          or
          ( @old_imprv_det_class_cd is null and @new_imprv_det_class_cd is not null ) 
          or
          ( @old_imprv_det_class_cd is not null and @new_imprv_det_class_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_attr' and
                    chg_log_columns = 'imprv_det_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 328, 2252, convert(varchar(255), @old_imprv_det_class_cd), convert(varchar(255), @new_imprv_det_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @new_imprv_attr_id), @new_imprv_attr_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_yr <> @new_imprv_yr
          or
          ( @old_imprv_yr is null and @new_imprv_yr is not null ) 
          or
          ( @old_imprv_yr is not null and @new_imprv_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_attr' and
                    chg_log_columns = 'imprv_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 328, 2332, convert(varchar(255), @old_imprv_yr), convert(varchar(255), @new_imprv_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @new_imprv_attr_id), @new_imprv_attr_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_attr_id <> @new_imprv_attr_id
          or
          ( @old_imprv_attr_id is null and @new_imprv_attr_id is not null ) 
          or
          ( @old_imprv_attr_id is not null and @new_imprv_attr_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_attr' and
                    chg_log_columns = 'imprv_attr_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 328, 2212, convert(varchar(255), @old_imprv_attr_id), convert(varchar(255), @new_imprv_attr_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @new_imprv_attr_id), @new_imprv_attr_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_use_up_for_pct_base <> @new_use_up_for_pct_base
          or
          ( @old_use_up_for_pct_base is null and @new_use_up_for_pct_base is not null ) 
          or
          ( @old_use_up_for_pct_base is not null and @new_use_up_for_pct_base is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_attr' and
                    chg_log_columns = 'use_up_for_pct_base' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 328, 5456, convert(varchar(255), @old_use_up_for_pct_base), convert(varchar(255), @new_use_up_for_pct_base), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @new_imprv_attr_id), @new_imprv_attr_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_det_sub_class_cd <> @new_imprv_det_sub_class_cd
          or
          ( @old_imprv_det_sub_class_cd is null and @new_imprv_det_sub_class_cd is not null ) 
          or
          ( @old_imprv_det_sub_class_cd is not null and @new_imprv_det_sub_class_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_attr' and
                    chg_log_columns = 'imprv_det_sub_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 328, 6106, convert(varchar(255), @old_imprv_det_sub_class_cd), convert(varchar(255), @new_imprv_det_sub_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @new_imprv_attr_id), @new_imprv_attr_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     fetch next from curRows into @old_imprv_det_meth_cd, @old_imprv_det_type_cd, @old_imprv_det_class_cd, @old_imprv_yr, @old_imprv_attr_id, @old_use_up_for_pct_base, @old_imprv_det_sub_class_cd, 
                                  @new_imprv_det_meth_cd, @new_imprv_det_type_cd, @new_imprv_det_class_cd, @new_imprv_yr, @new_imprv_attr_id, @new_use_up_for_pct_base, @new_imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_imprv_sched_attr_delete_ChangeLog
on imprv_sched_attr
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
          chg_log_tables = 'imprv_sched_attr' and
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
 
declare @imprv_det_meth_cd char(5)
declare @imprv_det_type_cd char(10)
declare @imprv_det_class_cd char(10)
declare @imprv_yr numeric(4,0)
declare @imprv_attr_id int
declare @imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select imprv_det_meth_cd, imprv_det_type_cd, imprv_det_class_cd, case imprv_yr when 0 then @tvar_lFutureYear else imprv_yr end, imprv_attr_id, imprv_det_sub_class_cd from deleted
for read only
 
open curRows
fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @imprv_attr_id, @imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @imprv_det_meth_cd + '-' + @imprv_det_type_cd + '-' + @imprv_det_class_cd + '-' + @imprv_det_sub_class_cd + '-' + convert(varchar(12), @imprv_attr_id) + '-' + convert(varchar(4), @imprv_yr)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 328, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2212, convert(varchar(24), @imprv_attr_id), @imprv_attr_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
 
     fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @imprv_attr_id, @imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO



create trigger tr_imprv_sched_attr_delete_insert_update_MemTable
on imprv_sched_attr
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'imprv_sched_attr'

GO

