CREATE TABLE [dbo].[imprv_sched_detail] (
    [imprv_det_meth_cd]      CHAR (5)        NOT NULL,
    [imprv_det_type_cd]      CHAR (10)       NOT NULL,
    [imprv_det_class_cd]     CHAR (10)       NOT NULL,
    [imprv_yr]               NUMERIC (4)     NOT NULL,
    [stories]                VARCHAR (5)     CONSTRAINT [CDF_imprv_sched_detail_stories] DEFAULT (1) NOT NULL,
    [range_max]              NUMERIC (18, 1) NOT NULL,
    [range_price]            NUMERIC (14, 2) NULL,
    [range_pc]               NUMERIC (5, 2)  NULL,
    [range_adj_price]        NUMERIC (14, 2) NULL,
    [range_interpolate_inc]  NUMERIC (14, 6) NULL,
    [imprv_det_sub_class_cd] VARCHAR (10)    NOT NULL,
    CONSTRAINT [CPK_imprv_sched_detail] PRIMARY KEY CLUSTERED ([imprv_yr] ASC, [imprv_det_meth_cd] ASC, [imprv_det_type_cd] ASC, [imprv_det_class_cd] ASC, [imprv_det_sub_class_cd] ASC, [stories] ASC, [range_max] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_imprv_sched_detail_imprv_yr_imprv_det_meth_cd_imprv_det_type_cd_imprv_det_class_cd_imprv_det_sub_class_cd] FOREIGN KEY ([imprv_yr], [imprv_det_meth_cd], [imprv_det_type_cd], [imprv_det_class_cd], [imprv_det_sub_class_cd]) REFERENCES [dbo].[imprv_sched] ([imprv_yr], [imprv_det_meth_cd], [imprv_det_type_cd], [imprv_det_class_cd], [imprv_det_sub_class_cd])
);


GO

 
create trigger tr_imprv_sched_detail_delete_ChangeLog
on imprv_sched_detail
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
          chg_log_tables = 'imprv_sched_detail' and
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
declare @stories varchar(5)
declare @range_max numeric(18,1)
declare @imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select imprv_det_meth_cd, imprv_det_type_cd, imprv_det_class_cd, case imprv_yr when 0 then @tvar_lFutureYear else imprv_yr end, stories, range_max, imprv_det_sub_class_cd from deleted
for read only
 
open curRows
fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @stories, @range_max, @imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @imprv_det_meth_cd + '-' + @imprv_det_type_cd + '-' + @imprv_det_class_cd + '-' + @imprv_det_sub_class_cd + '-' + convert(varchar(4), @imprv_yr) + '-' + convert(varchar(24), @range_max)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 329, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
 
     fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @stories, @range_max, @imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_imprv_sched_detail_update_ChangeLog
on imprv_sched_detail
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
declare @old_stories varchar(5)
declare @new_stories varchar(5)
declare @old_range_max numeric(18,1)
declare @new_range_max numeric(18,1)
declare @old_range_price numeric(14,2)
declare @new_range_price numeric(14,2)
declare @old_range_pc numeric(5,2)
declare @new_range_pc numeric(5,2)
declare @old_range_adj_price numeric(14,2)
declare @new_range_adj_price numeric(14,2)
declare @old_range_interpolate_inc numeric(14,6)
declare @new_range_interpolate_inc numeric(14,6)
declare @old_imprv_det_sub_class_cd varchar(10)
declare @new_imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select d.imprv_det_meth_cd, d.imprv_det_type_cd, d.imprv_det_class_cd, case d.imprv_yr when 0 then @tvar_lFutureYear else d.imprv_yr end, d.stories, d.range_max, d.range_price, d.range_pc, d.range_adj_price, d.range_interpolate_inc, d.imprv_det_sub_class_cd, 
            i.imprv_det_meth_cd, i.imprv_det_type_cd, i.imprv_det_class_cd, case i.imprv_yr when 0 then @tvar_lFutureYear else i.imprv_yr end, i.stories, i.range_max, i.range_price, i.range_pc, i.range_adj_price, i.range_interpolate_inc, i.imprv_det_sub_class_cd
