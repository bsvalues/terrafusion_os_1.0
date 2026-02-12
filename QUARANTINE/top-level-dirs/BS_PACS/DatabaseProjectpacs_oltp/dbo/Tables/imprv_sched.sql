CREATE TABLE [dbo].[imprv_sched] (
    [imprv_det_meth_cd]                 CHAR (5)       NOT NULL,
    [imprv_det_type_cd]                 CHAR (10)      NOT NULL,
    [imprv_det_class_cd]                CHAR (10)      NOT NULL,
    [imprv_yr]                          NUMERIC (4)    NOT NULL,
    [imprv_pc_of_base]                  NUMERIC (5, 2) NULL,
    [imprv_interpolate]                 CHAR (1)       NULL,
    [imprv_use_mult]                    CHAR (1)       NULL,
    [imprv_sched_area_type_cd]          CHAR (10)      NULL,
    [imprv_sched_mult_type]             CHAR (2)       NULL,
    [imprv_sched_mult_form]             CHAR (1)       NULL,
    [imprv_sched_mult_quality_cd]       VARCHAR (10)   NULL,
    [imprv_sched_mult_section_cd]       VARCHAR (10)   NULL,
    [imprv_sched_mult_local_quality_cd] VARCHAR (10)   NULL,
    [imprv_sched_deprec_cd]             CHAR (10)      NULL,
    [imprv_sched_slope_intercept]       BIT            NULL,
    [imprv_sched_value_type]            CHAR (1)       NULL,
    [imprv_det_sub_class_cd]            VARCHAR (10)   NOT NULL,
    CONSTRAINT [CPK_imprv_sched] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_imprv_sched_imprv_det_class_cd] FOREIGN KEY ([imprv_det_class_cd]) REFERENCES [dbo].[imprv_det_class] ([imprv_det_class_cd]),
    CONSTRAINT [CFK_imprv_sched_imprv_det_meth_cd] FOREIGN KEY ([imprv_det_meth_cd]) REFERENCES [dbo].[imprv_det_meth] ([imprv_det_meth_cd]),
    CONSTRAINT [CFK_imprv_sched_imprv_sched_area_type_cd] FOREIGN KEY ([imprv_sched_area_type_cd]) REFERENCES [dbo].[imprv_sched_area_type] ([imprv_sched_area_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_sched_mult_local_quality_cd]
    ON [dbo].[imprv_sched]([imprv_sched_mult_local_quality_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_sched_deprec_cd]
    ON [dbo].[imprv_sched]([imprv_sched_deprec_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_sched_mult_section_cd]
    ON [dbo].[imprv_sched]([imprv_sched_mult_section_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_type_cd]
    ON [dbo].[imprv_sched]([imprv_det_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_sched_mult_quality_cd]
    ON [dbo].[imprv_sched]([imprv_sched_mult_quality_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_meth_cd]
    ON [dbo].[imprv_sched]([imprv_det_meth_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_class_cd]
    ON [dbo].[imprv_sched]([imprv_det_class_cd] ASC) WITH (FILLFACTOR = 90);


GO

 
create trigger tr_imprv_sched_delete_ChangeLog
on imprv_sched
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
          chg_log_tables = 'imprv_sched' and
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
declare @imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select imprv_det_meth_cd, imprv_det_type_cd, imprv_det_class_cd, case imprv_yr when 0 then @tvar_lFutureYear else imprv_yr end, imprv_det_sub_class_cd from deleted
for read only
 
open curRows
fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @imprv_det_meth_cd + '-' + @imprv_det_type_cd + '-' + @imprv_det_class_cd + '-' + @imprv_det_sub_class_cd + '-' + convert(varchar(4), @imprv_yr)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 326, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
 
     fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_imprv_sched_insert_ChangeLog
on imprv_sched
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
declare @imprv_pc_of_base numeric(5,2)
declare @imprv_interpolate char(1)
declare @imprv_use_mult char(1)
declare @imprv_sched_area_type_cd char(10)
declare @imprv_sched_mult_type char(2)
declare @imprv_sched_mult_form char(1)
declare @imprv_sched_mult_quality_cd varchar(10)
declare @imprv_sched_mult_section_cd varchar(10)
declare @imprv_sched_mult_local_quality_cd varchar(10)
declare @imprv_sched_deprec_cd char(10)
declare @imprv_sched_slope_intercept bit
declare @imprv_sched_value_type char(1)
declare @imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select imprv_det_meth_cd, imprv_det_type_cd, imprv_det_class_cd, case imprv_yr when 0 then @tvar_lFutureYear else imprv_yr end, imprv_pc_of_base, imprv_interpolate, imprv_use_mult, imprv_sched_area_type_cd, imprv_sched_mult_type, imprv_sched_mult_form, imprv_sched_mult_quality_cd, imprv_sched_mult_section_cd, imprv_sched_mult_local_quality_cd, imprv_sched_deprec_cd, imprv_sched_slope_intercept, imprv_sched_value_type, imprv_det_sub_class_cd from inserted
for read only
 
open curRows
fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @imprv_pc_of_base, @imprv_interpolate, @imprv_use_mult, @imprv_sched_area_type_cd, @imprv_sched_mult_type, @imprv_sched_mult_form, @imprv_sched_mult_quality_cd, @imprv_sched_mult_section_cd, @imprv_sched_mult_local_quality_cd, @imprv_sched_deprec_cd, @imprv_sched_slope_intercept, @imprv_sched_value_type, @imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @imprv_det_meth_cd + '-' + @imprv_det_type_cd + '-' + @imprv_det_class_cd + '-' + @imprv_det_sub_class_cd + '-' + convert(varchar(4), @imprv_yr)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_det_meth_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2257, null, convert(varchar(255), @imprv_det_meth_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_det_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2263, null, convert(varchar(255), @imprv_det_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_det_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2252, null, convert(varchar(255), @imprv_det_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2332, null, convert(varchar(255), @imprv_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_pc_of_base' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2293, null, convert(varchar(255), @imprv_pc_of_base), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_interpolate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2277, null, convert(varchar(255), @imprv_interpolate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_use_mult' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2322, null, convert(varchar(255), @imprv_use_mult), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_area_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2301, null, convert(varchar(255), @imprv_sched_area_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_mult_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2308, null, convert(varchar(255), @imprv_sched_mult_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_mult_form' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2304, null, convert(varchar(255), @imprv_sched_mult_form), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_mult_quality_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2306, null, convert(varchar(255), @imprv_sched_mult_quality_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_mult_section_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2307, null, convert(varchar(255), @imprv_sched_mult_section_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_mult_local_quality_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2305, null, convert(varchar(255), @imprv_sched_mult_local_quality_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_deprec_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2303, null, convert(varchar(255), @imprv_sched_deprec_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_slope_intercept' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 2309, null, convert(varchar(255), @imprv_sched_slope_intercept), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_sched_value_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 6107, null, convert(varchar(255), @imprv_sched_value_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched' and
               chg_log_columns = 'imprv_det_sub_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 326, 6106, null, convert(varchar(255), @imprv_det_sub_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @imprv_pc_of_base, @imprv_interpolate, @imprv_use_mult, @imprv_sched_area_type_cd, @imprv_sched_mult_type, @imprv_sched_mult_form, @imprv_sched_mult_quality_cd, @imprv_sched_mult_section_cd, @imprv_sched_mult_local_quality_cd, @imprv_sched_deprec_cd, @imprv_sched_slope_intercept, @imprv_sched_value_type, @imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO



create trigger tr_imprv_sched_delete_insert_update_MemTable
on imprv_sched
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
where szTableName = 'imprv_sched'

GO

 
create trigger tr_imprv_sched_update_ChangeLog
on imprv_sched
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
declare @old_imprv_pc_of_base numeric(5,2)
declare @new_imprv_pc_of_base numeric(5,2)
declare @old_imprv_interpolate char(1)
declare @new_imprv_interpolate char(1)
declare @old_imprv_use_mult char(1)
declare @new_imprv_use_mult char(1)
declare @old_imprv_sched_area_type_cd char(10)
declare @new_imprv_sched_area_type_cd char(10)
declare @old_imprv_sched_mult_type char(2)
declare @new_imprv_sched_mult_type char(2)
declare @old_imprv_sched_mult_form char(1)
declare @new_imprv_sched_mult_form char(1)
declare @old_imprv_sched_mult_quality_cd varchar(10)
declare @new_imprv_sched_mult_quality_cd varchar(10)
declare @old_imprv_sched_mult_section_cd varchar(10)
declare @new_imprv_sched_mult_section_cd varchar(10)
declare @old_imprv_sched_mult_local_quality_cd varchar(10)
declare @new_imprv_sched_mult_local_quality_cd varchar(10)
declare @old_imprv_sched_deprec_cd char(10)
declare @new_imprv_sched_deprec_cd char(10)
declare @old_imprv_sched_slope_intercept bit
declare @new_imprv_sched_slope_intercept bit
declare @old_imprv_sched_value_type char(1)
declare @new_imprv_sched_value_type char(1)
declare @old_imprv_det_sub_class_cd varchar(10)
declare @new_imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select d.imprv_det_meth_cd, d.imprv_det_type_cd, d.imprv_det_class_cd, case d.imprv_yr when 0 then @tvar_lFutureYear else d.imprv_yr end, d.imprv_pc_of_base, d.imprv_interpolate, d.imprv_use_mult, d.imprv_sched_area_type_cd, d.imprv_sched_mult_type, d.imprv_sched_mult_form, d.imprv_sched_mult_quality_cd, d.imprv_sched_mult_section_cd, d.imprv_sched_mult_local_quality_cd, d.imprv_sched_deprec_cd, d.imprv_sched_slope_intercept, d.imprv_sched_value_type, d.imprv_det_sub_class_cd, 
            i.imprv_det_meth_cd, i.imprv_det_type_cd, i.imprv_det_class_cd, case i.imprv_yr when 0 then @tvar_lFutureYear else i.imprv_yr end, i.imprv_pc_of_base, i.imprv_interpolate, i.imprv_use_mult, i.imprv_sched_area_type_cd, i.imprv_sched_mult_type, i.imprv_sched_mult_form, i.imprv_sched_mult_quality_cd, i.imprv_sched_mult_section_cd, i.imprv_sched_mult_local_quality_cd, i.imprv_sched_deprec_cd, i.imprv_sched_slope_intercept, i.imprv_sched_value_type, i.imprv_det_sub_class_cd
from deleted as d
join inserted as i on 
     d.imprv_det_meth_cd = i.imprv_det_meth_cd and
     d.imprv_det_type_cd = i.imprv_det_type_cd and
     d.imprv_det_class_cd = i.imprv_det_class_cd and
     d.imprv_yr = i.imprv_yr and
     d.imprv_det_sub_class_cd = i.imprv_det_sub_class_cd
for read only
 
open curRows
fetch next from curRows into @old_imprv_det_meth_cd, @old_imprv_det_type_cd, @old_imprv_det_class_cd, @old_imprv_yr, @old_imprv_pc_of_base, @old_imprv_interpolate, @old_imprv_use_mult, @old_imprv_sched_area_type_cd, @old_imprv_sched_mult_type, @old_imprv_sched_mult_form, @old_imprv_sched_mult_quality_cd, @old_imprv_sched_mult_section_cd, @old_imprv_sched_mult_local_quality_cd, @old_imprv_sched_deprec_cd, @old_imprv_sched_slope_intercept, @old_imprv_sched_value_type, @old_imprv_det_sub_class_cd, 
                             @new_imprv_det_meth_cd, @new_imprv_det_type_cd, @new_imprv_det_class_cd, @new_imprv_yr, @new_imprv_pc_of_base, @new_imprv_interpolate, @new_imprv_use_mult, @new_imprv_sched_area_type_cd, @new_imprv_sched_mult_type, @new_imprv_sched_mult_form, @new_imprv_sched_mult_quality_cd, @new_imprv_sched_mult_section_cd, @new_imprv_sched_mult_local_quality_cd, @new_imprv_sched_deprec_cd, @new_imprv_sched_slope_intercept, @new_imprv_sched_value_type, @new_imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_imprv_det_meth_cd + '-' + @new_imprv_det_type_cd + '-' + @new_imprv_det_class_cd + '-' + @new_imprv_det_sub_class_cd + '-' + convert(varchar(4), @new_imprv_yr)
 
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
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_det_meth_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2257, convert(varchar(255), @old_imprv_det_meth_cd), convert(varchar(255), @new_imprv_det_meth_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
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
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_det_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2263, convert(varchar(255), @old_imprv_det_type_cd), convert(varchar(255), @new_imprv_det_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
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
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_det_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2252, convert(varchar(255), @old_imprv_det_class_cd), convert(varchar(255), @new_imprv_det_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
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
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2332, convert(varchar(255), @old_imprv_yr), convert(varchar(255), @new_imprv_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_pc_of_base <> @new_imprv_pc_of_base
          or
          ( @old_imprv_pc_of_base is null and @new_imprv_pc_of_base is not null ) 
          or
          ( @old_imprv_pc_of_base is not null and @new_imprv_pc_of_base is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_pc_of_base' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2293, convert(varchar(255), @old_imprv_pc_of_base), convert(varchar(255), @new_imprv_pc_of_base), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_interpolate <> @new_imprv_interpolate
          or
          ( @old_imprv_interpolate is null and @new_imprv_interpolate is not null ) 
          or
          ( @old_imprv_interpolate is not null and @new_imprv_interpolate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_interpolate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2277, convert(varchar(255), @old_imprv_interpolate), convert(varchar(255), @new_imprv_interpolate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_use_mult <> @new_imprv_use_mult
          or
          ( @old_imprv_use_mult is null and @new_imprv_use_mult is not null ) 
          or
          ( @old_imprv_use_mult is not null and @new_imprv_use_mult is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_use_mult' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2322, convert(varchar(255), @old_imprv_use_mult), convert(varchar(255), @new_imprv_use_mult), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_area_type_cd <> @new_imprv_sched_area_type_cd
          or
          ( @old_imprv_sched_area_type_cd is null and @new_imprv_sched_area_type_cd is not null ) 
          or
          ( @old_imprv_sched_area_type_cd is not null and @new_imprv_sched_area_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_area_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2301, convert(varchar(255), @old_imprv_sched_area_type_cd), convert(varchar(255), @new_imprv_sched_area_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_mult_type <> @new_imprv_sched_mult_type
          or
          ( @old_imprv_sched_mult_type is null and @new_imprv_sched_mult_type is not null ) 
          or
          ( @old_imprv_sched_mult_type is not null and @new_imprv_sched_mult_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_mult_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2308, convert(varchar(255), @old_imprv_sched_mult_type), convert(varchar(255), @new_imprv_sched_mult_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_mult_form <> @new_imprv_sched_mult_form
          or
          ( @old_imprv_sched_mult_form is null and @new_imprv_sched_mult_form is not null ) 
          or
          ( @old_imprv_sched_mult_form is not null and @new_imprv_sched_mult_form is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_mult_form' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2304, convert(varchar(255), @old_imprv_sched_mult_form), convert(varchar(255), @new_imprv_sched_mult_form), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_mult_quality_cd <> @new_imprv_sched_mult_quality_cd
          or
          ( @old_imprv_sched_mult_quality_cd is null and @new_imprv_sched_mult_quality_cd is not null ) 
          or
          ( @old_imprv_sched_mult_quality_cd is not null and @new_imprv_sched_mult_quality_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_mult_quality_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2306, convert(varchar(255), @old_imprv_sched_mult_quality_cd), convert(varchar(255), @new_imprv_sched_mult_quality_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_mult_section_cd <> @new_imprv_sched_mult_section_cd
          or
          ( @old_imprv_sched_mult_section_cd is null and @new_imprv_sched_mult_section_cd is not null ) 
          or
          ( @old_imprv_sched_mult_section_cd is not null and @new_imprv_sched_mult_section_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_mult_section_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2307, convert(varchar(255), @old_imprv_sched_mult_section_cd), convert(varchar(255), @new_imprv_sched_mult_section_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_mult_local_quality_cd <> @new_imprv_sched_mult_local_quality_cd
          or
          ( @old_imprv_sched_mult_local_quality_cd is null and @new_imprv_sched_mult_local_quality_cd is not null ) 
          or
          ( @old_imprv_sched_mult_local_quality_cd is not null and @new_imprv_sched_mult_local_quality_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_mult_local_quality_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2305, convert(varchar(255), @old_imprv_sched_mult_local_quality_cd), convert(varchar(255), @new_imprv_sched_mult_local_quality_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_deprec_cd <> @new_imprv_sched_deprec_cd
          or
          ( @old_imprv_sched_deprec_cd is null and @new_imprv_sched_deprec_cd is not null ) 
          or
          ( @old_imprv_sched_deprec_cd is not null and @new_imprv_sched_deprec_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_deprec_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2303, convert(varchar(255), @old_imprv_sched_deprec_cd), convert(varchar(255), @new_imprv_sched_deprec_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_slope_intercept <> @new_imprv_sched_slope_intercept
          or
          ( @old_imprv_sched_slope_intercept is null and @new_imprv_sched_slope_intercept is not null ) 
          or
          ( @old_imprv_sched_slope_intercept is not null and @new_imprv_sched_slope_intercept is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_slope_intercept' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 2309, convert(varchar(255), @old_imprv_sched_slope_intercept), convert(varchar(255), @new_imprv_sched_slope_intercept), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_value_type <> @new_imprv_sched_value_type
          or
          ( @old_imprv_sched_value_type is null and @new_imprv_sched_value_type is not null ) 
          or
          ( @old_imprv_sched_value_type is not null and @new_imprv_sched_value_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_sched_value_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 6107, convert(varchar(255), @old_imprv_sched_value_type), convert(varchar(255), @new_imprv_sched_value_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
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
                    chg_log_tables = 'imprv_sched' and
                    chg_log_columns = 'imprv_det_sub_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 326, 6106, convert(varchar(255), @old_imprv_det_sub_class_cd), convert(varchar(255), @new_imprv_det_sub_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     fetch next from curRows into @old_imprv_det_meth_cd, @old_imprv_det_type_cd, @old_imprv_det_class_cd, @old_imprv_yr, @old_imprv_pc_of_base, @old_imprv_interpolate, @old_imprv_use_mult, @old_imprv_sched_area_type_cd, @old_imprv_sched_mult_type, @old_imprv_sched_mult_form, @old_imprv_sched_mult_quality_cd, @old_imprv_sched_mult_section_cd, @old_imprv_sched_mult_local_quality_cd, @old_imprv_sched_deprec_cd, @old_imprv_sched_slope_intercept, @old_imprv_sched_value_type, @old_imprv_det_sub_class_cd, 
                                  @new_imprv_det_meth_cd, @new_imprv_det_type_cd, @new_imprv_det_class_cd, @new_imprv_yr, @new_imprv_pc_of_base, @new_imprv_interpolate, @new_imprv_use_mult, @new_imprv_sched_area_type_cd, @new_imprv_sched_mult_type, @new_imprv_sched_mult_form, @new_imprv_sched_mult_quality_cd, @new_imprv_sched_mult_section_cd, @new_imprv_sched_mult_local_quality_cd, @new_imprv_sched_deprec_cd, @new_imprv_sched_slope_intercept, @new_imprv_sched_value_type, @new_imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO

