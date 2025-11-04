CREATE TABLE [dbo].[land_sched_detail] (
    [ls_detail_id]             INT             NOT NULL,
    [ls_id]                    INT             NOT NULL,
    [ls_year]                  NUMERIC (4)     NOT NULL,
    [ls_range_max]             NUMERIC (18, 4) NOT NULL,
    [ls_range_price]           NUMERIC (14, 2) NOT NULL,
    [ls_range_pc]              NUMERIC (5, 2)  NULL,
    [ls_range_adj_price]       NUMERIC (14, 2) NULL,
    [ls_range_interpolate_inc] NUMERIC (14, 6) NULL,
    [land_price_type]          VARCHAR (5)     NOT NULL,
    CONSTRAINT [CPK_land_sched_detail] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [ls_detail_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_land_sched_detail_ls_id_ls_year] FOREIGN KEY ([ls_id], [ls_year]) REFERENCES [dbo].[land_sched] ([ls_id], [ls_year])
);


GO

CREATE NONCLUSTERED INDEX [idx_ls_id]
    ON [dbo].[land_sched_detail]([ls_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_land_sched_detail_update_ChangeLog
on land_sched_detail
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
 
declare @old_ls_detail_id int
declare @new_ls_detail_id int
declare @old_ls_id int
declare @new_ls_id int
declare @old_ls_year numeric(4,0)
declare @new_ls_year numeric(4,0)
declare @old_ls_range_max numeric(18,4)
declare @new_ls_range_max numeric(18,4)
declare @old_ls_range_price numeric(14,2)
declare @new_ls_range_price numeric(14,2)
declare @old_ls_range_pc numeric(5,2)
declare @new_ls_range_pc numeric(5,2)
declare @old_ls_range_adj_price numeric(14,2)
declare @new_ls_range_adj_price numeric(14,2)
declare @old_ls_range_interpolate_inc numeric(14,6)
declare @new_ls_range_interpolate_inc numeric(14,6)
 
declare curRows cursor
for
     select d.ls_detail_id, d.ls_id, case d.ls_year when 0 then @tvar_lFutureYear else d.ls_year end, d.ls_range_max, d.ls_range_price, d.ls_range_pc, d.ls_range_adj_price, d.ls_range_interpolate_inc, i.ls_detail_id, i.ls_id, case i.ls_year when 0 then @tvar_lFutureYear else i.ls_year end, i.ls_range_max, i.ls_range_price, i.ls_range_pc, i.ls_range_adj_price, i.ls_range_interpolate_inc
from deleted as d
join inserted as i on 
     d.ls_detail_id = i.ls_detail_id and
     d.ls_id = i.ls_id and
     d.ls_year = i.ls_year
for read only
 
open curRows
fetch next from curRows into @old_ls_detail_id, @old_ls_id, @old_ls_year, @old_ls_range_max, @old_ls_range_price, @old_ls_range_pc, @old_ls_range_adj_price, @old_ls_range_interpolate_inc, @new_ls_detail_id, @new_ls_id, @new_ls_year, @new_ls_range_max, @new_ls_range_price, @new_ls_range_pc, @new_ls_range_adj_price, @new_ls_range_interpolate_inc
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @new_ls_detail_id) + '-' + convert(varchar(12), @new_ls_id) + '-' + convert(varchar(4), @new_ls_year)
 
     if (
          @old_ls_detail_id <> @new_ls_detail_id
          or
          ( @old_ls_detail_id is null and @new_ls_detail_id is not null ) 
          or
          ( @old_ls_detail_id is not null and @new_ls_detail_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_detail' and
                    chg_log_columns = 'ls_detail_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 363, 2930, convert(varchar(255), @old_ls_detail_id), convert(varchar(255), @new_ls_detail_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @new_ls_detail_id), @new_ls_detail_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
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
                    chg_log_tables = 'land_sched_detail' and
                    chg_log_columns = 'ls_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 363, 2932, convert(varchar(255), @old_ls_id), convert(varchar(255), @new_ls_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @new_ls_detail_id), @new_ls_detail_id)
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
                    chg_log_tables = 'land_sched_detail' and
                    chg_log_columns = 'ls_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 363, 2951, convert(varchar(255), @old_ls_year), convert(varchar(255), @new_ls_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @new_ls_detail_id), @new_ls_detail_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_range_max <> @new_ls_range_max
          or
          ( @old_ls_range_max is null and @new_ls_range_max is not null ) 
          or
          ( @old_ls_range_max is not null and @new_ls_range_max is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_detail' and
                    chg_log_columns = 'ls_range_max' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 363, 2942, convert(varchar(255), @old_ls_range_max), convert(varchar(255), @new_ls_range_max) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @new_ls_detail_id), @new_ls_detail_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_range_price <> @new_ls_range_price
          or
          ( @old_ls_range_price is null and @new_ls_range_price is not null ) 
          or
          ( @old_ls_range_price is not null and @new_ls_range_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_detail' and
                    chg_log_columns = 'ls_range_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 363, 2944, convert(varchar(255), @old_ls_range_price), convert(varchar(255), @new_ls_range_price) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @new_ls_detail_id), @new_ls_detail_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_range_pc <> @new_ls_range_pc
          or
          ( @old_ls_range_pc is null and @new_ls_range_pc is not null ) 
          or
          ( @old_ls_range_pc is not null and @new_ls_range_pc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_detail' and
                    chg_log_columns = 'ls_range_pc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 363, 2943, convert(varchar(255), @old_ls_range_pc), convert(varchar(255), @new_ls_range_pc) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @new_ls_detail_id), @new_ls_detail_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_range_adj_price <> @new_ls_range_adj_price
          or
          ( @old_ls_range_adj_price is null and @new_ls_range_adj_price is not null ) 
          or
          ( @old_ls_range_adj_price is not null and @new_ls_range_adj_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_detail' and
                    chg_log_columns = 'ls_range_adj_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 363, 2940, convert(varchar(255), @old_ls_range_adj_price), convert(varchar(255), @new_ls_range_adj_price) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @new_ls_detail_id), @new_ls_detail_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_range_interpolate_inc <> @new_ls_range_interpolate_inc
          or
          ( @old_ls_range_interpolate_inc is null and @new_ls_range_interpolate_inc is not null ) 
          or
          ( @old_ls_range_interpolate_inc is not null and @new_ls_range_interpolate_inc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_detail' and
                    chg_log_columns = 'ls_range_interpolate_inc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 363, 2941, convert(varchar(255), @old_ls_range_interpolate_inc), convert(varchar(255), @new_ls_range_interpolate_inc) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @new_ls_detail_id), @new_ls_detail_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_ls_detail_id, @old_ls_id, @old_ls_year, @old_ls_range_max, @old_ls_range_price, @old_ls_range_pc, @old_ls_range_adj_price, @old_ls_range_interpolate_inc, @new_ls_detail_id, @new_ls_id, @new_ls_year, @new_ls_range_max, @new_ls_range_price, @new_ls_range_pc, @new_ls_range_adj_price, @new_ls_range_interpolate_inc
end
 
close curRows
deallocate curRows

GO



create trigger tr_land_sched_detail_insert_ChangeLog
on land_sched_detail
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
 
declare @ls_detail_id int
declare @ls_id int
declare @ls_year numeric(4,0)
declare @ls_range_max numeric(18,4)
declare @ls_range_price numeric(14,2)
declare @ls_range_pc numeric(5,2)
declare @ls_range_adj_price numeric(14,2)
declare @ls_range_interpolate_inc numeric(14,6)
 
declare curRows cursor
for
     select ls_detail_id, ls_id, case ls_year when 0 then @tvar_lFutureYear else ls_year end, ls_range_max, ls_range_price, ls_range_pc, ls_range_adj_price, ls_range_interpolate_inc from inserted
for read only
 
open curRows
fetch next from curRows into @ls_detail_id, @ls_id, @ls_year, @ls_range_max, @ls_range_price, @ls_range_pc, @ls_range_adj_price, @ls_range_interpolate_inc
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @ls_detail_id) + '-' + convert(varchar(12), @ls_id) + '-' + convert(varchar(4), @ls_year)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_detail' and
               chg_log_columns = 'ls_detail_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 363, 2930, null, convert(varchar(255), @ls_detail_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_detail' and
               chg_log_columns = 'ls_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 363, 2932, null, convert(varchar(255), @ls_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_detail' and
               chg_log_columns = 'ls_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 363, 2951, null, convert(varchar(255), @ls_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_detail' and
               chg_log_columns = 'ls_range_max' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 363, 2942, null, convert(varchar(255), @ls_range_max), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_detail' and
               chg_log_columns = 'ls_range_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 363, 2944, null, convert(varchar(255), @ls_range_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_detail' and
               chg_log_columns = 'ls_range_pc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 363, 2943, null, convert(varchar(255), @ls_range_pc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_detail' and
               chg_log_columns = 'ls_range_adj_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 363, 2940, null, convert(varchar(255), @ls_range_adj_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_detail' and
               chg_log_columns = 'ls_range_interpolate_inc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 363, 2941, null, convert(varchar(255), @ls_range_interpolate_inc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @ls_detail_id, @ls_id, @ls_year, @ls_range_max, @ls_range_price, @ls_range_pc, @ls_range_adj_price, @ls_range_interpolate_inc
end
 
close curRows
deallocate curRows

GO



create trigger tr_land_sched_detail_delete_ChangeLog
on land_sched_detail
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
          chg_log_tables = 'land_sched_detail' and
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
 
declare @ls_detail_id int
declare @ls_id int
declare @ls_year numeric(4,0)
 
declare curRows cursor
for
     select ls_detail_id, ls_id, case ls_year when 0 then @tvar_lFutureYear else ls_year end from deleted
for read only
 
open curRows
fetch next from curRows into @ls_detail_id, @ls_id, @ls_year
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @ls_detail_id) + '-' + convert(varchar(12), @ls_id) + '-' + convert(varchar(4), @ls_year)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 363, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2930, convert(varchar(24), @ls_detail_id), @ls_detail_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
 
     fetch next from curRows into @ls_detail_id, @ls_id, @ls_year
end
 
close curRows
deallocate curRows

GO



create trigger tr_land_sched_detail_delete_insert_update_MemTable
on land_sched_detail
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
where szTableName = 'land_sched_detail'

GO