from deleted as d
join inserted as i on 
     d.imprv_det_meth_cd = i.imprv_det_meth_cd and
     d.imprv_det_type_cd = i.imprv_det_type_cd and
     d.imprv_det_class_cd = i.imprv_det_class_cd and
     d.imprv_yr = i.imprv_yr and
     d.stories = i.stories and
     d.range_max = i.range_max and
     d.imprv_det_sub_class_cd = i.imprv_det_sub_class_cd
for read only
 
open curRows
fetch next from curRows into @old_imprv_det_meth_cd, @old_imprv_det_type_cd, @old_imprv_det_class_cd, @old_imprv_yr, @old_stories, @old_range_max, @old_range_price, @old_range_pc, @old_range_adj_price, @old_range_interpolate_inc, @old_imprv_det_sub_class_cd, 
                             @new_imprv_det_meth_cd, @new_imprv_det_type_cd, @new_imprv_det_class_cd, @new_imprv_yr, @new_stories, @new_range_max, @new_range_price, @new_range_pc, @new_range_adj_price, @new_range_interpolate_inc, @new_imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_imprv_det_meth_cd + '-' + @new_imprv_det_type_cd + '-' + @new_imprv_det_class_cd + '-' + @new_imprv_det_sub_class_cd + '-' + convert(varchar(4), @new_imprv_yr) + '-' + convert(varchar(24), @new_range_max)
 
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
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'imprv_det_meth_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 2257, convert(varchar(255), @old_imprv_det_meth_cd), convert(varchar(255), @new_imprv_det_meth_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
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
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'imprv_det_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 2263, convert(varchar(255), @old_imprv_det_type_cd), convert(varchar(255), @new_imprv_det_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
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
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'imprv_det_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 2252, convert(varchar(255), @old_imprv_det_class_cd), convert(varchar(255), @new_imprv_det_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
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
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'imprv_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 2332, convert(varchar(255), @old_imprv_yr), convert(varchar(255), @new_imprv_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_stories <> @new_stories
          or
          ( @old_stories is null and @new_stories is not null ) 
          or
          ( @old_stories is not null and @new_stories is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'stories' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 4958, convert(varchar(255), @old_stories), convert(varchar(255), @new_stories), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_range_max <> @new_range_max
          or
          ( @old_range_max is null and @new_range_max is not null ) 
          or
          ( @old_range_max is not null and @new_range_max is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'range_max' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 4246, convert(varchar(255), @old_range_max), convert(varchar(255), @new_range_max), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_range_price <> @new_range_price
          or
          ( @old_range_price is null and @new_range_price is not null ) 
          or
          ( @old_range_price is not null and @new_range_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'range_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 4248, convert(varchar(255), @old_range_price), convert(varchar(255), @new_range_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_range_pc <> @new_range_pc
          or
          ( @old_range_pc is null and @new_range_pc is not null ) 
          or
          ( @old_range_pc is not null and @new_range_pc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'range_pc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 4247, convert(varchar(255), @old_range_pc), convert(varchar(255), @new_range_pc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_range_adj_price <> @new_range_adj_price
          or
          ( @old_range_adj_price is null and @new_range_adj_price is not null ) 
          or
          ( @old_range_adj_price is not null and @new_range_adj_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'range_adj_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 4244, convert(varchar(255), @old_range_adj_price), convert(varchar(255), @new_range_adj_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     if (
          @old_range_interpolate_inc <> @new_range_interpolate_inc
          or
          ( @old_range_interpolate_inc is null and @new_range_interpolate_inc is not null ) 
          or
          ( @old_range_interpolate_inc is not null and @new_range_interpolate_inc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'range_interpolate_inc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 4245, convert(varchar(255), @old_range_interpolate_inc), convert(varchar(255), @new_range_interpolate_inc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
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
                    chg_log_tables = 'imprv_sched_detail' and
                    chg_log_columns = 'imprv_det_sub_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 329, 6106, convert(varchar(255), @old_imprv_det_sub_class_cd), convert(varchar(255), @new_imprv_det_sub_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @new_imprv_det_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @new_imprv_yr), case when @new_imprv_yr > @tvar_intMin and @new_imprv_yr < @tvar_intMax then convert(int, round(@new_imprv_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @new_stories), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @new_range_max), case when @new_range_max > @tvar_intMin and @new_range_max < @tvar_intMax then convert(int, round(@new_range_max, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @new_imprv_det_sub_class_cd), 0)
          end
     end
 
     fetch next from curRows into @old_imprv_det_meth_cd, @old_imprv_det_type_cd, @old_imprv_det_class_cd, @old_imprv_yr, @old_stories, @old_range_max, @old_range_price, @old_range_pc, @old_range_adj_price, @old_range_interpolate_inc, @old_imprv_det_sub_class_cd, 
                                  @new_imprv_det_meth_cd, @new_imprv_det_type_cd, @new_imprv_det_class_cd, @new_imprv_yr, @new_stories, @new_range_max, @new_range_price, @new_range_pc, @new_range_adj_price, @new_range_interpolate_inc, @new_imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO



create trigger tr_imprv_sched_detail_delete_insert_update_MemTable
on imprv_sched_detail
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
where szTableName = 'imprv_sched_detail'

GO

 
create trigger tr_imprv_sched_detail_insert_ChangeLog
on imprv_sched_detail
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
declare @stories varchar(5)
declare @range_max numeric(18,1)
declare @range_price numeric(14,2)
declare @range_pc numeric(5,2)
declare @range_adj_price numeric(14,2)
declare @range_interpolate_inc numeric(14,6)
declare @imprv_det_sub_class_cd varchar(10)
 
declare curRows cursor
for
     select imprv_det_meth_cd, imprv_det_type_cd, imprv_det_class_cd, case imprv_yr when 0 then @tvar_lFutureYear else imprv_yr end, stories, range_max, range_price, range_pc, range_adj_price, range_interpolate_inc, imprv_det_sub_class_cd from inserted
for read only
 
open curRows
fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @stories, @range_max, @range_price, @range_pc, @range_adj_price, @range_interpolate_inc, @imprv_det_sub_class_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @imprv_det_meth_cd + '-' + @imprv_det_type_cd + '-' + @imprv_det_class_cd + '-' + @imprv_det_sub_class_cd + '-' + convert(varchar(4), @imprv_yr) + '-' + convert(varchar(24), @range_max)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'imprv_det_meth_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 2257, null, convert(varchar(255), @imprv_det_meth_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'imprv_det_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 2263, null, convert(varchar(255), @imprv_det_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'imprv_det_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 2252, null, convert(varchar(255), @imprv_det_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'imprv_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 2332, null, convert(varchar(255), @imprv_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'stories' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 4958, null, convert(varchar(255), @stories), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'range_max' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 4246, null, convert(varchar(255), @range_max), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'range_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 4248, null, convert(varchar(255), @range_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'range_pc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 4247, null, convert(varchar(255), @range_pc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'range_adj_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 4244, null, convert(varchar(255), @range_adj_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'range_interpolate_inc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 4245, null, convert(varchar(255), @range_interpolate_inc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_detail' and
               chg_log_columns = 'imprv_det_sub_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 329, 6106, null, convert(varchar(255), @imprv_det_sub_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2252, convert(varchar(24), @imprv_det_class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2332, convert(varchar(24), @imprv_yr), case when @imprv_yr > @tvar_intMin and @imprv_yr < @tvar_intMax then convert(int, round(@imprv_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4958, convert(varchar(24), @stories), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4246, convert(varchar(24), @range_max), case when @range_max > @tvar_intMin and @range_max < @tvar_intMax then convert(int, round(@range_max, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 6106, convert(varchar(24), @imprv_det_sub_class_cd), 0)
     end
 
     fetch next from curRows into @imprv_det_meth_cd, @imprv_det_type_cd, @imprv_det_class_cd, @imprv_yr, @stories, @range_max, @range_price, @range_pc, @range_adj_price, @range_interpolate_inc, @imprv_det_sub_class_cd
end
 
close curRows
deallocate curRows

GO

