CREATE TABLE [dbo].[sale_conf] (
    [chg_of_owner_id]    INT           NOT NULL,
    [sl_conf_id]         INT           NOT NULL,
    [primary_sl_conf]    VARCHAR (10)  NULL,
    [confirmed_by]       VARCHAR (30)  NULL,
    [confirmed_dt]       DATETIME      NULL,
    [confirmed_source]   VARCHAR (30)  NULL,
    [confirmed_comment]  VARCHAR (500) NULL,
    [sl_price]           NUMERIC (18)  NULL,
    [buyer_conf_lvl_cd]  CHAR (5)      NULL,
    [seller_conf_lvl_cd] CHAR (5)      NULL,
    CONSTRAINT [CPK_sale_conf] PRIMARY KEY CLUSTERED ([chg_of_owner_id] ASC, [sl_conf_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sale_conf_buyer_conf_lvl_cd] FOREIGN KEY ([buyer_conf_lvl_cd]) REFERENCES [dbo].[sale_conf_level] ([sl_conf_lvl_cd]),
    CONSTRAINT [CFK_sale_conf_chg_of_owner_id] FOREIGN KEY ([chg_of_owner_id]) REFERENCES [dbo].[sale] ([chg_of_owner_id]),
    CONSTRAINT [CFK_sale_conf_seller_conf_lvl_cd] FOREIGN KEY ([seller_conf_lvl_cd]) REFERENCES [dbo].[sale_conf_level] ([sl_conf_lvl_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_buyer_conf_lvl_cd]
    ON [dbo].[sale_conf]([buyer_conf_lvl_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_seller_conf_lvl_cd]
    ON [dbo].[sale_conf]([seller_conf_lvl_cd] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_sale_conf_delete_ChangeLog
on sale_conf
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
          chg_log_tables = 'sale_conf' and
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
declare @sl_conf_id int
 
declare curRows cursor
for
     select chg_of_owner_id, sl_conf_id from deleted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @sl_conf_id
 
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
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 732, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
 
     fetch next from curRows into @chg_of_owner_id, @sl_conf_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_sale_conf_update_ChangeLog
on sale_conf
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
declare @old_sl_conf_id int
declare @new_sl_conf_id int
declare @old_primary_sl_conf varchar(10)
declare @new_primary_sl_conf varchar(10)
declare @old_confirmed_by varchar(30)
declare @new_confirmed_by varchar(30)
declare @old_confirmed_dt datetime
declare @new_confirmed_dt datetime
declare @old_confirmed_source varchar(30)
declare @new_confirmed_source varchar(30)
declare @old_confirmed_comment varchar(500)
declare @new_confirmed_comment varchar(500)
declare @old_sl_price numeric(18,0)
declare @new_sl_price numeric(18,0)
declare @old_buyer_conf_lvl_cd char(5)
declare @new_buyer_conf_lvl_cd char(5)
declare @old_seller_conf_lvl_cd char(5)
declare @new_seller_conf_lvl_cd char(5)
 
declare curRows cursor
for
     select d.chg_of_owner_id, d.sl_conf_id, d.primary_sl_conf, d.confirmed_by, d.confirmed_dt, d.confirmed_source, d.confirmed_comment, d.sl_price, d.buyer_conf_lvl_cd, d.seller_conf_lvl_cd, i.chg_of_owner_id, i.sl_conf_id, i.primary_sl_conf, i.confirmed_by, i.confirmed_dt, i.confirmed_source, i.confirmed_comment, i.sl_price, i.buyer_conf_lvl_cd, i.seller_conf_lvl_cd
from deleted as d
join inserted as i on 
     d.chg_of_owner_id = i.chg_of_owner_id and
     d.sl_conf_id = i.sl_conf_id
for read only
 
open curRows
fetch next from curRows into @old_chg_of_owner_id, @old_sl_conf_id, @old_primary_sl_conf, @old_confirmed_by, @old_confirmed_dt, @old_confirmed_source, @old_confirmed_comment, @old_sl_price, @old_buyer_conf_lvl_cd, @old_seller_conf_lvl_cd, @new_chg_of_owner_id, @new_sl_conf_id, @new_primary_sl_conf, @new_confirmed_by, @new_confirmed_dt, @new_confirmed_source, @new_confirmed_comment, @new_sl_price, @new_buyer_conf_lvl_cd, @new_seller_conf_lvl_cd
 
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
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'chg_of_owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 713, convert(varchar(255), @old_chg_of_owner_id), convert(varchar(255), @new_chg_of_owner_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_conf_id <> @new_sl_conf_id
          or
          ( @old_sl_conf_id is null and @new_sl_conf_id is not null ) 
          or
          ( @old_sl_conf_id is not null and @new_sl_conf_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'sl_conf_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 4765, convert(varchar(255), @old_sl_conf_id), convert(varchar(255), @new_sl_conf_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_primary_sl_conf <> @new_primary_sl_conf
          or
          ( @old_primary_sl_conf is null and @new_primary_sl_conf is not null ) 
          or
          ( @old_primary_sl_conf is not null and @new_primary_sl_conf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'primary_sl_conf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 3930, convert(varchar(255), @old_primary_sl_conf), convert(varchar(255), @new_primary_sl_conf) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_confirmed_by <> @new_confirmed_by
          or
          ( @old_confirmed_by is null and @new_confirmed_by is not null ) 
          or
          ( @old_confirmed_by is not null and @new_confirmed_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'confirmed_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 853, convert(varchar(255), @old_confirmed_by), convert(varchar(255), @new_confirmed_by) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_confirmed_dt <> @new_confirmed_dt
          or
          ( @old_confirmed_dt is null and @new_confirmed_dt is not null ) 
          or
          ( @old_confirmed_dt is not null and @new_confirmed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'confirmed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 855, convert(varchar(255), @old_confirmed_dt), convert(varchar(255), @new_confirmed_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_confirmed_source <> @new_confirmed_source
          or
          ( @old_confirmed_source is null and @new_confirmed_source is not null ) 
          or
          ( @old_confirmed_source is not null and @new_confirmed_source is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'confirmed_source' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 856, convert(varchar(255), @old_confirmed_source), convert(varchar(255), @new_confirmed_source) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_confirmed_comment <> @new_confirmed_comment
          or
          ( @old_confirmed_comment is null and @new_confirmed_comment is not null ) 
          or
          ( @old_confirmed_comment is not null and @new_confirmed_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'confirmed_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 854, convert(varchar(255), @old_confirmed_comment), convert(varchar(255), @new_confirmed_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_price <> @new_sl_price
          or
          ( @old_sl_price is null and @new_sl_price is not null ) 
          or
          ( @old_sl_price is not null and @new_sl_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'sl_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 4785, convert(varchar(255), @old_sl_price), convert(varchar(255), @new_sl_price) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_buyer_conf_lvl_cd <> @new_buyer_conf_lvl_cd
          or
          ( @old_buyer_conf_lvl_cd is null and @new_buyer_conf_lvl_cd is not null ) 
          or
          ( @old_buyer_conf_lvl_cd is not null and @new_buyer_conf_lvl_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'buyer_conf_lvl_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 566, convert(varchar(255), @old_buyer_conf_lvl_cd), convert(varchar(255), @new_buyer_conf_lvl_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_seller_conf_lvl_cd <> @new_seller_conf_lvl_cd
          or
          ( @old_seller_conf_lvl_cd is null and @new_seller_conf_lvl_cd is not null ) 
          or
          ( @old_seller_conf_lvl_cd is not null and @new_seller_conf_lvl_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale_conf' and
                    chg_log_columns = 'seller_conf_lvl_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 732, 4691, convert(varchar(255), @old_seller_conf_lvl_cd), convert(varchar(255), @new_seller_conf_lvl_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @new_sl_conf_id), @new_sl_conf_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     fetch next from curRows into @old_chg_of_owner_id, @old_sl_conf_id, @old_primary_sl_conf, @old_confirmed_by, @old_confirmed_dt, @old_confirmed_source, @old_confirmed_comment, @old_sl_price, @old_buyer_conf_lvl_cd, @old_seller_conf_lvl_cd, @new_chg_of_owner_id, @new_sl_conf_id, @new_primary_sl_conf, @new_confirmed_by, @new_confirmed_dt, @new_confirmed_source, @new_confirmed_comment, @new_sl_price, @new_buyer_conf_lvl_cd, @new_seller_conf_lvl_cd
end
 
close curRows
deallocate curRows

GO



create trigger tr_sale_conf_insert_ChangeLog
on sale_conf
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
declare @sl_conf_id int
declare @primary_sl_conf varchar(10)
declare @confirmed_by varchar(30)
declare @confirmed_dt datetime
declare @confirmed_source varchar(30)
declare @confirmed_comment varchar(500)
declare @sl_price numeric(18,0)
declare @buyer_conf_lvl_cd char(5)
declare @seller_conf_lvl_cd char(5)
 
declare curRows cursor
for
     select chg_of_owner_id, sl_conf_id, primary_sl_conf, confirmed_by, confirmed_dt, confirmed_source, confirmed_comment, sl_price, buyer_conf_lvl_cd, seller_conf_lvl_cd from inserted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @sl_conf_id, @primary_sl_conf, @confirmed_by, @confirmed_dt, @confirmed_source, @confirmed_comment, @sl_price, @buyer_conf_lvl_cd, @seller_conf_lvl_cd
 
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
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'chg_of_owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 713, null, convert(varchar(255), @chg_of_owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'sl_conf_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 4765, null, convert(varchar(255), @sl_conf_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'primary_sl_conf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 3930, null, convert(varchar(255), @primary_sl_conf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'confirmed_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 853, null, convert(varchar(255), @confirmed_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'confirmed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 855, null, convert(varchar(255), @confirmed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'confirmed_source' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 856, null, convert(varchar(255), @confirmed_source), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'confirmed_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 854, null, convert(varchar(255), @confirmed_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'sl_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 4785, null, convert(varchar(255), @sl_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'buyer_conf_lvl_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 566, null, convert(varchar(255), @buyer_conf_lvl_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale_conf' and
               chg_log_columns = 'seller_conf_lvl_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 732, 4691, null, convert(varchar(255), @seller_conf_lvl_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4765, convert(varchar(24), @sl_conf_id), @sl_conf_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     fetch next from curRows into @chg_of_owner_id, @sl_conf_id, @primary_sl_conf, @confirmed_by, @confirmed_dt, @confirmed_source, @confirmed_comment, @sl_price, @buyer_conf_lvl_cd, @seller_conf_lvl_cd
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'confirming body', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'confirmed_by';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains sales confirmation information', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date of confirmation', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'confirmed_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'confidence level of the seller source', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'seller_conf_lvl_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'ID established by PACS at the time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'chg_of_owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'where the confirmation came from', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'confirmed_source';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'confirmation comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'confirmed_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'ID established when the sales confirmation record is added to the sale record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'sl_conf_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'If many sales confirmations, one is marked as primary', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'primary_sl_conf';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sales price obtained in the confirmation', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'sl_price';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Confidence level of the buyer source', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale_conf', @level2type = N'COLUMN', @level2name = N'buyer_conf_lvl_cd';


GO

