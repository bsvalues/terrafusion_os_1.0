CREATE TABLE [dbo].[land_sched] (
    [ls_id]              INT             NOT NULL,
    [ls_year]            NUMERIC (4)     NOT NULL,
    [ls_code]            CHAR (25)       NOT NULL,
    [ls_ag_or_mkt]       CHAR (1)        NOT NULL,
    [ls_method]          CHAR (5)        NOT NULL,
    [ls_interpolate]     CHAR (1)        NULL,
    [ls_up]              NUMERIC (14, 2) NULL,
    [ls_base_price]      NUMERIC (14, 2) NULL,
    [ls_std_depth]       NUMERIC (14, 4) NULL,
    [ls_plus_dev_ft]     NUMERIC (14, 4) NULL,
    [ls_plus_dev_amt]    NUMERIC (14, 2) NULL,
    [ls_minus_dev_ft]    NUMERIC (14, 4) NULL,
    [ls_minus_dev_amt]   NUMERIC (14, 2) NULL,
    [changed_flag]       CHAR (1)        NULL,
    [ls_ff_type]         CHAR (1)        NULL,
    [ls_slope_intercept] BIT             NULL,
    [matrix_id]          INT             NULL,
    CONSTRAINT [CPK_land_sched] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_land_sched_ls_method] FOREIGN KEY ([ls_method]) REFERENCES [dbo].[land_meth] ([land_meth_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_ls_method]
    ON [dbo].[land_sched]([ls_method] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_land_sched_update_ChangeLog
on land_sched
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
 
declare @old_ls_id int
declare @new_ls_id int
declare @old_ls_year numeric(4,0)
declare @new_ls_year numeric(4,0)
declare @old_ls_code char(25)
declare @new_ls_code char(25)
declare @old_ls_ag_or_mkt char(1)
declare @new_ls_ag_or_mkt char(1)
declare @old_ls_method char(5)
declare @new_ls_method char(5)
declare @old_ls_interpolate char(1)
declare @new_ls_interpolate char(1)
declare @old_ls_up numeric(14,2)
declare @new_ls_up numeric(14,2)
declare @old_ls_base_price numeric(14,2)
declare @new_ls_base_price numeric(14,2)
declare @old_ls_std_depth numeric(14,4)
declare @new_ls_std_depth numeric(14,4)
declare @old_ls_plus_dev_ft numeric(14,4)
declare @new_ls_plus_dev_ft numeric(14,4)
declare @old_ls_plus_dev_amt numeric(14,2)
declare @new_ls_plus_dev_amt numeric(14,2)
declare @old_ls_minus_dev_ft numeric(14,4)
declare @new_ls_minus_dev_ft numeric(14,4)
declare @old_ls_minus_dev_amt numeric(14,2)
declare @new_ls_minus_dev_amt numeric(14,2)
declare @old_changed_flag char(1)
declare @new_changed_flag char(1)
declare @old_ls_ff_type char(1)
declare @new_ls_ff_type char(1)
declare @old_ls_slope_intercept bit
declare @new_ls_slope_intercept bit
declare @old_matrix_id int
declare @new_matrix_id int
 
declare curRows cursor
for
     select d.ls_id, case d.ls_year when 0 then @tvar_lFutureYear else d.ls_year end, d.ls_code, d.ls_ag_or_mkt, d.ls_method, d.ls_interpolate, d.ls_up, d.ls_base_price, d.ls_std_depth, d.ls_plus_dev_ft, d.ls_plus_dev_amt, d.ls_minus_dev_ft, d.ls_minus_dev_amt, d.changed_flag, d.ls_ff_type, d.ls_slope_intercept, d.matrix_id, i.ls_id, case i.ls_year when 0 then @tvar_lFutureYear else i.ls_year end, i.ls_code, i.ls_ag_or_mkt, i.ls_method, i.ls_interpolate, i.ls_up, i.ls_base_price, i.ls_std_depth, i.ls_plus_dev_ft, i.ls_plus_dev_amt, i.ls_minus_dev_ft, i.ls_minus_dev_amt, i.changed_flag, i.ls_ff_type, i.ls_slope_intercept, i.matrix_id
from deleted as d
join inserted as i on 
     d.ls_id = i.ls_id and
     d.ls_year = i.ls_year
for read only
 
open curRows
fetch next from curRows into @old_ls_id, @old_ls_year, @old_ls_code, @old_ls_ag_or_mkt, @old_ls_method, @old_ls_interpolate, @old_ls_up, @old_ls_base_price, @old_ls_std_depth, @old_ls_plus_dev_ft, @old_ls_plus_dev_amt, @old_ls_minus_dev_ft, @old_ls_minus_dev_amt, @old_changed_flag, @old_ls_ff_type, @old_ls_slope_intercept, @old_matrix_id, @new_ls_id, @new_ls_year, @new_ls_code, @new_ls_ag_or_mkt, @new_ls_method, @new_ls_interpolate, @new_ls_up, @new_ls_base_price, @new_ls_std_depth, @new_ls_plus_dev_ft, @new_ls_plus_dev_amt, @new_ls_minus_dev_ft, @new_ls_minus_dev_amt, @new_changed_flag, @new_ls_ff_type, @new_ls_slope_intercept, @new_matrix_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @new_ls_id) + '-' + convert(varchar(4), @new_ls_year)
 
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
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2932, convert(varchar(255), @old_ls_id), convert(varchar(255), @new_ls_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_year <> @new_ls_year
          or
          ( @old_ls_year is null and @new_ls_year is not null ) 
          or
          ( @old_ls_year is not null and @new_ls_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2951, convert(varchar(255), @old_ls_year), convert(varchar(255), @new_ls_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_code <> @new_ls_code
          or
          ( @old_ls_code is null and @new_ls_code is not null ) 
          or
          ( @old_ls_code is not null and @new_ls_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2929, convert(varchar(255), @old_ls_code), convert(varchar(255), @new_ls_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_ag_or_mkt <> @new_ls_ag_or_mkt
          or
          ( @old_ls_ag_or_mkt is null and @new_ls_ag_or_mkt is not null ) 
          or
          ( @old_ls_ag_or_mkt is not null and @new_ls_ag_or_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_ag_or_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2927, convert(varchar(255), @old_ls_ag_or_mkt), convert(varchar(255), @new_ls_ag_or_mkt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_method <> @new_ls_method
          or
          ( @old_ls_method is null and @new_ls_method is not null ) 
          or
          ( @old_ls_method is not null and @new_ls_method is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_method' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2934, convert(varchar(255), @old_ls_method), convert(varchar(255), @new_ls_method) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_interpolate <> @new_ls_interpolate
          or
          ( @old_ls_interpolate is null and @new_ls_interpolate is not null ) 
          or
          ( @old_ls_interpolate is not null and @new_ls_interpolate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_interpolate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2933, convert(varchar(255), @old_ls_interpolate), convert(varchar(255), @new_ls_interpolate) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_up <> @new_ls_up
          or
          ( @old_ls_up is null and @new_ls_up is not null ) 
          or
          ( @old_ls_up is not null and @new_ls_up is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_up' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2949, convert(varchar(255), @old_ls_up), convert(varchar(255), @new_ls_up) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_base_price <> @new_ls_base_price
          or
          ( @old_ls_base_price is null and @new_ls_base_price is not null ) 
          or
          ( @old_ls_base_price is not null and @new_ls_base_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_base_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2928, convert(varchar(255), @old_ls_base_price), convert(varchar(255), @new_ls_base_price) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_std_depth <> @new_ls_std_depth
          or
          ( @old_ls_std_depth is null and @new_ls_std_depth is not null ) 
          or
          ( @old_ls_std_depth is not null and @new_ls_std_depth is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_std_depth' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2947, convert(varchar(255), @old_ls_std_depth), convert(varchar(255), @new_ls_std_depth) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_plus_dev_ft <> @new_ls_plus_dev_ft
          or
          ( @old_ls_plus_dev_ft is null and @new_ls_plus_dev_ft is not null ) 
          or
          ( @old_ls_plus_dev_ft is not null and @new_ls_plus_dev_ft is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_plus_dev_ft' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2939, convert(varchar(255), @old_ls_plus_dev_ft), convert(varchar(255), @new_ls_plus_dev_ft) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_plus_dev_amt <> @new_ls_plus_dev_amt
          or
          ( @old_ls_plus_dev_amt is null and @new_ls_plus_dev_amt is not null ) 
          or
          ( @old_ls_plus_dev_amt is not null and @new_ls_plus_dev_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_plus_dev_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2938, convert(varchar(255), @old_ls_plus_dev_amt), convert(varchar(255), @new_ls_plus_dev_amt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_minus_dev_ft <> @new_ls_minus_dev_ft
          or
          ( @old_ls_minus_dev_ft is null and @new_ls_minus_dev_ft is not null ) 
          or
          ( @old_ls_minus_dev_ft is not null and @new_ls_minus_dev_ft is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_minus_dev_ft' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2936, convert(varchar(255), @old_ls_minus_dev_ft), convert(varchar(255), @new_ls_minus_dev_ft) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_minus_dev_amt <> @new_ls_minus_dev_amt
          or
          ( @old_ls_minus_dev_amt is null and @new_ls_minus_dev_amt is not null ) 
          or
          ( @old_ls_minus_dev_amt is not null and @new_ls_minus_dev_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_minus_dev_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2935, convert(varchar(255), @old_ls_minus_dev_amt), convert(varchar(255), @new_ls_minus_dev_amt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
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
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'changed_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 647, convert(varchar(255), @old_changed_flag), convert(varchar(255), @new_changed_flag) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_ff_type <> @new_ls_ff_type
          or
          ( @old_ls_ff_type is null and @new_ls_ff_type is not null ) 
          or
          ( @old_ls_ff_type is not null and @new_ls_ff_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_ff_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2931, convert(varchar(255), @old_ls_ff_type), convert(varchar(255), @new_ls_ff_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_slope_intercept <> @new_ls_slope_intercept
          or
          ( @old_ls_slope_intercept is null and @new_ls_slope_intercept is not null ) 
          or
          ( @old_ls_slope_intercept is not null and @new_ls_slope_intercept is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'ls_slope_intercept' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 2946, convert(varchar(255), @old_ls_slope_intercept), convert(varchar(255), @new_ls_slope_intercept) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_matrix_id <> @new_matrix_id
          or
          ( @old_matrix_id is null and @new_matrix_id is not null ) 
          or
          ( @old_matrix_id is not null and @new_matrix_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched' and
                    chg_log_columns = 'matrix_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 362, 8682, convert(varchar(255), @old_matrix_id), convert(varchar(255), @new_matrix_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_ls_id, @old_ls_year, @old_ls_code, @old_ls_ag_or_mkt, @old_ls_method, @old_ls_interpolate, @old_ls_up, @old_ls_base_price, @old_ls_std_depth, @old_ls_plus_dev_ft, @old_ls_plus_dev_amt, @old_ls_minus_dev_ft, @old_ls_minus_dev_amt, @old_changed_flag, @old_ls_ff_type, @old_ls_slope_intercept, @old_matrix_id, @new_ls_id, @new_ls_year, @new_ls_code, @new_ls_ag_or_mkt, @new_ls_method, @new_ls_interpolate, @new_ls_up, @new_ls_base_price, @new_ls_std_depth, @new_ls_plus_dev_ft, @new_ls_plus_dev_amt, @new_ls_minus_dev_ft, @new_ls_minus_dev_amt, @new_changed_flag, @new_ls_ff_type, @new_ls_slope_intercept, @new_matrix_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_land_sched_delete_insert_update_MemTable
on land_sched
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
where szTableName = 'land_sched'

GO



create trigger tr_land_sched_delete_ChangeLog
on land_sched
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
          chg_log_tables = 'land_sched' and
          chg_log_audit = 1
)
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
 
declare @ls_id int
declare @ls_year numeric(4,0)
 
declare curRows cursor
for
     select ls_id, case ls_year when 0 then @tvar_lFutureYear else ls_year end from deleted
for read only
 
open curRows
fetch next from curRows into @ls_id, @ls_year
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @ls_id) + '-' + convert(varchar(4), @ls_year)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 362, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
 
     fetch next from curRows into @ls_id, @ls_year
end
 
close curRows
deallocate curRows

GO



create trigger tr_land_sched_insert_ChangeLog
on land_sched
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
 
declare @ls_id int
declare @ls_year numeric(4,0)
declare @ls_code char(25)
declare @ls_ag_or_mkt char(1)
declare @ls_method char(5)
declare @ls_interpolate char(1)
declare @ls_up numeric(14,2)
declare @ls_base_price numeric(14,2)
declare @ls_std_depth numeric(14,4)
declare @ls_plus_dev_ft numeric(14,4)
declare @ls_plus_dev_amt numeric(14,2)
declare @ls_minus_dev_ft numeric(14,4)
declare @ls_minus_dev_amt numeric(14,2)
declare @changed_flag char(1)
declare @ls_ff_type char(1)
declare @ls_slope_intercept bit
declare @matrix_id int
 
declare curRows cursor
for
     select ls_id, case ls_year when 0 then @tvar_lFutureYear else ls_year end, ls_code, ls_ag_or_mkt, ls_method, ls_interpolate, ls_up, ls_base_price, ls_std_depth, ls_plus_dev_ft, ls_plus_dev_amt, ls_minus_dev_ft, ls_minus_dev_amt, changed_flag, ls_ff_type, ls_slope_intercept, matrix_id from inserted
for read only
 
open curRows
fetch next from curRows into @ls_id, @ls_year, @ls_code, @ls_ag_or_mkt, @ls_method, @ls_interpolate, @ls_up, @ls_base_price, @ls_std_depth, @ls_plus_dev_ft, @ls_plus_dev_amt, @ls_minus_dev_ft, @ls_minus_dev_amt, @changed_flag, @ls_ff_type, @ls_slope_intercept, @matrix_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @ls_id) + '-' + convert(varchar(4), @ls_year)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2932, null, convert(varchar(255), @ls_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2951, null, convert(varchar(255), @ls_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2929, null, convert(varchar(255), @ls_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_ag_or_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2927, null, convert(varchar(255), @ls_ag_or_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_method' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2934, null, convert(varchar(255), @ls_method), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_interpolate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2933, null, convert(varchar(255), @ls_interpolate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_up' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2949, null, convert(varchar(255), @ls_up), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_base_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2928, null, convert(varchar(255), @ls_base_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_std_depth' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2947, null, convert(varchar(255), @ls_std_depth), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_plus_dev_ft' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2939, null, convert(varchar(255), @ls_plus_dev_ft), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_plus_dev_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2938, null, convert(varchar(255), @ls_plus_dev_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_minus_dev_ft' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2936, null, convert(varchar(255), @ls_minus_dev_ft), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_minus_dev_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2935, null, convert(varchar(255), @ls_minus_dev_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'changed_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 647, null, convert(varchar(255), @changed_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_ff_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2931, null, convert(varchar(255), @ls_ff_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'ls_slope_intercept' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 2946, null, convert(varchar(255), @ls_slope_intercept), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched' and
               chg_log_columns = 'matrix_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 362, 8682, null, convert(varchar(255), @matrix_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @ls_id, @ls_year, @ls_code, @ls_ag_or_mkt, @ls_method, @ls_interpolate, @ls_up, @ls_base_price, @ls_std_depth, @ls_plus_dev_ft, @ls_plus_dev_amt, @ls_minus_dev_ft, @ls_minus_dev_amt, @changed_flag, @ls_ff_type, @ls_slope_intercept, @matrix_id
end
 
close curRows
deallocate curRows

GO

