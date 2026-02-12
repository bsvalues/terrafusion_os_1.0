CREATE TABLE [dbo].[land_adj] (
    [prop_id]             INT            NOT NULL,
    [prop_val_yr]         NUMERIC (4)    NOT NULL,
    [land_seg_id]         INT            NOT NULL,
    [land_seg_adj_seq]    INT            NOT NULL,
    [sup_num]             INT            NOT NULL,
    [sale_id]             INT            NOT NULL,
    [land_value]          NUMERIC (10)   NULL,
    [land_seg_adj_dt]     DATETIME       NULL,
    [land_seg_adj_type]   CHAR (5)       NULL,
    [land_seg_adj_desc]   VARCHAR (50)   NULL,
    [land_seg_adj_cd]     CHAR (5)       NULL,
    [land_seg_adj_pc]     NUMERIC (5, 2) NULL,
    [land_seg_adj_method] CHAR (1)       CONSTRAINT [CDF_land_adj_land_seg_adj_method] DEFAULT ('A') NOT NULL,
    CONSTRAINT [CPK_land_adj] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [land_seg_id] ASC, [land_seg_adj_seq] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_land_adj_prop_val_yr_land_seg_adj_type] FOREIGN KEY ([prop_val_yr], [land_seg_adj_type]) REFERENCES [dbo].[land_adj_type] ([land_adj_type_year], [land_adj_type_cd]),
    CONSTRAINT [CFK_land_adj_prop_val_yr_sup_num_sale_id_prop_id_land_seg_id] FOREIGN KEY ([prop_val_yr], [sup_num], [sale_id], [prop_id], [land_seg_id]) REFERENCES [dbo].[land_detail] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [land_seg_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[land_adj]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_land_adj_insert_ChangeLog
on land_adj
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
 
declare @prop_id int
declare @prop_val_yr numeric(4,0)
declare @land_seg_id int
declare @land_seg_adj_seq int
declare @sup_num int
declare @sale_id int
declare @land_value numeric(10,0)
declare @land_seg_adj_dt datetime
declare @land_seg_adj_type char(5)
declare @land_seg_adj_desc varchar(50)
declare @land_seg_adj_cd char(5)
declare @land_seg_adj_pc numeric(5,2)
 
declare curRows cursor
for
     select prop_id, case prop_val_yr when 0 then @tvar_lFutureYear else prop_val_yr end, land_seg_id, land_seg_adj_seq, sup_num, sale_id, land_value, land_seg_adj_dt, land_seg_adj_type, land_seg_adj_desc, land_seg_adj_cd, land_seg_adj_pc from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @land_seg_id, @land_seg_adj_seq, @sup_num, @sale_id, @land_value, @land_seg_adj_dt, @land_seg_adj_type, @land_seg_adj_desc, @land_seg_adj_cd, @land_seg_adj_pc
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = ld.land_type_cd + '-' + @land_seg_adj_type
     from land_detail as ld with(nolock)
     where ld.prop_id = @prop_id
     and ld.prop_val_yr = @prop_val_yr
     and ld.sup_num = @sup_num
     and ld.land_seg_id = @land_seg_id
     and ld.sale_id = @sale_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'land_seg_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 2667, null, convert(varchar(255), @land_seg_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'land_seg_adj_seq' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 2662, null, convert(varchar(255), @land_seg_adj_seq), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'sale_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 4485, null, convert(varchar(255), @sale_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'land_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 2704, null, convert(varchar(255), @land_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'land_seg_adj_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 2660, null, convert(varchar(255), @land_seg_adj_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'land_seg_adj_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 2663, null, convert(varchar(255), @land_seg_adj_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'land_seg_adj_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 2659, null, convert(varchar(255), @land_seg_adj_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'land_seg_adj_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 2658, null, convert(varchar(255), @land_seg_adj_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj' and
               chg_log_columns = 'land_seg_adj_pc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 356, 2661, null, convert(varchar(255), @land_seg_adj_pc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     fetch next from curRows into @prop_id, @prop_val_yr, @land_seg_id, @land_seg_adj_seq, @sup_num, @sale_id, @land_value, @land_seg_adj_dt, @land_seg_adj_type, @land_seg_adj_desc, @land_seg_adj_cd, @land_seg_adj_pc
end
 
close curRows
deallocate curRows

GO



create trigger tr_land_adj_update_ChangeLog
on land_adj
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
 
declare @old_prop_id int
declare @new_prop_id int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_land_seg_id int
declare @new_land_seg_id int
declare @old_land_seg_adj_seq int
declare @new_land_seg_adj_seq int
declare @old_sup_num int
declare @new_sup_num int
declare @old_sale_id int
declare @new_sale_id int
declare @old_land_value numeric(10,0)
declare @new_land_value numeric(10,0)
declare @old_land_seg_adj_dt datetime
declare @new_land_seg_adj_dt datetime
declare @old_land_seg_adj_type char(5)
declare @new_land_seg_adj_type char(5)
declare @old_land_seg_adj_desc varchar(50)
declare @new_land_seg_adj_desc varchar(50)
declare @old_land_seg_adj_cd char(5)
declare @new_land_seg_adj_cd char(5)
declare @old_land_seg_adj_pc numeric(5,2)
declare @new_land_seg_adj_pc numeric(5,2)
 
declare curRows cursor
for
     select d.prop_id, case d.prop_val_yr when 0 then @tvar_lFutureYear else d.prop_val_yr end, d.land_seg_id, d.land_seg_adj_seq, d.sup_num, d.sale_id, d.land_value, d.land_seg_adj_dt, d.land_seg_adj_type, d.land_seg_adj_desc, d.land_seg_adj_cd, d.land_seg_adj_pc, i.prop_id, case i.prop_val_yr when 0 then @tvar_lFutureYear else i.prop_val_yr end, i.land_seg_id, i.land_seg_adj_seq, i.sup_num, i.sale_id, i.land_value, i.land_seg_adj_dt, i.land_seg_adj_type, i.land_seg_adj_desc, i.land_seg_adj_cd, i.land_seg_adj_pc
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.prop_val_yr = i.prop_val_yr and
     d.land_seg_id = i.land_seg_id and
     d.land_seg_adj_seq = i.land_seg_adj_seq and
     d.sup_num = i.sup_num and
     d.sale_id = i.sale_id
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_land_seg_id, @old_land_seg_adj_seq, @old_sup_num, @old_sale_id, @old_land_value, @old_land_seg_adj_dt, @old_land_seg_adj_type, @old_land_seg_adj_desc, @old_land_seg_adj_cd, @old_land_seg_adj_pc, @new_prop_id, @new_prop_val_yr, @new_land_seg_id, @new_land_seg_adj_seq, @new_sup_num, @new_sale_id, @new_land_value, @new_land_seg_adj_dt, @new_land_seg_adj_type, @new_land_seg_adj_desc, @new_land_seg_adj_cd, @new_land_seg_adj_pc
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = ld.land_type_cd + '-' + @new_land_seg_adj_type
     from land_detail as ld with(nolock)
     where ld.prop_id = @new_prop_id
     and ld.prop_val_yr = @new_prop_val_yr
     and ld.sup_num = @new_sup_num
     and ld.land_seg_id = @new_land_seg_id
     and ld.sale_id = @new_sale_id
 
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
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_prop_val_yr <> @new_prop_val_yr
          or
          ( @old_prop_val_yr is null and @new_prop_val_yr is not null ) 
          or
          ( @old_prop_val_yr is not null and @new_prop_val_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_land_seg_id <> @new_land_seg_id
          or
          ( @old_land_seg_id is null and @new_land_seg_id is not null ) 
          or
          ( @old_land_seg_id is not null and @new_land_seg_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'land_seg_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 2667, convert(varchar(255), @old_land_seg_id), convert(varchar(255), @new_land_seg_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_land_seg_adj_seq <> @new_land_seg_adj_seq
          or
          ( @old_land_seg_adj_seq is null and @new_land_seg_adj_seq is not null ) 
          or
          ( @old_land_seg_adj_seq is not null and @new_land_seg_adj_seq is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'land_seg_adj_seq' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 2662, convert(varchar(255), @old_land_seg_adj_seq), convert(varchar(255), @new_land_seg_adj_seq) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_sup_num <> @new_sup_num
          or
          ( @old_sup_num is null and @new_sup_num is not null ) 
          or
          ( @old_sup_num is not null and @new_sup_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_sale_id <> @new_sale_id
          or
          ( @old_sale_id is null and @new_sale_id is not null ) 
          or
          ( @old_sale_id is not null and @new_sale_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'sale_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 4485, convert(varchar(255), @old_sale_id), convert(varchar(255), @new_sale_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_land_value <> @new_land_value
          or
          ( @old_land_value is null and @new_land_value is not null ) 
          or
          ( @old_land_value is not null and @new_land_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'land_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 2704, convert(varchar(255), @old_land_value), convert(varchar(255), @new_land_value) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_land_seg_adj_dt <> @new_land_seg_adj_dt
          or
          ( @old_land_seg_adj_dt is null and @new_land_seg_adj_dt is not null ) 
          or
          ( @old_land_seg_adj_dt is not null and @new_land_seg_adj_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'land_seg_adj_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 2660, convert(varchar(255), @old_land_seg_adj_dt), convert(varchar(255), @new_land_seg_adj_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_land_seg_adj_type <> @new_land_seg_adj_type
          or
          ( @old_land_seg_adj_type is null and @new_land_seg_adj_type is not null ) 
          or
          ( @old_land_seg_adj_type is not null and @new_land_seg_adj_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'land_seg_adj_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 2663, convert(varchar(255), @old_land_seg_adj_type), convert(varchar(255), @new_land_seg_adj_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_land_seg_adj_desc <> @new_land_seg_adj_desc
          or
          ( @old_land_seg_adj_desc is null and @new_land_seg_adj_desc is not null ) 
          or
          ( @old_land_seg_adj_desc is not null and @new_land_seg_adj_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'land_seg_adj_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 2659, convert(varchar(255), @old_land_seg_adj_desc), convert(varchar(255), @new_land_seg_adj_desc) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_land_seg_adj_cd <> @new_land_seg_adj_cd
          or
          ( @old_land_seg_adj_cd is null and @new_land_seg_adj_cd is not null ) 
          or
          ( @old_land_seg_adj_cd is not null and @new_land_seg_adj_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'land_seg_adj_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 2658, convert(varchar(255), @old_land_seg_adj_cd), convert(varchar(255), @new_land_seg_adj_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_land_seg_adj_pc <> @new_land_seg_adj_pc
          or
          ( @old_land_seg_adj_pc is null and @new_land_seg_adj_pc is not null ) 
          or
          ( @old_land_seg_adj_pc is not null and @new_land_seg_adj_pc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj' and
                    chg_log_columns = 'land_seg_adj_pc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 356, 2661, convert(varchar(255), @old_land_seg_adj_pc), convert(varchar(255), @new_land_seg_adj_pc) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @new_land_seg_id), @new_land_seg_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @new_land_seg_adj_seq), @new_land_seg_adj_seq)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_land_seg_id, @old_land_seg_adj_seq, @old_sup_num, @old_sale_id, @old_land_value, @old_land_seg_adj_dt, @old_land_seg_adj_type, @old_land_seg_adj_desc, @old_land_seg_adj_cd, @old_land_seg_adj_pc, @new_prop_id, @new_prop_val_yr, @new_land_seg_id, @new_land_seg_adj_seq, @new_sup_num, @new_sale_id, @new_land_value, @new_land_seg_adj_dt, @new_land_seg_adj_type, @new_land_seg_adj_desc, @new_land_seg_adj_cd, @new_land_seg_adj_pc
end
 
close curRows
deallocate curRows

GO



create trigger tr_land_adj_delete_ChangeLog
on land_adj
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
          chg_log_tables = 'land_adj' and
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
 
declare @prop_id int
declare @prop_val_yr numeric(4,0)
declare @land_seg_id int
declare @land_seg_adj_seq int
declare @sup_num int
declare @sale_id int
 
declare curRows cursor
for
     select prop_id, case prop_val_yr when 0 then @tvar_lFutureYear else prop_val_yr end, land_seg_id, land_seg_adj_seq, sup_num, sale_id from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @land_seg_id, @land_seg_adj_seq, @sup_num, @sale_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = ld.land_type_cd + '-' + la.land_seg_adj_type
     from land_adj as la with(nolock)
     join land_detail as ld with(nolock) on
          ld.prop_id = @prop_id
          and ld.prop_val_yr = @prop_val_yr
          and ld.sup_num = @sup_num
          and ld.land_seg_id = @land_seg_id
          and ld.sale_id = @sale_id
     where
          la.prop_id = @prop_id
          and la.prop_val_yr = @prop_val_yr
          and la.sup_num = @sup_num
          and la.land_seg_id = @land_seg_id
          and la.sale_id = @sale_id
          and la.land_seg_adj_seq = @land_seg_adj_seq
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 356, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2667, convert(varchar(24), @land_seg_id), @land_seg_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2662, convert(varchar(24), @land_seg_adj_seq), @land_seg_adj_seq)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
 
     fetch next from curRows into @prop_id, @prop_val_yr, @land_seg_id, @land_seg_adj_seq, @sup_num, @sale_id
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Land Segment Adjustment Method', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_adj', @level2type = N'COLUMN', @level2name = N'land_seg_adj_method';


GO

