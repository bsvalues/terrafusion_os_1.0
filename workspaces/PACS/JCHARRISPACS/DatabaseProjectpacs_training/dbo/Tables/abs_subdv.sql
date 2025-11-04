CREATE TABLE [dbo].[abs_subdv] (
    [abs_subdv_cd]   VARCHAR (10)   NOT NULL,
    [abs_subdv_yr]   NUMERIC (4)    NOT NULL,
    [abs_subdv_desc] VARCHAR (60)   NULL,
    [abs_land_pct]   NUMERIC (5, 2) NOT NULL,
    [abs_imprv_pct]  NUMERIC (5, 2) NOT NULL,
    [abs_subdv_ind]  CHAR (1)       NULL,
    [sys_flag]       CHAR (1)       NULL,
    [changed_flag]   CHAR (1)       NULL,
    [cInCounty]      CHAR (1)       CONSTRAINT [CDF_abs_subdv_cInCounty] DEFAULT ('T') NOT NULL,
    [bActive]        BIT            NULL,
    [ls_id]          INT            NULL,
    [active_year]    NUMERIC (4)    NULL,
    [create_date]    DATETIME       NULL,
    [comments]       VARCHAR (500)  NULL,
    CONSTRAINT [CPK_abs_subdv] PRIMARY KEY CLUSTERED ([abs_subdv_cd] ASC, [abs_subdv_yr] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_abs_subdv_desc_abs_subdv_yr]
    ON [dbo].[abs_subdv]([abs_subdv_desc] ASC, [abs_subdv_yr] ASC);


GO


create trigger tr_abs_subdv_insert_ChangeLog
on abs_subdv
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
 
declare @abs_subdv_cd varchar(10)
declare @abs_subdv_yr numeric(4,0)
declare @abs_subdv_desc varchar(60)
declare @abs_land_pct numeric(5,2)
declare @abs_imprv_pct numeric(5,2)
declare @abs_subdv_ind char(1)
declare @sys_flag char(1)
declare @changed_flag char(1)
declare @cInCounty char(1)
declare @bActive bit
declare @ls_id int
declare @active_year numeric(4,0)
declare @create_date datetime
 
declare curRows cursor
for
     select abs_subdv_cd, case abs_subdv_yr when 0 then @tvar_lFutureYear else abs_subdv_yr end, abs_subdv_desc, abs_land_pct, abs_imprv_pct, abs_subdv_ind, sys_flag, changed_flag, cInCounty, bActive, ls_id, active_year, create_date from inserted
for read only
 
open curRows
fetch next from curRows into @abs_subdv_cd, @abs_subdv_yr, @abs_subdv_desc, @abs_land_pct, @abs_imprv_pct, @abs_subdv_ind, @sys_flag, @changed_flag, @cInCounty, @bActive, @ls_id, @active_year, @create_date
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'abs_subdv_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 24, null, convert(varchar(255), @abs_subdv_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'abs_subdv_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 27, null, convert(varchar(255), @abs_subdv_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'abs_subdv_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 25, null, convert(varchar(255), @abs_subdv_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'abs_land_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 22, null, convert(varchar(255), @abs_land_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'abs_imprv_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 21, null, convert(varchar(255), @abs_imprv_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'abs_subdv_ind' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 26, null, convert(varchar(255), @abs_subdv_ind), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'sys_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 5025, null, convert(varchar(255), @sys_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'changed_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 647, null, convert(varchar(255), @changed_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'cInCounty' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 752, null, convert(varchar(255), @cInCounty), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'bActive' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 9532, null, convert(varchar(255), @bActive), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'ls_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 2932, null, convert(varchar(255), @ls_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'active_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 9531, null, convert(varchar(255), @active_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'abs_subdv' and
               chg_log_columns = 'create_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 57, 9533, null, convert(varchar(255), @create_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @abs_subdv_cd, @abs_subdv_yr, @abs_subdv_desc, @abs_land_pct, @abs_imprv_pct, @abs_subdv_ind, @sys_flag, @changed_flag, @cInCounty, @bActive, @ls_id, @active_year, @create_date
end
 
close curRows
deallocate curRows

GO


create trigger tr_abs_subdv_update_ChangeLog
on abs_subdv
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
 
declare @old_abs_subdv_cd varchar(10)
declare @new_abs_subdv_cd varchar(10)
declare @old_abs_subdv_yr numeric(4,0)
declare @new_abs_subdv_yr numeric(4,0)
declare @old_abs_subdv_desc varchar(60)
declare @new_abs_subdv_desc varchar(60)
declare @old_abs_land_pct numeric(5,2)
declare @new_abs_land_pct numeric(5,2)
declare @old_abs_imprv_pct numeric(5,2)
declare @new_abs_imprv_pct numeric(5,2)
declare @old_abs_subdv_ind char(1)
declare @new_abs_subdv_ind char(1)
declare @old_sys_flag char(1)
declare @new_sys_flag char(1)
declare @old_changed_flag char(1)
declare @new_changed_flag char(1)
declare @old_cInCounty char(1)
declare @new_cInCounty char(1)
declare @old_bActive bit
declare @new_bActive bit
declare @old_ls_id int
declare @new_ls_id int
declare @old_active_year numeric(4,0)
declare @new_active_year numeric(4,0)
declare @old_create_date datetime
declare @new_create_date datetime
 
declare curRows cursor
for
     select d.abs_subdv_cd, case d.abs_subdv_yr when 0 then @tvar_lFutureYear else d.abs_subdv_yr end, d.abs_subdv_desc, d.abs_land_pct, d.abs_imprv_pct, d.abs_subdv_ind, d.sys_flag, d.changed_flag, d.cInCounty, d.bActive, d.ls_id, d.active_year, d.create_date, 
            i.abs_subdv_cd, case i.abs_subdv_yr when 0 then @tvar_lFutureYear else i.abs_subdv_yr end, i.abs_subdv_desc, i.abs_land_pct, i.abs_imprv_pct, i.abs_subdv_ind, i.sys_flag, i.changed_flag, i.cInCounty, i.bActive, i.ls_id, i.active_year, i.create_date
from deleted as d
join inserted as i on 
     d.abs_subdv_cd = i.abs_subdv_cd and
     d.abs_subdv_yr = i.abs_subdv_yr
for read only
 
open curRows
fetch next from curRows into @old_abs_subdv_cd, @old_abs_subdv_yr, @old_abs_subdv_desc, @old_abs_land_pct, @old_abs_imprv_pct, @old_abs_subdv_ind, @old_sys_flag, @old_changed_flag, @old_cInCounty, @old_bActive, @old_ls_id, @old_active_year, @old_create_date, 
                             @new_abs_subdv_cd, @new_abs_subdv_yr, @new_abs_subdv_desc, @new_abs_land_pct, @new_abs_imprv_pct, @new_abs_subdv_ind, @new_sys_flag, @new_changed_flag, @new_cInCounty, @new_bActive, @new_ls_id, @new_active_year, @new_create_date
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_abs_subdv_cd <> @new_abs_subdv_cd
          or
          ( @old_abs_subdv_cd is null and @new_abs_subdv_cd is not null ) 
          or
          ( @old_abs_subdv_cd is not null and @new_abs_subdv_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'abs_subdv_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 24, convert(varchar(255), @old_abs_subdv_cd), convert(varchar(255), @new_abs_subdv_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_abs_subdv_yr <> @new_abs_subdv_yr
          or
          ( @old_abs_subdv_yr is null and @new_abs_subdv_yr is not null ) 
          or
          ( @old_abs_subdv_yr is not null and @new_abs_subdv_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'abs_subdv_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 27, convert(varchar(255), @old_abs_subdv_yr), convert(varchar(255), @new_abs_subdv_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_abs_subdv_desc <> @new_abs_subdv_desc
          or
          ( @old_abs_subdv_desc is null and @new_abs_subdv_desc is not null ) 
          or
          ( @old_abs_subdv_desc is not null and @new_abs_subdv_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'abs_subdv_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 25, convert(varchar(255), @old_abs_subdv_desc), convert(varchar(255), @new_abs_subdv_desc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_abs_land_pct <> @new_abs_land_pct
          or
          ( @old_abs_land_pct is null and @new_abs_land_pct is not null ) 
          or
          ( @old_abs_land_pct is not null and @new_abs_land_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'abs_land_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 22, convert(varchar(255), @old_abs_land_pct), convert(varchar(255), @new_abs_land_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_abs_imprv_pct <> @new_abs_imprv_pct
          or
          ( @old_abs_imprv_pct is null and @new_abs_imprv_pct is not null ) 
          or
          ( @old_abs_imprv_pct is not null and @new_abs_imprv_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'abs_imprv_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 21, convert(varchar(255), @old_abs_imprv_pct), convert(varchar(255), @new_abs_imprv_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_abs_subdv_ind <> @new_abs_subdv_ind
          or
          ( @old_abs_subdv_ind is null and @new_abs_subdv_ind is not null ) 
          or
          ( @old_abs_subdv_ind is not null and @new_abs_subdv_ind is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'abs_subdv_ind' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 26, convert(varchar(255), @old_abs_subdv_ind), convert(varchar(255), @new_abs_subdv_ind), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sys_flag <> @new_sys_flag
          or
          ( @old_sys_flag is null and @new_sys_flag is not null ) 
          or
          ( @old_sys_flag is not null and @new_sys_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'sys_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 5025, convert(varchar(255), @old_sys_flag), convert(varchar(255), @new_sys_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_changed_flag <> @new_changed_flag
          or
          ( @old_changed_flag is null and @new_changed_flag is not null ) 
          or
          ( @old_changed_flag is not null and @new_changed_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'changed_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 647, convert(varchar(255), @old_changed_flag), convert(varchar(255), @new_changed_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cInCounty <> @new_cInCounty
          or
          ( @old_cInCounty is null and @new_cInCounty is not null ) 
          or
          ( @old_cInCounty is not null and @new_cInCounty is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'cInCounty' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 752, convert(varchar(255), @old_cInCounty), convert(varchar(255), @new_cInCounty), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_bActive <> @new_bActive
          or
          ( @old_bActive is null and @new_bActive is not null ) 
          or
          ( @old_bActive is not null and @new_bActive is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'bActive' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 9532, convert(varchar(255), @old_bActive), convert(varchar(255), @new_bActive), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_id <> @new_ls_id
          or
          ( @old_ls_id is null and @new_ls_id is not null ) 
          or
          ( @old_ls_id is not null and @new_ls_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'ls_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 2932, convert(varchar(255), @old_ls_id), convert(varchar(255), @new_ls_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_active_year <> @new_active_year
          or
          ( @old_active_year is null and @new_active_year is not null ) 
          or
          ( @old_active_year is not null and @new_active_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'active_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 9531, convert(varchar(255), @old_active_year), convert(varchar(255), @new_active_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_create_date <> @new_create_date
          or
          ( @old_create_date is null and @new_create_date is not null ) 
          or
          ( @old_create_date is not null and @new_create_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'abs_subdv' and
                    chg_log_columns = 'create_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 57, 9533, convert(varchar(255), @old_create_date), convert(varchar(255), @new_create_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @new_abs_subdv_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @new_abs_subdv_yr), case when @new_abs_subdv_yr > @tvar_intMin and @new_abs_subdv_yr < @tvar_intMax then convert(int, round(@new_abs_subdv_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_abs_subdv_cd, @old_abs_subdv_yr, @old_abs_subdv_desc, @old_abs_land_pct, @old_abs_imprv_pct, @old_abs_subdv_ind, @old_sys_flag, @old_changed_flag, @old_cInCounty, @old_bActive, @old_ls_id, @old_active_year, @old_create_date, 
                                  @new_abs_subdv_cd, @new_abs_subdv_yr, @new_abs_subdv_desc, @new_abs_land_pct, @new_abs_imprv_pct, @new_abs_subdv_ind, @new_sys_flag, @new_changed_flag, @new_cInCounty, @new_bActive, @new_ls_id, @new_active_year, @new_create_date
end
 
close curRows
deallocate curRows

GO


create trigger tr_abs_subdv_delete_ChangeLog
on abs_subdv
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
          chg_log_tables = 'abs_subdv' and
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
 
declare @abs_subdv_cd varchar(10)
declare @abs_subdv_yr numeric(4,0)
 
declare curRows cursor
for
     select abs_subdv_cd, case abs_subdv_yr when 0 then @tvar_lFutureYear else abs_subdv_yr end from deleted
for read only
 
open curRows
fetch next from curRows into @abs_subdv_cd, @abs_subdv_yr
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 57, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 24, convert(varchar(24), @abs_subdv_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 27, convert(varchar(24), @abs_subdv_yr), case when @abs_subdv_yr > @tvar_intMin and @abs_subdv_yr < @tvar_intMax then convert(int, round(@abs_subdv_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @abs_subdv_cd, @abs_subdv_yr
end
 
close curRows
deallocate curRows

GO



create trigger tr_abs_subdv_delete_insert_update_MemTable
on abs_subdv
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
where szTableName = 'abs_subdv'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Gives user ability to specify comments on abstract/subdivisions', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'abs_subdv', @level2type = N'COLUMN', @level2name = N'comments';


GO

