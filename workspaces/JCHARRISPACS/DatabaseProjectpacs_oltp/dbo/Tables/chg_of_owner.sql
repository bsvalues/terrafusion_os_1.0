CREATE TABLE [dbo].[chg_of_owner] (
    [chg_of_owner_id]     INT           NOT NULL,
    [deed_type_cd]        CHAR (10)     NULL,
    [deed_num]            VARCHAR (50)  NULL,
    [deed_book_id]        CHAR (20)     NULL,
    [deed_book_page]      CHAR (20)     NULL,
    [deed_dt]             DATETIME      NULL,
    [coo_sl_dt]           DATETIME      NULL,
    [consideration]       CHAR (20)     NULL,
    [buyer_lttr_url]      VARCHAR (50)  NULL,
    [seller_lttr_url]     VARCHAR (50)  NULL,
    [buyer_lttr_prt_dt]   DATETIME      NULL,
    [seller_lttr_prt_dt]  DATETIME      NULL,
    [comment]             VARCHAR (500) NULL,
    [ref_id1]             VARCHAR (20)  NULL,
    [grantor_cv]          VARCHAR (30)  NULL,
    [grantee_cv]          VARCHAR (30)  NULL,
    [recorded_dt]         DATETIME      NULL,
    [coo_exported_flag]   CHAR (1)      NULL,
    [lttr_id]             INT           NULL,
    [print_buyer_letter]  BIT           NULL,
    [print_seller_letter] BIT           NULL,
    [excise_number]       INT           NULL,
    [override_excise]     BIT           CONSTRAINT [CDF_chg_of_owner_override_excise] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_chg_of_owner] PRIMARY KEY CLUSTERED ([chg_of_owner_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_chg_of_owner_deed_type_cd] FOREIGN KEY ([deed_type_cd]) REFERENCES [dbo].[deed_type] ([deed_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_excise_number]
    ON [dbo].[chg_of_owner]([excise_number] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id1]
    ON [dbo].[chg_of_owner]([ref_id1] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_deed_type_cd]
    ON [dbo].[chg_of_owner]([deed_type_cd] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_chg_of_owner_insert_ChangeLog
on chg_of_owner
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
declare @deed_type_cd char(10)
declare @deed_num varchar(50)
declare @deed_book_id char(20)
declare @deed_book_page char(20)
declare @deed_dt datetime
declare @coo_sl_dt datetime
declare @consideration char(20)
declare @buyer_lttr_url varchar(50)
declare @seller_lttr_url varchar(50)
declare @buyer_lttr_prt_dt datetime
declare @seller_lttr_prt_dt datetime
declare @comment varchar(500)
declare @ref_id1 varchar(20)
declare @grantor_cv varchar(30)
declare @grantee_cv varchar(30)
declare @recorded_dt datetime
 
declare curRows cursor
for
     select chg_of_owner_id, deed_type_cd, deed_num, deed_book_id, deed_book_page, deed_dt, coo_sl_dt, consideration, buyer_lttr_url, seller_lttr_url, buyer_lttr_prt_dt, seller_lttr_prt_dt, comment, ref_id1, grantor_cv, grantee_cv, recorded_dt from inserted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @deed_type_cd, @deed_num, @deed_book_id, @deed_book_page, @deed_dt, @coo_sl_dt, @consideration, @buyer_lttr_url, @seller_lttr_url, @buyer_lttr_prt_dt, @seller_lttr_prt_dt, @comment, @ref_id1, @grantor_cv, @grantee_cv, @recorded_dt
 
while ( @@fetch_status = 0 )
begin
     set @tvar_key_prop_id = null
     select @tvar_key_prop_id = prop_id
     from chg_of_owner_prop_assoc with(nolock)
     where
          chg_of_owner_id = @chg_of_owner_id
     if ( @tvar_key_prop_id is null )
     begin
          set @tvar_key_prop_id = 0
     end
 
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'chg_of_owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 713, null, convert(varchar(255), @chg_of_owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'deed_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 1205, null, convert(varchar(255), @deed_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'deed_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 1200, null, convert(varchar(255), @deed_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'deed_book_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 1195, null, convert(varchar(255), @deed_book_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'deed_book_page' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 1196, null, convert(varchar(255), @deed_book_page), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'deed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 1199, null, convert(varchar(255), @deed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'coo_sl_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 885, null, convert(varchar(255), @coo_sl_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'consideration' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 857, null, convert(varchar(255), @consideration), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'buyer_lttr_url' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 569, null, convert(varchar(255), @buyer_lttr_url), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'seller_lttr_url' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 4695, null, convert(varchar(255), @seller_lttr_url), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'buyer_lttr_prt_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 568, null, convert(varchar(255), @buyer_lttr_prt_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'seller_lttr_prt_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 4694, null, convert(varchar(255), @seller_lttr_prt_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 827, null, convert(varchar(255), @comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'ref_id1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 4327, null, convert(varchar(255), @ref_id1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'grantor_cv' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 2030, null, convert(varchar(255), @grantor_cv), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'grantee_cv' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 2021, null, convert(varchar(255), @grantee_cv), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'chg_of_owner' and
               chg_log_columns = 'recorded_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 159, 4321, null, convert(varchar(255), @recorded_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     fetch next from curRows into @chg_of_owner_id, @deed_type_cd, @deed_num, @deed_book_id, @deed_book_page, @deed_dt, @coo_sl_dt, @consideration, @buyer_lttr_url, @seller_lttr_url, @buyer_lttr_prt_dt, @seller_lttr_prt_dt, @comment, @ref_id1, @grantor_cv, @grantee_cv, @recorded_dt
end
 
close curRows
deallocate curRows

GO



create trigger tr_chg_of_owner_delete_ChangeLog
on chg_of_owner
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
          chg_log_tables = 'chg_of_owner' and
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
 
declare curRows cursor
for
     select chg_of_owner_id from deleted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_key_prop_id = null
     select @tvar_key_prop_id = prop_id
     from chg_of_owner_prop_assoc with(nolock)
     where
          chg_of_owner_id = @chg_of_owner_id
     if ( @tvar_key_prop_id is null )
     begin
          set @tvar_key_prop_id = 0
     end
 
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 159, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
 
     fetch next from curRows into @chg_of_owner_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_chg_of_owner_update_ChangeLog
on chg_of_owner
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
declare @old_deed_type_cd char(10)
declare @new_deed_type_cd char(10)
declare @old_deed_num varchar(50)
declare @new_deed_num varchar(50)
declare @old_deed_book_id char(20)
declare @new_deed_book_id char(20)
declare @old_deed_book_page char(20)
declare @new_deed_book_page char(20)
declare @old_deed_dt datetime
declare @new_deed_dt datetime
declare @old_coo_sl_dt datetime
declare @new_coo_sl_dt datetime
declare @old_consideration char(20)
declare @new_consideration char(20)
declare @old_buyer_lttr_url varchar(50)
declare @new_buyer_lttr_url varchar(50)
declare @old_seller_lttr_url varchar(50)
declare @new_seller_lttr_url varchar(50)
declare @old_buyer_lttr_prt_dt datetime
declare @new_buyer_lttr_prt_dt datetime
declare @old_seller_lttr_prt_dt datetime
declare @new_seller_lttr_prt_dt datetime
declare @old_comment varchar(500)
declare @new_comment varchar(500)
declare @old_ref_id1 varchar(20)
declare @new_ref_id1 varchar(20)
declare @old_grantor_cv varchar(30)
declare @new_grantor_cv varchar(30)
declare @old_grantee_cv varchar(30)
declare @new_grantee_cv varchar(30)
declare @old_recorded_dt datetime
declare @new_recorded_dt datetime
 
declare curRows cursor
for
     select d.chg_of_owner_id, d.deed_type_cd, d.deed_num, d.deed_book_id, d.deed_book_page, d.deed_dt, d.coo_sl_dt, d.consideration, d.buyer_lttr_url, d.seller_lttr_url, d.buyer_lttr_prt_dt, d.seller_lttr_prt_dt, d.comment, d.ref_id1, d.grantor_cv, d.grantee_cv, d.recorded_dt, i.chg_of_owner_id, i.deed_type_cd, i.deed_num, i.deed_book_id, i.deed_book_page, i.deed_dt, i.coo_sl_dt, i.consideration, i.buyer_lttr_url, i.seller_lttr_url, i.buyer_lttr_prt_dt, i.seller_lttr_prt_dt, i.comment, i.ref_id1, i.grantor_cv, i.grantee_cv, i.recorded_dt
from deleted as d
join inserted as i on 
     d.chg_of_owner_id = i.chg_of_owner_id
for read only
 
open curRows
fetch next from curRows into @old_chg_of_owner_id, @old_deed_type_cd, @old_deed_num, @old_deed_book_id, @old_deed_book_page, @old_deed_dt, @old_coo_sl_dt, @old_consideration, @old_buyer_lttr_url, @old_seller_lttr_url, @old_buyer_lttr_prt_dt, @old_seller_lttr_prt_dt, @old_comment, @old_ref_id1, @old_grantor_cv, @old_grantee_cv, @old_recorded_dt, @new_chg_of_owner_id, @new_deed_type_cd, @new_deed_num, @new_deed_book_id, @new_deed_book_page, @new_deed_dt, @new_coo_sl_dt, @new_consideration, @new_buyer_lttr_url, @new_seller_lttr_url, @new_buyer_lttr_prt_dt, @new_seller_lttr_prt_dt, @new_comment, @new_ref_id1, @new_grantor_cv, @new_grantee_cv, @new_recorded_dt
 
while ( @@fetch_status = 0 )
begin
     set @tvar_key_prop_id = null
     select @tvar_key_prop_id = prop_id
     from chg_of_owner_prop_assoc with(nolock)
     where
          chg_of_owner_id = @new_chg_of_owner_id
     if ( @tvar_key_prop_id is null )
     begin
          set @tvar_key_prop_id = 0
     end
 
     set @tvar_szRefID = null
 
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
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'chg_of_owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 713, convert(varchar(255), @old_chg_of_owner_id), convert(varchar(255), @new_chg_of_owner_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_deed_type_cd <> @new_deed_type_cd
          or
          ( @old_deed_type_cd is null and @new_deed_type_cd is not null ) 
          or
          ( @old_deed_type_cd is not null and @new_deed_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'deed_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 1205, convert(varchar(255), @old_deed_type_cd), convert(varchar(255), @new_deed_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_deed_num <> @new_deed_num
          or
          ( @old_deed_num is null and @new_deed_num is not null ) 
          or
          ( @old_deed_num is not null and @new_deed_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'deed_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 1200, convert(varchar(255), @old_deed_num), convert(varchar(255), @new_deed_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_deed_book_id <> @new_deed_book_id
          or
          ( @old_deed_book_id is null and @new_deed_book_id is not null ) 
          or
          ( @old_deed_book_id is not null and @new_deed_book_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'deed_book_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 1195, convert(varchar(255), @old_deed_book_id), convert(varchar(255), @new_deed_book_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_deed_book_page <> @new_deed_book_page
          or
          ( @old_deed_book_page is null and @new_deed_book_page is not null ) 
          or
          ( @old_deed_book_page is not null and @new_deed_book_page is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'deed_book_page' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 1196, convert(varchar(255), @old_deed_book_page), convert(varchar(255), @new_deed_book_page) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_deed_dt <> @new_deed_dt
          or
          ( @old_deed_dt is null and @new_deed_dt is not null ) 
          or
          ( @old_deed_dt is not null and @new_deed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'deed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 1199, convert(varchar(255), @old_deed_dt), convert(varchar(255), @new_deed_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_coo_sl_dt <> @new_coo_sl_dt
          or
          ( @old_coo_sl_dt is null and @new_coo_sl_dt is not null ) 
          or
          ( @old_coo_sl_dt is not null and @new_coo_sl_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'coo_sl_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 885, convert(varchar(255), @old_coo_sl_dt), convert(varchar(255), @new_coo_sl_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_consideration <> @new_consideration
          or
          ( @old_consideration is null and @new_consideration is not null ) 
          or
          ( @old_consideration is not null and @new_consideration is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'consideration' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 857, convert(varchar(255), @old_consideration), convert(varchar(255), @new_consideration) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_buyer_lttr_url <> @new_buyer_lttr_url
          or
          ( @old_buyer_lttr_url is null and @new_buyer_lttr_url is not null ) 
          or
          ( @old_buyer_lttr_url is not null and @new_buyer_lttr_url is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'buyer_lttr_url' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 569, convert(varchar(255), @old_buyer_lttr_url), convert(varchar(255), @new_buyer_lttr_url) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_seller_lttr_url <> @new_seller_lttr_url
          or
          ( @old_seller_lttr_url is null and @new_seller_lttr_url is not null ) 
          or
          ( @old_seller_lttr_url is not null and @new_seller_lttr_url is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'seller_lttr_url' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 4695, convert(varchar(255), @old_seller_lttr_url), convert(varchar(255), @new_seller_lttr_url) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_buyer_lttr_prt_dt <> @new_buyer_lttr_prt_dt
          or
          ( @old_buyer_lttr_prt_dt is null and @new_buyer_lttr_prt_dt is not null ) 
          or
          ( @old_buyer_lttr_prt_dt is not null and @new_buyer_lttr_prt_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'buyer_lttr_prt_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 568, convert(varchar(255), @old_buyer_lttr_prt_dt), convert(varchar(255), @new_buyer_lttr_prt_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_seller_lttr_prt_dt <> @new_seller_lttr_prt_dt
          or
          ( @old_seller_lttr_prt_dt is null and @new_seller_lttr_prt_dt is not null ) 
          or
          ( @old_seller_lttr_prt_dt is not null and @new_seller_lttr_prt_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'seller_lttr_prt_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 4694, convert(varchar(255), @old_seller_lttr_prt_dt), convert(varchar(255), @new_seller_lttr_prt_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
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
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 827, convert(varchar(255), @old_comment), convert(varchar(255), @new_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_ref_id1 <> @new_ref_id1
          or
          ( @old_ref_id1 is null and @new_ref_id1 is not null ) 
          or
          ( @old_ref_id1 is not null and @new_ref_id1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'ref_id1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 4327, convert(varchar(255), @old_ref_id1), convert(varchar(255), @new_ref_id1) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_grantor_cv <> @new_grantor_cv
          or
          ( @old_grantor_cv is null and @new_grantor_cv is not null ) 
          or
          ( @old_grantor_cv is not null and @new_grantor_cv is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'grantor_cv' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 2030, convert(varchar(255), @old_grantor_cv), convert(varchar(255), @new_grantor_cv) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_grantee_cv <> @new_grantee_cv
          or
          ( @old_grantee_cv is null and @new_grantee_cv is not null ) 
          or
          ( @old_grantee_cv is not null and @new_grantee_cv is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'grantee_cv' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 2021, convert(varchar(255), @old_grantee_cv), convert(varchar(255), @new_grantee_cv) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_recorded_dt <> @new_recorded_dt
          or
          ( @old_recorded_dt is null and @new_recorded_dt is not null ) 
          or
          ( @old_recorded_dt is not null and @new_recorded_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'chg_of_owner' and
                    chg_log_columns = 'recorded_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 159, 4321, convert(varchar(255), @old_recorded_dt), convert(varchar(255), @new_recorded_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     fetch next from curRows into @old_chg_of_owner_id, @old_deed_type_cd, @old_deed_num, @old_deed_book_id, @old_deed_book_page, @old_deed_dt, @old_coo_sl_dt, @old_consideration, @old_buyer_lttr_url, @old_seller_lttr_url, @old_buyer_lttr_prt_dt, @old_seller_lttr_prt_dt, @old_comment, @old_ref_id1, @old_grantor_cv, @old_grantee_cv, @old_recorded_dt, @new_chg_of_owner_id, @new_deed_type_cd, @new_deed_num, @new_deed_book_id, @new_deed_book_page, @new_deed_dt, @new_coo_sl_dt, @new_consideration, @new_buyer_lttr_url, @new_seller_lttr_url, @new_buyer_lttr_prt_dt, @new_seller_lttr_prt_dt, @new_comment, @new_ref_id1, @new_grantor_cv, @new_grantee_cv, @new_recorded_dt
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date deed recorded', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'recorded_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'deed book number, if any', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'deed_book_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date sale was exported to the State - Texas only', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'coo_exported_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'deed page number, if any', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'deed_book_page';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date buyer letter was printed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'buyer_lttr_prt_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'copy of the buyer letter location after printed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'buyer_lttr_url';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'seller file as name if seller_assoc record is not populated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'grantor_cv';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'value from deed_type_cd field in deed_type table. Entered by the user', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'deed_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'copy of the buyer letter location after printed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'seller_lttr_url';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'buyer file as name if buyer_assoc record not populated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'grantee_cv';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'deed number from the deed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'deed_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'normally used for conversions to store IDs from outside databases, but does not display', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'ref_id1';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'unique id established by PACS at the time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'chg_of_owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'number issued in the State of WA from the recorders office', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'excise_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date deed was entered into PACS', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'coo_sl_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'overriding the excise number flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'override_excise';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'from the deed, it is usually the sales price', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'consideration';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date of the deed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'deed_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date seller letter was printed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'seller_lttr_prt_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'comments entered by the clerk entering the deed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains ownership transfer information', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'ID of the letter printer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'chg_of_owner', @level2type = N'COLUMN', @level2name = N'lttr_id';


GO

