CREATE TABLE [dbo].[chg_of_owner_prop_assoc] (
    [chg_of_owner_id]      INT          NOT NULL,
    [prop_id]              INT          NOT NULL,
    [seq_num]              INT          NOT NULL,
    [sup_tax_yr]           NUMERIC (4)  NOT NULL,
    [imprv_hstd_val]       NUMERIC (14) NULL,
    [imprv_non_hstd_val]   NUMERIC (14) NULL,
    [land_hstd_val]        NUMERIC (14) NULL,
    [land_non_hstd_val]    NUMERIC (14) NULL,
    [ag_use_val]           NUMERIC (14) NULL,
    [ag_market]            NUMERIC (14) NULL,
    [ag_loss]              NUMERIC (14) NULL,
    [timber_use]           NUMERIC (14) NULL,
    [timber_market]        NUMERIC (14) NULL,
    [timber_loss]          NUMERIC (14) NULL,
    [appraised_val]        NUMERIC (14) NULL,
    [assessed_val]         NUMERIC (14) NULL,
    [market]               NUMERIC (14) NULL,
    [bPrimary]             BIT          NULL,
    [continue_current_use] BIT          NULL,
    CONSTRAINT [CPK_chg_of_owner_prop_assoc] PRIMARY KEY NONCLUSTERED ([chg_of_owner_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_chg_of_owner_prop_assoc_chg_of_owner_id] FOREIGN KEY ([chg_of_owner_id]) REFERENCES [dbo].[chg_of_owner] ([chg_of_owner_id]),
    CONSTRAINT [CFK_chg_of_owner_prop_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_seq_num]
    ON [dbo].[chg_of_owner_prop_assoc]([seq_num] ASC) WITH (FILLFACTOR = 90);


GO

CREATE CLUSTERED INDEX [idx_prop_id]
    ON [dbo].[chg_of_owner_prop_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_chg_of_owner_prop_assoc_insert_ChangeLog
on chg_of_owner_prop_assoc
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
 
declare @chg_of_owner_id int
declare @prop_id int
declare @seq_num int
declare @sup_tax_yr numeric(4,0)
declare @imprv_hstd_val numeric(14,0)
declare @imprv_non_hstd_val numeric(14,0)
declare @land_hstd_val numeric(14,0)
declare @land_non_hstd_val numeric(14,0)
declare @ag_use_val numeric(14,0)
declare @ag_market numeric(14,0)
declare @ag_loss numeric(14,0)
declare @timber_use numeric(14,0)
declare @timber_market numeric(14,0)
declare @timber_loss numeric(14,0)
declare @appraised_val numeric(14,0)
declare @assessed_val numeric(14,0)
declare @market numeric(14,0)
 
declare curRows cursor
for
     select chg_of_owner_id, prop_id, seq_num, sup_tax_yr, imprv_hstd_val, imprv_non_hstd_val, land_hstd_val, land_non_hstd_val, ag_use_val, ag_market, ag_loss, timber_use, timber_market, timber_loss, appraised_val, assessed_val, market from inserted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @prop_id, @seq_num, @sup_tax_yr, @imprv_hstd_val, @imprv_non_hstd_val, @land_hstd_val, @land_non_hstd_val, @ag_use_val, @ag_market, @ag_loss, @timber_use, @timber_market, @timber_loss, @appraised_val, @assessed_val, @market
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @prop_id)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'chg_of_owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 713, null, convert(varchar(255), @chg_of_owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'seq_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 4700, null, convert(varchar(255), @seq_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'sup_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 5005, null, convert(varchar(255), @sup_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'imprv_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 2274, null, convert(varchar(255), @imprv_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'imprv_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 2292, null, convert(varchar(255), @imprv_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'land_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 2594, null, convert(varchar(255), @land_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'land_non_hstd_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 2645, null, convert(varchar(255), @land_non_hstd_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'ag_use_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 143, null, convert(varchar(255), @ag_use_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'ag_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 124, null, convert(varchar(255), @ag_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'ag_loss' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 123, null, convert(varchar(255), @ag_loss), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'timber_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 5228, null, convert(varchar(255), @timber_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'timber_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 5226, null, convert(varchar(255), @timber_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'timber_loss' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 5225, null, convert(varchar(255), @timber_loss), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'appraised_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 244, null, convert(varchar(255), @appraised_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'assessed_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 338, null, convert(varchar(255), @assessed_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner_prop_assoc' and
               chg_log_columns = 'market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 160, 3010, null, convert(varchar(255), @market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     fetch next from curRows into @chg_of_owner_id, @prop_id, @seq_num, @sup_tax_yr, @imprv_hstd_val, @imprv_non_hstd_val, @land_hstd_val, @land_non_hstd_val, @ag_use_val, @ag_market, @ag_loss, @timber_use, @timber_market, @timber_loss, @appraised_val, @assessed_val, @market
end
 
close curRows
deallocate curRows

GO



create trigger tr_chg_of_owner_prop_assoc_delete_ChangeLog
on chg_of_owner_prop_assoc
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
          chg_log_tables = 'chg_of_owner_prop_assoc' and
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
 
declare @chg_of_owner_id int
declare @prop_id int
 
declare curRows cursor
for
     select chg_of_owner_id, prop_id from deleted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @prop_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @prop_id)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 160, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
 
     fetch next from curRows into @chg_of_owner_id, @prop_id
end
 
close curRows
deallocate curRows

GO


create trigger tr_chg_of_owner_prop_assoc_update_ChangeLog
on chg_of_owner_prop_assoc
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
 
declare @old_chg_of_owner_id int
declare @new_chg_of_owner_id int
declare @old_prop_id int
declare @new_prop_id int
declare @old_seq_num int
declare @new_seq_num int
declare @old_sup_tax_yr numeric(4,0)
declare @new_sup_tax_yr numeric(4,0)
declare @old_imprv_hstd_val numeric(14,0)
declare @new_imprv_hstd_val numeric(14,0)
declare @old_imprv_non_hstd_val numeric(14,0)
declare @new_imprv_non_hstd_val numeric(14,0)
declare @old_land_hstd_val numeric(14,0)
declare @new_land_hstd_val numeric(14,0)
declare @old_land_non_hstd_val numeric(14,0)
declare @new_land_non_hstd_val numeric(14,0)
declare @old_ag_use_val numeric(14,0)
declare @new_ag_use_val numeric(14,0)
declare @old_ag_market numeric(14,0)
declare @new_ag_market numeric(14,0)
declare @old_ag_loss numeric(14,0)
declare @new_ag_loss numeric(14,0)
declare @old_timber_use numeric(14,0)
declare @new_timber_use numeric(14,0)
declare @old_timber_market numeric(14,0)
declare @new_timber_market numeric(14,0)
declare @old_timber_loss numeric(14,0)
declare @new_timber_loss numeric(14,0)
declare @old_appraised_val numeric(14,0)
declare @new_appraised_val numeric(14,0)
declare @old_assessed_val numeric(14,0)
declare @new_assessed_val numeric(14,0)
declare @old_market numeric(14,0)
declare @new_market numeric(14,0)
 
declare curRows cursor
for
     select d.chg_of_owner_id, d.prop_id, d.seq_num, d.sup_tax_yr, d.imprv_hstd_val, d.imprv_non_hstd_val, d.land_hstd_val, d.land_non_hstd_val, d.ag_use_val, d.ag_market, d.ag_loss, d.timber_use, d.timber_market, d.timber_loss, d.appraised_val, d.assessed_val, d.market, i.chg_of_owner_id, i.prop_id, i.seq_num, i.sup_tax_yr, i.imprv_hstd_val, i.imprv_non_hstd_val, i.land_hstd_val, i.land_non_hstd_val, i.ag_use_val, i.ag_market, i.ag_loss, i.timber_use, i.timber_market, i.timber_loss, i.appraised_val, i.assessed_val, i.market
from deleted as d
join inserted as i on 
     d.chg_of_owner_id = i.chg_of_owner_id and
     d.prop_id = i.prop_id
for read only
 
open curRows
fetch next from curRows into @old_chg_of_owner_id, @old_prop_id, @old_seq_num, @old_sup_tax_yr, @old_imprv_hstd_val, @old_imprv_non_hstd_val, @old_land_hstd_val, @old_land_non_hstd_val, @old_ag_use_val, @old_ag_market, @old_ag_loss, @old_timber_use, @old_timber_market, @old_timber_loss, @old_appraised_val, @old_assessed_val, @old_market, @new_chg_of_owner_id, @new_prop_id, @new_seq_num, @new_sup_tax_yr, @new_imprv_hstd_val, @new_imprv_non_hstd_val, @new_land_hstd_val, @new_land_non_hstd_val, @new_ag_use_val, @new_ag_market, @new_ag_loss, @new_timber_use, @new_timber_market, @new_timber_loss, @new_appraised_val, @new_assessed_val, @new_market
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @new_prop_id)
 
     if (
          @old_chg_of_owner_id <> @new_chg_of_owner_id
          or
          ( @old_chg_of_owner_id is null and @new_chg_of_owner_id is not null ) 
          or
          ( @old_chg_of_owner_id is not null and @new_chg_of_owner_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'chg_of_owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 713, convert(varchar(255), @old_chg_of_owner_id), convert(varchar(255), @new_chg_of_owner_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
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
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_seq_num <> @new_seq_num
          or
          ( @old_seq_num is null and @new_seq_num is not null ) 
          or
          ( @old_seq_num is not null and @new_seq_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'seq_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 4700, convert(varchar(255), @old_seq_num), convert(varchar(255), @new_seq_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_sup_tax_yr <> @new_sup_tax_yr
          or
          ( @old_sup_tax_yr is null and @new_sup_tax_yr is not null ) 
          or
          ( @old_sup_tax_yr is not null and @new_sup_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'sup_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 5005, convert(varchar(255), @old_sup_tax_yr), convert(varchar(255), @new_sup_tax_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_imprv_hstd_val <> @new_imprv_hstd_val
          or
          ( @old_imprv_hstd_val is null and @new_imprv_hstd_val is not null ) 
          or
          ( @old_imprv_hstd_val is not null and @new_imprv_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'imprv_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 2274, convert(varchar(255), @old_imprv_hstd_val), convert(varchar(255), @new_imprv_hstd_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
    @old_imprv_non_hstd_val <> @new_imprv_non_hstd_val
          or
          ( @old_imprv_non_hstd_val is null and @new_imprv_non_hstd_val is not null ) 
          or
          ( @old_imprv_non_hstd_val is not null and @new_imprv_non_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'imprv_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 2292, convert(varchar(255), @old_imprv_non_hstd_val), convert(varchar(255), @new_imprv_non_hstd_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_land_hstd_val <> @new_land_hstd_val
          or
          ( @old_land_hstd_val is null and @new_land_hstd_val is not null ) 
          or
          ( @old_land_hstd_val is not null and @new_land_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'land_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 2594, convert(varchar(255), @old_land_hstd_val), convert(varchar(255), @new_land_hstd_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_land_non_hstd_val <> @new_land_non_hstd_val
          or
          ( @old_land_non_hstd_val is null and @new_land_non_hstd_val is not null ) 
          or
          ( @old_land_non_hstd_val is not null and @new_land_non_hstd_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'land_non_hstd_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 2645, convert(varchar(255), @old_land_non_hstd_val), convert(varchar(255), @new_land_non_hstd_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_ag_use_val <> @new_ag_use_val
          or
          ( @old_ag_use_val is null and @new_ag_use_val is not null ) 
          or
          ( @old_ag_use_val is not null and @new_ag_use_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'ag_use_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 143, convert(varchar(255), @old_ag_use_val), convert(varchar(255), @new_ag_use_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_ag_market <> @new_ag_market
          or
          ( @old_ag_market is null and @new_ag_market is not null ) 
          or
          ( @old_ag_market is not null and @new_ag_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'ag_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 124, convert(varchar(255), @old_ag_market), convert(varchar(255), @new_ag_market) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_ag_loss <> @new_ag_loss
          or
          ( @old_ag_loss is null and @new_ag_loss is not null ) 
          or
          ( @old_ag_loss is not null and @new_ag_loss is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'ag_loss' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 123, convert(varchar(255), @old_ag_loss), convert(varchar(255), @new_ag_loss) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_timber_use <> @new_timber_use
          or
          ( @old_timber_use is null and @new_timber_use is not null ) 
          or
          ( @old_timber_use is not null and @new_timber_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'timber_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 5228, convert(varchar(255), @old_timber_use), convert(varchar(255), @new_timber_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_timber_market <> @new_timber_market
          or
          ( @old_timber_market is null and @new_timber_market is not null ) 
          or
          ( @old_timber_market is not null and @new_timber_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'timber_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 5226, convert(varchar(255), @old_timber_market), convert(varchar(255), @new_timber_market) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_timber_loss <> @new_timber_loss
          or
          ( @old_timber_loss is null and @new_timber_loss is not null ) 
          or
          ( @old_timber_loss is not null and @new_timber_loss is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'timber_loss' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 5225, convert(varchar(255), @old_timber_loss), convert(varchar(255), @new_timber_loss) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_appraised_val <> @new_appraised_val
          or
          ( @old_appraised_val is null and @new_appraised_val is not null ) 
          or
          ( @old_appraised_val is not null and @new_appraised_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'appraised_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 244, convert(varchar(255), @old_appraised_val), convert(varchar(255), @new_appraised_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_assessed_val <> @new_assessed_val
          or
          ( @old_assessed_val is null and @new_assessed_val is not null ) 
          or
          ( @old_assessed_val is not null and @new_assessed_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'assessed_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 338, convert(varchar(255), @old_assessed_val), convert(varchar(255), @new_assessed_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_market <> @new_market
          or
          ( @old_market is null and @new_market is not null ) 
          or
          ( @old_market is not null and @new_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner_prop_assoc' and
                    chg_log_columns = 'market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 160, 3010, convert(varchar(255), @old_market), convert(varchar(255), @new_market) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     fetch next from curRows into @old_chg_of_owner_id, @old_prop_id, @old_seq_num, @old_sup_tax_yr, @old_imprv_hstd_val, @old_imprv_non_hstd_val, @old_land_hstd_val, @old_land_non_hstd_val, @old_ag_use_val, @old_ag_market, @old_ag_loss, @old_timber_use, @old_timber_market, @old_timber_loss, @old_appraised_val, @old_assessed_val, @old_market, @new_chg_of_owner_id, @new_prop_id, @new_seq_num, @new_sup_tax_yr, @new_imprv_hstd_val, @new_imprv_non_hstd_val, @new_land_hstd_val, @new_land_non_hstd_val, @new_ag_use_val, @new_ag_market, @new_ag_loss, @new_timber_use, @new_timber_market, @new_timber_loss, @new_appraised_val, @new_assessed_val, @new_market
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'timber loss value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'timber_loss';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'unique ID established by PACS at the time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'chg_of_owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'land non homestead value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'land_non_hstd_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains property information related to an ownership transfer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'improvement non homestead value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'imprv_non_hstd_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'timber use value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'timber_use';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'land homestead value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'land_hstd_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'timber market value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'timber_market';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'for Washington, a flag to indicate if the current use needs to continue', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'continue_current_use';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'agricultural loss value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'ag_loss';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'market value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'market';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'year layer of the transfer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'sup_tax_yr';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'if more than one property sold in a single transaction, this indicates the primary property in the transfer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'bPrimary';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'improvement homestead value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'imprv_hstd_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'the most recent sale is set at sequence 0.  All other sequence numbers are set at +1 within the COOPA', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'seq_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'agricultural use value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'ag_use_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'appraised value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'appraised_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'agricultural market value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'ag_market';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'assessed value at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner_prop_assoc', @level2type = N'COLUMN', @level2name = N'assessed_val';


GO

