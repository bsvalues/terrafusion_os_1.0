CREATE TABLE [dbo].[mh_movement] (
    [mhm_id]                     INT             NOT NULL,
    [prop_id]                    INT             NOT NULL,
    [imprv_id]                   INT             NOT NULL,
    [prop_val_yr]                NUMERIC (4)     NOT NULL,
    [sup_num]                    INT             NOT NULL,
    [mhm_type_cd]                VARCHAR (10)    NOT NULL,
    [mhm_status_cd]              VARCHAR (12)    NOT NULL,
    [status_dt]                  DATETIME        NULL,
    [created_by_id]              INT             NULL,
    [created_dt]                 DATETIME        NULL,
    [updated_by_id]              INT             NULL,
    [updated_dt]                 DATETIME        NULL,
    [real_prop_owner_different]  BIT             DEFAULT ((0)) NOT NULL,
    [real_prop_owner_id]         INT             NULL,
    [mobile_home_is_moving]      BIT             DEFAULT ((1)) NOT NULL,
    [mobile_home_is_moving_type] CHAR (1)        NULL,
    [escrow_id]                  INT             NULL,
    [mh_taxes_due]               NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    [decal_print_date]           DATETIME        NULL,
    [purchaser_type]             CHAR (1)        DEFAULT ('S') NOT NULL,
    [purchaser_id]               INT             NULL,
    [purchaser_name]             VARCHAR (70)    NULL,
    [purchaser_addr_line1]       VARCHAR (60)    NULL,
    [purchaser_addr_line2]       VARCHAR (60)    NULL,
    [purchaser_addr_line3]       VARCHAR (60)    NULL,
    [purchaser_addr_city]        VARCHAR (30)    NULL,
    [purchaser_addr_state]       VARCHAR (5)     NULL,
    [purchaser_addr_zip]         VARCHAR (5)     NULL,
    [purchaser_addr_zip_cass]    VARCHAR (4)     NULL,
    [purchaser_addr_country_cd]  VARCHAR (10)    NULL,
    [purchaser_phone_type_cd]    VARCHAR (5)     NULL,
    [purchaser_phone_number]     VARCHAR (20)    NULL,
    [purchase_price]             NUMERIC (14)    NULL,
    [mhm_transporter_cd]         VARCHAR (10)    NULL,
    [move_to_county]             VARCHAR (20)    NULL,
    [move_to_num]                VARCHAR (15)    NULL,
    [move_to_street_prefix]      VARCHAR (10)    NULL,
    [move_to_street]             VARCHAR (60)    NULL,
    [move_to_street_suffix]      VARCHAR (10)    NULL,
    [move_to_street_unit]        VARCHAR (5)     NULL,
    [move_to_city]               VARCHAR (30)    NULL,
    [move_to_state]              VARCHAR (2)     NULL,
    [move_to_zip]                VARCHAR (10)    NULL,
    [comment]                    VARCHAR (80)    NULL,
    [taxes_paid_indicator]       BIT             NULL,
    [taxes_paid_user_id]         INT             NULL,
    [taxes_paid_date]            DATETIME        NULL,
    CONSTRAINT [CPK_mh_movement] PRIMARY KEY CLUSTERED ([mhm_id] ASC),
    CONSTRAINT [CFK_mh_movement_mhm_status_code] FOREIGN KEY ([mhm_status_cd]) REFERENCES [dbo].[mhm_status_code] ([mhm_status_cd]),
    CONSTRAINT [CFK_mh_movement_mhm_transporter_code] FOREIGN KEY ([mhm_transporter_cd]) REFERENCES [dbo].[mhm_transporter_code] ([transporter_cd]),
    CONSTRAINT [CFK_mh_movement_mhm_type_code] FOREIGN KEY ([mhm_type_cd]) REFERENCES [dbo].[mhm_type_code] ([mhm_type_cd]),
    CONSTRAINT [CFK_mh_movement_property] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

 
create trigger tr_mh_movement_update_ChangeLog
on mh_movement
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
 
declare @old_mhm_id int
declare @new_mhm_id int
declare @old_prop_id int
declare @new_prop_id int
declare @old_imprv_id int
declare @new_imprv_id int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_sup_num int
declare @new_sup_num int
declare @old_mhm_type_cd varchar(10)
declare @new_mhm_type_cd varchar(10)
declare @old_mhm_status_cd varchar(10)
declare @new_mhm_status_cd varchar(10)
declare @old_status_dt datetime
declare @new_status_dt datetime
declare @old_created_by_id int
declare @new_created_by_id int
declare @old_created_dt datetime
declare @new_created_dt datetime
declare @old_updated_by_id int
declare @new_updated_by_id int
declare @old_updated_dt datetime
declare @new_updated_dt datetime
declare @old_real_prop_owner_different bit
declare @new_real_prop_owner_different bit
declare @old_real_prop_owner_id int
declare @new_real_prop_owner_id int
declare @old_mobile_home_is_moving bit
declare @new_mobile_home_is_moving bit
declare @old_mobile_home_is_moving_type char(1)
declare @new_mobile_home_is_moving_type char(1)
declare @old_escrow_id int
declare @new_escrow_id int
declare @old_mh_taxes_due numeric(14,2)
declare @new_mh_taxes_due numeric(14,2)
declare @old_decal_print_date datetime
declare @new_decal_print_date datetime
declare @old_purchaser_type char(1)
declare @new_purchaser_type char(1)
declare @old_purchaser_id int
declare @new_purchaser_id int
declare @old_purchaser_name varchar(70)
declare @new_purchaser_name varchar(70)
declare @old_purchaser_addr_line1 varchar(60)
declare @new_purchaser_addr_line1 varchar(60)
declare @old_purchaser_addr_line2 varchar(60)
declare @new_purchaser_addr_line2 varchar(60)
declare @old_purchaser_addr_line3 varchar(60)
declare @new_purchaser_addr_line3 varchar(60)
declare @old_purchaser_addr_city varchar(30)
declare @new_purchaser_addr_city varchar(30)
declare @old_purchaser_addr_state varchar(5)
declare @new_purchaser_addr_state varchar(5)
declare @old_purchaser_addr_zip varchar(5)
declare @new_purchaser_addr_zip varchar(5)
declare @old_purchaser_addr_zip_cass varchar(4)
declare @new_purchaser_addr_zip_cass varchar(4)
declare @old_purchaser_addr_country_cd varchar(10)
declare @new_purchaser_addr_country_cd varchar(10)
declare @old_purchaser_phone_type_cd varchar(5)
declare @new_purchaser_phone_type_cd varchar(5)
declare @old_purchaser_phone_number varchar(20)
declare @new_purchaser_phone_number varchar(20)
declare @old_purchase_price numeric(14,0)
declare @new_purchase_price numeric(14,0)
declare @old_mhm_transporter_cd varchar(10)
declare @new_mhm_transporter_cd varchar(10)
declare @old_move_to_county varchar(20)
declare @new_move_to_county varchar(20)
declare @old_move_to_num varchar(15)
declare @new_move_to_num varchar(15)
declare @old_move_to_street_prefix varchar(10)
declare @new_move_to_street_prefix varchar(10)
declare @old_move_to_street varchar(60)
declare @new_move_to_street varchar(60)
declare @old_move_to_street_suffix varchar(10)
declare @new_move_to_street_suffix varchar(10)
declare @old_move_to_street_unit varchar(5)
declare @new_move_to_street_unit varchar(5)
declare @old_move_to_city varchar(30)
declare @new_move_to_city varchar(30)
declare @old_move_to_state varchar(2)
declare @new_move_to_state varchar(2)
declare @old_move_to_zip varchar(10)
declare @new_move_to_zip varchar(10)
declare @old_comment varchar(80)
declare @new_comment varchar(80)
declare @old_taxes_paid_indicator bit
declare @new_taxes_paid_indicator bit
declare @old_taxes_paid_user_id int
declare @new_taxes_paid_user_id int
declare @old_taxes_paid_date datetime
declare @new_taxes_paid_date datetime
 
declare curRows cursor
for
     select d.mhm_id, d.prop_id, d.imprv_id, d.prop_val_yr, d.sup_num, d.mhm_type_cd, d.mhm_status_cd, d.status_dt, d.created_by_id, d.created_dt, d.updated_by_id, d.updated_dt, d.real_prop_owner_different, d.real_prop_owner_id, d.mobile_home_is_moving, d.mobile_home_is_moving_type, d.escrow_id, d.mh_taxes_due, d.decal_print_date, d.purchaser_type, d.purchaser_id, d.purchaser_name, d.purchaser_addr_line1, d.purchaser_addr_line2, d.purchaser_addr_line3, d.purchaser_addr_city, d.purchaser_addr_state, d.purchaser_addr_zip, d.purchaser_addr_zip_cass, d.purchaser_addr_country_cd, d.purchaser_phone_type_cd, d.purchaser_phone_number, d.purchase_price, d.mhm_transporter_cd, d.move_to_county, d.move_to_num, d.move_to_street_prefix, d.move_to_street, d.move_to_street_suffix, d.move_to_street_unit, d.move_to_city, d.move_to_state, d.move_to_zip, d.comment, d.taxes_paid_indicator, d.taxes_paid_user_id, d.taxes_paid_date, 
            i.mhm_id, i.prop_id, i.imprv_id, i.prop_val_yr, i.sup_num, i.mhm_type_cd, i.mhm_status_cd, i.status_dt, i.created_by_id, i.created_dt, i.updated_by_id, i.updated_dt, i.real_prop_owner_different, i.real_prop_owner_id, i.mobile_home_is_moving, i.mobile_home_is_moving_type, i.escrow_id, i.mh_taxes_due, i.decal_print_date, i.purchaser_type, i.purchaser_id, i.purchaser_name, i.purchaser_addr_line1, i.purchaser_addr_line2, i.purchaser_addr_line3, i.purchaser_addr_city, i.purchaser_addr_state, i.purchaser_addr_zip, i.purchaser_addr_zip_cass, i.purchaser_addr_country_cd, i.purchaser_phone_type_cd, i.purchaser_phone_number, i.purchase_price, i.mhm_transporter_cd, i.move_to_county, i.move_to_num, i.move_to_street_prefix, i.move_to_street, i.move_to_street_suffix, i.move_to_street_unit, i.move_to_city, i.move_to_state, i.move_to_zip, i.comment, i.taxes_paid_indicator, i.taxes_paid_user_id, i.taxes_paid_date
from deleted as d
join inserted as i on 
     d.mhm_id = i.mhm_id
for read only
 
open curRows
fetch next from curRows into @old_mhm_id, @old_prop_id, @old_imprv_id, @old_prop_val_yr, @old_sup_num, @old_mhm_type_cd, @old_mhm_status_cd, @old_status_dt, @old_created_by_id, @old_created_dt, @old_updated_by_id, @old_updated_dt, @old_real_prop_owner_different, @old_real_prop_owner_id, @old_mobile_home_is_moving, @old_mobile_home_is_moving_type, @old_escrow_id, @old_mh_taxes_due, @old_decal_print_date, @old_purchaser_type, @old_purchaser_id, @old_purchaser_name, @old_purchaser_addr_line1, @old_purchaser_addr_line2, @old_purchaser_addr_line3, @old_purchaser_addr_city, @old_purchaser_addr_state, @old_purchaser_addr_zip, @old_purchaser_addr_zip_cass, @old_purchaser_addr_country_cd, @old_purchaser_phone_type_cd, @old_purchaser_phone_number, @old_purchase_price, @old_mhm_transporter_cd, @old_move_to_county, @old_move_to_num, @old_move_to_street_prefix, @old_move_to_street, @old_move_to_street_suffix, @old_move_to_street_unit, @old_move_to_city, @old_move_to_state, @old_move_to_zip, @old_comment, @old_taxes_paid_indicator, @old_taxes_paid_user_id, @old_taxes_paid_date, 
                             @new_mhm_id, @new_prop_id, @new_imprv_id, @new_prop_val_yr, @new_sup_num, @new_mhm_type_cd, @new_mhm_status_cd, @new_status_dt, @new_created_by_id, @new_created_dt, @new_updated_by_id, @new_updated_dt, @new_real_prop_owner_different, @new_real_prop_owner_id, @new_mobile_home_is_moving, @new_mobile_home_is_moving_type, @new_escrow_id, @new_mh_taxes_due, @new_decal_print_date, @new_purchaser_type, @new_purchaser_id, @new_purchaser_name, @new_purchaser_addr_line1, @new_purchaser_addr_line2, @new_purchaser_addr_line3, @new_purchaser_addr_city, @new_purchaser_addr_state, @new_purchaser_addr_zip, @new_purchaser_addr_zip_cass, @new_purchaser_addr_country_cd, @new_purchaser_phone_type_cd, @new_purchaser_phone_number, @new_purchase_price, @new_mhm_transporter_cd, @new_move_to_county, @new_move_to_num, @new_move_to_street_prefix, @new_move_to_street, @new_move_to_street_suffix, @new_move_to_street_unit, @new_move_to_city, @new_move_to_state, @new_move_to_zip, @new_comment, @new_taxes_paid_indicator, @new_taxes_paid_user_id, @new_taxes_paid_date
 
while ( @@fetch_status = 0 )
begin
set @tvar_key_prop_id = @new_prop_id
 
     set @tvar_szRefID = 'MHM ' + cast(@old_mhm_id as varchar) + ' - Property ' + cast(@old_prop_id as varchar)
 
     if (
          @old_mhm_id <> @new_mhm_id
          or
          ( @old_mhm_id is null and @new_mhm_id is not null ) 
          or
          ( @old_mhm_id is not null and @new_mhm_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'mhm_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9938, convert(varchar(255), @old_mhm_id), convert(varchar(255), @new_mhm_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
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
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_imprv_id <> @new_imprv_id
          or
          ( @old_imprv_id is null and @new_imprv_id is not null ) 
          or
          ( @old_imprv_id is not null and @new_imprv_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'imprv_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 2275, convert(varchar(255), @old_imprv_id), convert(varchar(255), @new_imprv_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
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
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
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
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_mhm_type_cd <> @new_mhm_type_cd
          or
          ( @old_mhm_type_cd is null and @new_mhm_type_cd is not null ) 
          or
          ( @old_mhm_type_cd is not null and @new_mhm_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'mhm_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9914, convert(varchar(255), @old_mhm_type_cd), convert(varchar(255), @new_mhm_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_mhm_status_cd <> @new_mhm_status_cd
          or
          ( @old_mhm_status_cd is null and @new_mhm_status_cd is not null ) 
          or
          ( @old_mhm_status_cd is not null and @new_mhm_status_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'mhm_status_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9905, convert(varchar(255), @old_mhm_status_cd), convert(varchar(255), @new_mhm_status_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_status_dt <> @new_status_dt
          or
          ( @old_status_dt is null and @new_status_dt is not null ) 
          or
          ( @old_status_dt is not null and @new_status_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'status_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 4952, convert(varchar(255), @old_status_dt), convert(varchar(255), @new_status_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_created_by_id <> @new_created_by_id
          or
          ( @old_created_by_id is null and @new_created_by_id is not null ) 
          or
          ( @old_created_by_id is not null and @new_created_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'created_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9936, convert(varchar(255), @old_created_by_id), convert(varchar(255), @new_created_by_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_created_dt <> @new_created_dt
          or
          ( @old_created_dt is null and @new_created_dt is not null ) 
          or
          ( @old_created_dt is not null and @new_created_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'created_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 920, convert(varchar(255), @old_created_dt), convert(varchar(255), @new_created_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_updated_by_id <> @new_updated_by_id
          or
          ( @old_updated_by_id is null and @new_updated_by_id is not null ) 
          or
          ( @old_updated_by_id is not null and @new_updated_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'updated_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9907, convert(varchar(255), @old_updated_by_id), convert(varchar(255), @new_updated_by_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_updated_dt <> @new_updated_dt
          or
          ( @old_updated_dt is null and @new_updated_dt is not null ) 
          or
          ( @old_updated_dt is not null and @new_updated_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'updated_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9923, convert(varchar(255), @old_updated_dt), convert(varchar(255), @new_updated_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_real_prop_owner_different <> @new_real_prop_owner_different
          or
          ( @old_real_prop_owner_different is null and @new_real_prop_owner_different is not null ) 
          or
          ( @old_real_prop_owner_different is not null and @new_real_prop_owner_different is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'real_prop_owner_different' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9928, convert(varchar(255), @old_real_prop_owner_different), convert(varchar(255), @new_real_prop_owner_different), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_real_prop_owner_id <> @new_real_prop_owner_id
          or
          ( @old_real_prop_owner_id is null and @new_real_prop_owner_id is not null ) 
          or
          ( @old_real_prop_owner_id is not null and @new_real_prop_owner_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'real_prop_owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9909, convert(varchar(255), @old_real_prop_owner_id), convert(varchar(255), @new_real_prop_owner_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_mobile_home_is_moving <> @new_mobile_home_is_moving
          or
          ( @old_mobile_home_is_moving is null and @new_mobile_home_is_moving is not null ) 
          or
          ( @old_mobile_home_is_moving is not null and @new_mobile_home_is_moving is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'mobile_home_is_moving' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9939, convert(varchar(255), @old_mobile_home_is_moving), convert(varchar(255), @new_mobile_home_is_moving), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_mobile_home_is_moving_type <> @new_mobile_home_is_moving_type
          or
          ( @old_mobile_home_is_moving_type is null and @new_mobile_home_is_moving_type is not null ) 
          or
          ( @old_mobile_home_is_moving_type is not null and @new_mobile_home_is_moving_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'mobile_home_is_moving_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9912, convert(varchar(255), @old_mobile_home_is_moving_type), convert(varchar(255), @new_mobile_home_is_moving_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_escrow_id <> @new_escrow_id
          or
          ( @old_escrow_id is null and @new_escrow_id is not null ) 
          or
          ( @old_escrow_id is not null and @new_escrow_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'escrow_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 1776, convert(varchar(255), @old_escrow_id), convert(varchar(255), @new_escrow_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_mh_taxes_due <> @new_mh_taxes_due
          or
          ( @old_mh_taxes_due is null and @new_mh_taxes_due is not null ) 
          or
          ( @old_mh_taxes_due is not null and @new_mh_taxes_due is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'mh_taxes_due' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9929, convert(varchar(255), @old_mh_taxes_due), convert(varchar(255), @new_mh_taxes_due), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_decal_print_date <> @new_decal_print_date
          or
          ( @old_decal_print_date is null and @new_decal_print_date is not null ) 
          or
          ( @old_decal_print_date is not null and @new_decal_print_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'decal_print_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9924, convert(varchar(255), @old_decal_print_date), convert(varchar(255), @new_decal_print_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_type <> @new_purchaser_type
          or
          ( @old_purchaser_type is null and @new_purchaser_type is not null ) 
          or
          ( @old_purchaser_type is not null and @new_purchaser_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9915, convert(varchar(255), @old_purchaser_type), convert(varchar(255), @new_purchaser_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_id <> @new_purchaser_id
          or
          ( @old_purchaser_id is null and @new_purchaser_id is not null ) 
          or
          ( @old_purchaser_id is not null and @new_purchaser_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9911, convert(varchar(255), @old_purchaser_id), convert(varchar(255), @new_purchaser_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_name <> @new_purchaser_name
          or
          ( @old_purchaser_name is null and @new_purchaser_name is not null ) 
          or
          ( @old_purchaser_name is not null and @new_purchaser_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9937, convert(varchar(255), @old_purchaser_name), convert(varchar(255), @new_purchaser_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_addr_line1 <> @new_purchaser_addr_line1
          or
          ( @old_purchaser_addr_line1 is null and @new_purchaser_addr_line1 is not null ) 
          or
          ( @old_purchaser_addr_line1 is not null and @new_purchaser_addr_line1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_addr_line1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9920, convert(varchar(255), @old_purchaser_addr_line1), convert(varchar(255), @new_purchaser_addr_line1), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_addr_line2 <> @new_purchaser_addr_line2
          or
          ( @old_purchaser_addr_line2 is null and @new_purchaser_addr_line2 is not null ) 
          or
          ( @old_purchaser_addr_line2 is not null and @new_purchaser_addr_line2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_addr_line2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9902, convert(varchar(255), @old_purchaser_addr_line2), convert(varchar(255), @new_purchaser_addr_line2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_addr_line3 <> @new_purchaser_addr_line3
          or
          ( @old_purchaser_addr_line3 is null and @new_purchaser_addr_line3 is not null ) 
          or
          ( @old_purchaser_addr_line3 is not null and @new_purchaser_addr_line3 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_addr_line3' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9934, convert(varchar(255), @old_purchaser_addr_line3), convert(varchar(255), @new_purchaser_addr_line3), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_addr_city <> @new_purchaser_addr_city
          or
          ( @old_purchaser_addr_city is null and @new_purchaser_addr_city is not null ) 
          or
          ( @old_purchaser_addr_city is not null and @new_purchaser_addr_city is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_addr_city' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9913, convert(varchar(255), @old_purchaser_addr_city), convert(varchar(255), @new_purchaser_addr_city), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_addr_state <> @new_purchaser_addr_state
          or
          ( @old_purchaser_addr_state is null and @new_purchaser_addr_state is not null ) 
          or
          ( @old_purchaser_addr_state is not null and @new_purchaser_addr_state is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_addr_state' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9925, convert(varchar(255), @old_purchaser_addr_state), convert(varchar(255), @new_purchaser_addr_state), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_addr_zip <> @new_purchaser_addr_zip
          or
          ( @old_purchaser_addr_zip is null and @new_purchaser_addr_zip is not null ) 
          or
          ( @old_purchaser_addr_zip is not null and @new_purchaser_addr_zip is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_addr_zip' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9906, convert(varchar(255), @old_purchaser_addr_zip), convert(varchar(255), @new_purchaser_addr_zip), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_addr_zip_cass <> @new_purchaser_addr_zip_cass
          or
          ( @old_purchaser_addr_zip_cass is null and @new_purchaser_addr_zip_cass is not null ) 
          or
          ( @old_purchaser_addr_zip_cass is not null and @new_purchaser_addr_zip_cass is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_addr_zip_cass' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9930, convert(varchar(255), @old_purchaser_addr_zip_cass), convert(varchar(255), @new_purchaser_addr_zip_cass), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_addr_country_cd <> @new_purchaser_addr_country_cd
          or
          ( @old_purchaser_addr_country_cd is null and @new_purchaser_addr_country_cd is not null ) 
          or
          ( @old_purchaser_addr_country_cd is not null and @new_purchaser_addr_country_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_addr_country_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9933, convert(varchar(255), @old_purchaser_addr_country_cd), convert(varchar(255), @new_purchaser_addr_country_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_phone_type_cd <> @new_purchaser_phone_type_cd
          or
          ( @old_purchaser_phone_type_cd is null and @new_purchaser_phone_type_cd is not null ) 
          or
          ( @old_purchaser_phone_type_cd is not null and @new_purchaser_phone_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_phone_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9908, convert(varchar(255), @old_purchaser_phone_type_cd), convert(varchar(255), @new_purchaser_phone_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchaser_phone_number <> @new_purchaser_phone_number
          or
          ( @old_purchaser_phone_number is null and @new_purchaser_phone_number is not null ) 
          or
          ( @old_purchaser_phone_number is not null and @new_purchaser_phone_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchaser_phone_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9904, convert(varchar(255), @old_purchaser_phone_number), convert(varchar(255), @new_purchaser_phone_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_purchase_price <> @new_purchase_price
          or
          ( @old_purchase_price is null and @new_purchase_price is not null ) 
          or
          ( @old_purchase_price is not null and @new_purchase_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'purchase_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9916, convert(varchar(255), @old_purchase_price), convert(varchar(255), @new_purchase_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_mhm_transporter_cd <> @new_mhm_transporter_cd
          or
          ( @old_mhm_transporter_cd is null and @new_mhm_transporter_cd is not null ) 
          or
          ( @old_mhm_transporter_cd is not null and @new_mhm_transporter_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'mhm_transporter_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9931, convert(varchar(255), @old_mhm_transporter_cd), convert(varchar(255), @new_mhm_transporter_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_county <> @new_move_to_county
          or
          ( @old_move_to_county is null and @new_move_to_county is not null ) 
          or
          ( @old_move_to_county is not null and @new_move_to_county is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_county' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9932, convert(varchar(255), @old_move_to_county), convert(varchar(255), @new_move_to_county), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_num <> @new_move_to_num
          or
          ( @old_move_to_num is null and @new_move_to_num is not null ) 
          or
          ( @old_move_to_num is not null and @new_move_to_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9921, convert(varchar(255), @old_move_to_num), convert(varchar(255), @new_move_to_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_street_prefix <> @new_move_to_street_prefix
          or
          ( @old_move_to_street_prefix is null and @new_move_to_street_prefix is not null ) 
          or
          ( @old_move_to_street_prefix is not null and @new_move_to_street_prefix is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_street_prefix' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9927, convert(varchar(255), @old_move_to_street_prefix), convert(varchar(255), @new_move_to_street_prefix), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_street <> @new_move_to_street
          or
          ( @old_move_to_street is null and @new_move_to_street is not null ) 
          or
          ( @old_move_to_street is not null and @new_move_to_street is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_street' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9922, convert(varchar(255), @old_move_to_street), convert(varchar(255), @new_move_to_street), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_street_suffix <> @new_move_to_street_suffix
          or
          ( @old_move_to_street_suffix is null and @new_move_to_street_suffix is not null ) 
          or
          ( @old_move_to_street_suffix is not null and @new_move_to_street_suffix is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_street_suffix' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9935, convert(varchar(255), @old_move_to_street_suffix), convert(varchar(255), @new_move_to_street_suffix), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_street_unit <> @new_move_to_street_unit
          or
          ( @old_move_to_street_unit is null and @new_move_to_street_unit is not null ) 
          or
          ( @old_move_to_street_unit is not null and @new_move_to_street_unit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_street_unit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9918, convert(varchar(255), @old_move_to_street_unit), convert(varchar(255), @new_move_to_street_unit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_city <> @new_move_to_city
          or
          ( @old_move_to_city is null and @new_move_to_city is not null ) 
          or
          ( @old_move_to_city is not null and @new_move_to_city is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_city' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9903, convert(varchar(255), @old_move_to_city), convert(varchar(255), @new_move_to_city), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_state <> @new_move_to_state
          or
          ( @old_move_to_state is null and @new_move_to_state is not null ) 
          or
          ( @old_move_to_state is not null and @new_move_to_state is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_state' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9919, convert(varchar(255), @old_move_to_state), convert(varchar(255), @new_move_to_state), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_move_to_zip <> @new_move_to_zip
          or
          ( @old_move_to_zip is null and @new_move_to_zip is not null ) 
          or
          ( @old_move_to_zip is not null and @new_move_to_zip is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'move_to_zip' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9917, convert(varchar(255), @old_move_to_zip), convert(varchar(255), @new_move_to_zip), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
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
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 827, convert(varchar(255), @old_comment), convert(varchar(255), @new_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_taxes_paid_indicator <> @new_taxes_paid_indicator
          or
          ( @old_taxes_paid_indicator is null and @new_taxes_paid_indicator is not null ) 
          or
          ( @old_taxes_paid_indicator is not null and @new_taxes_paid_indicator is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'taxes_paid_indicator' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9910, convert(varchar(255), @old_taxes_paid_indicator), convert(varchar(255), @new_taxes_paid_indicator), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_taxes_paid_user_id <> @new_taxes_paid_user_id
          or
          ( @old_taxes_paid_user_id is null and @new_taxes_paid_user_id is not null ) 
          or
          ( @old_taxes_paid_user_id is not null and @new_taxes_paid_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'taxes_paid_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9926, convert(varchar(255), @old_taxes_paid_user_id), convert(varchar(255), @new_taxes_paid_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_taxes_paid_date <> @new_taxes_paid_date
          or
          ( @old_taxes_paid_date is null and @new_taxes_paid_date is not null ) 
          or
          ( @old_taxes_paid_date is not null and @new_taxes_paid_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mh_movement' and
                    chg_log_columns = 'taxes_paid_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 412, 9901, convert(varchar(255), @old_taxes_paid_date), convert(varchar(255), @new_taxes_paid_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @new_mhm_id), @new_mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     fetch next from curRows into @old_mhm_id, @old_prop_id, @old_imprv_id, @old_prop_val_yr, @old_sup_num, @old_mhm_type_cd, @old_mhm_status_cd, @old_status_dt, @old_created_by_id, @old_created_dt, @old_updated_by_id, @old_updated_dt, @old_real_prop_owner_different, @old_real_prop_owner_id, @old_mobile_home_is_moving, @old_mobile_home_is_moving_type, @old_escrow_id, @old_mh_taxes_due, @old_decal_print_date, @old_purchaser_type, @old_purchaser_id, @old_purchaser_name, @old_purchaser_addr_line1, @old_purchaser_addr_line2, @old_purchaser_addr_line3, @old_purchaser_addr_city, @old_purchaser_addr_state, @old_purchaser_addr_zip, @old_purchaser_addr_zip_cass, @old_purchaser_addr_country_cd, @old_purchaser_phone_type_cd, @old_purchaser_phone_number, @old_purchase_price, @old_mhm_transporter_cd, @old_move_to_county, @old_move_to_num, @old_move_to_street_prefix, @old_move_to_street, @old_move_to_street_suffix, @old_move_to_street_unit, @old_move_to_city, @old_move_to_state, @old_move_to_zip, @old_comment, @old_taxes_paid_indicator, @old_taxes_paid_user_id, @old_taxes_paid_date, 
                                  @new_mhm_id, @new_prop_id, @new_imprv_id, @new_prop_val_yr, @new_sup_num, @new_mhm_type_cd, @new_mhm_status_cd, @new_status_dt, @new_created_by_id, @new_created_dt, @new_updated_by_id, @new_updated_dt, @new_real_prop_owner_different, @new_real_prop_owner_id, @new_mobile_home_is_moving, @new_mobile_home_is_moving_type, @new_escrow_id, @new_mh_taxes_due, @new_decal_print_date, @new_purchaser_type, @new_purchaser_id, @new_purchaser_name, @new_purchaser_addr_line1, @new_purchaser_addr_line2, @new_purchaser_addr_line3, @new_purchaser_addr_city, @new_purchaser_addr_state, @new_purchaser_addr_zip, @new_purchaser_addr_zip_cass, @new_purchaser_addr_country_cd, @new_purchaser_phone_type_cd, @new_purchaser_phone_number, @new_purchase_price, @new_mhm_transporter_cd, @new_move_to_county, @new_move_to_num, @new_move_to_street_prefix, @new_move_to_street, @new_move_to_street_suffix, @new_move_to_street_unit, @new_move_to_city, @new_move_to_state, @new_move_to_zip, @new_comment, @new_taxes_paid_indicator, @new_taxes_paid_user_id, @new_taxes_paid_date
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_mh_movement_delete_ChangeLog
on mh_movement
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
          chg_log_tables = 'mh_movement' and
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
declare @tvar_szOldValue varchar(255)
set @tvar_szOldValue = 'DELETED'
 
declare @tvar_key_prop_id int
 
declare @mhm_id int
 
declare curRows cursor
for
     select mhm_id from deleted
for read only
 
open curRows
fetch next from curRows into @mhm_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_key_prop_id = prop_id
     from deleted
     where
     mhm_id = @mhm_id
 
     set @tvar_szRefID = 'MHM ' + cast(@mhm_id as varchar) + ' - Property ' + cast(@tvar_key_prop_id as varchar)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 412, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
 
     fetch next from curRows into @mhm_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_mh_movement_insert_ChangeLog
on mh_movement
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
 
declare @mhm_id int
declare @prop_id int
declare @imprv_id int
declare @prop_val_yr numeric(4,0)
declare @sup_num int
declare @mhm_type_cd varchar(10)
declare @mhm_status_cd varchar(10)
declare @status_dt datetime
declare @created_by_id int
declare @created_dt datetime
declare @updated_by_id int
declare @updated_dt datetime
declare @real_prop_owner_different bit
declare @real_prop_owner_id int
declare @mobile_home_is_moving bit
declare @mobile_home_is_moving_type char(1)
declare @escrow_id int
declare @mh_taxes_due numeric(14,2)
declare @decal_print_date datetime
declare @purchaser_type char(1)
declare @purchaser_id int
declare @purchaser_name varchar(70)
declare @purchaser_addr_line1 varchar(60)
declare @purchaser_addr_line2 varchar(60)
declare @purchaser_addr_line3 varchar(60)
declare @purchaser_addr_city varchar(30)
declare @purchaser_addr_state varchar(5)
declare @purchaser_addr_zip varchar(5)
declare @purchaser_addr_zip_cass varchar(4)
declare @purchaser_addr_country_cd varchar(10)
declare @purchaser_phone_type_cd varchar(5)
declare @purchaser_phone_number varchar(20)
declare @purchase_price numeric(14,0)
declare @mhm_transporter_cd varchar(10)
declare @move_to_county varchar(20)
declare @move_to_num varchar(15)
declare @move_to_street_prefix varchar(10)
declare @move_to_street varchar(60)
declare @move_to_street_suffix varchar(10)
declare @move_to_street_unit varchar(5)
declare @move_to_city varchar(30)
declare @move_to_state varchar(2)
declare @move_to_zip varchar(10)
declare @comment varchar(80)
declare @taxes_paid_indicator bit
declare @taxes_paid_user_id int
declare @taxes_paid_date datetime
 
declare curRows cursor
for
     select mhm_id, prop_id, imprv_id, prop_val_yr, sup_num, mhm_type_cd, mhm_status_cd, status_dt, created_by_id, created_dt, updated_by_id, updated_dt, real_prop_owner_different, real_prop_owner_id, mobile_home_is_moving, mobile_home_is_moving_type, escrow_id, mh_taxes_due, decal_print_date, purchaser_type, purchaser_id, purchaser_name, purchaser_addr_line1, purchaser_addr_line2, purchaser_addr_line3, purchaser_addr_city, purchaser_addr_state, purchaser_addr_zip, purchaser_addr_zip_cass, purchaser_addr_country_cd, purchaser_phone_type_cd, purchaser_phone_number, purchase_price, mhm_transporter_cd, move_to_county, move_to_num, move_to_street_prefix, move_to_street, move_to_street_suffix, move_to_street_unit, move_to_city, move_to_state, move_to_zip, comment, taxes_paid_indicator, taxes_paid_user_id, taxes_paid_date from inserted
for read only
 
open curRows
fetch next from curRows into @mhm_id, @prop_id, @imprv_id, @prop_val_yr, @sup_num, @mhm_type_cd, @mhm_status_cd, @status_dt, @created_by_id, @created_dt, @updated_by_id, @updated_dt, @real_prop_owner_different, @real_prop_owner_id, @mobile_home_is_moving, @mobile_home_is_moving_type, @escrow_id, @mh_taxes_due, @decal_print_date, @purchaser_type, @purchaser_id, @purchaser_name, @purchaser_addr_line1, @purchaser_addr_line2, @purchaser_addr_line3, @purchaser_addr_city, @purchaser_addr_state, @purchaser_addr_zip, @purchaser_addr_zip_cass, @purchaser_addr_country_cd, @purchaser_phone_type_cd, @purchaser_phone_number, @purchase_price, @mhm_transporter_cd, @move_to_county, @move_to_num, @move_to_street_prefix, @move_to_street, @move_to_street_suffix, @move_to_street_unit, @move_to_city, @move_to_state, @move_to_zip, @comment, @taxes_paid_indicator, @taxes_paid_user_id, @taxes_paid_date
 
while ( @@fetch_status = 0 )
begin
set @tvar_key_prop_id = @prop_id
 
     set @tvar_szRefID = 'MHM ' + cast(@mhm_id as varchar) + ' - Property ' + cast(@prop_id as varchar)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'mhm_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9938, null, convert(varchar(255), @mhm_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'imprv_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 2275, null, convert(varchar(255), @imprv_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'mhm_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9914, null, convert(varchar(255), @mhm_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'mhm_status_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9905, null, convert(varchar(255), @mhm_status_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'status_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 4952, null, convert(varchar(255), @status_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'created_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9936, null, convert(varchar(255), @created_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'created_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 920, null, convert(varchar(255), @created_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'updated_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9907, null, convert(varchar(255), @updated_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'updated_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9923, null, convert(varchar(255), @updated_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'real_prop_owner_different' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9928, null, convert(varchar(255), @real_prop_owner_different), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'real_prop_owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9909, null, convert(varchar(255), @real_prop_owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'mobile_home_is_moving' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9939, null, convert(varchar(255), @mobile_home_is_moving), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'mobile_home_is_moving_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9912, null, convert(varchar(255), @mobile_home_is_moving_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'escrow_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 1776, null, convert(varchar(255), @escrow_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'mh_taxes_due' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9929, null, convert(varchar(255), @mh_taxes_due), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'decal_print_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9924, null, convert(varchar(255), @decal_print_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9915, null, convert(varchar(255), @purchaser_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9911, null, convert(varchar(255), @purchaser_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9937, null, convert(varchar(255), @purchaser_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_addr_line1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9920, null, convert(varchar(255), @purchaser_addr_line1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_addr_line2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9902, null, convert(varchar(255), @purchaser_addr_line2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_addr_line3' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9934, null, convert(varchar(255), @purchaser_addr_line3), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_addr_city' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9913, null, convert(varchar(255), @purchaser_addr_city), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_addr_state' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9925, null, convert(varchar(255), @purchaser_addr_state), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_addr_zip' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9906, null, convert(varchar(255), @purchaser_addr_zip), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_addr_zip_cass' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9930, null, convert(varchar(255), @purchaser_addr_zip_cass), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_addr_country_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9933, null, convert(varchar(255), @purchaser_addr_country_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_phone_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9908, null, convert(varchar(255), @purchaser_phone_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchaser_phone_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9904, null, convert(varchar(255), @purchaser_phone_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'purchase_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9916, null, convert(varchar(255), @purchase_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'mhm_transporter_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9931, null, convert(varchar(255), @mhm_transporter_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_county' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9932, null, convert(varchar(255), @move_to_county), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9921, null, convert(varchar(255), @move_to_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_street_prefix' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9927, null, convert(varchar(255), @move_to_street_prefix), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_street' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9922, null, convert(varchar(255), @move_to_street), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_street_suffix' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9935, null, convert(varchar(255), @move_to_street_suffix), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_street_unit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9918, null, convert(varchar(255), @move_to_street_unit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_city' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9903, null, convert(varchar(255), @move_to_city), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_state' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9919, null, convert(varchar(255), @move_to_state), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'move_to_zip' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9917, null, convert(varchar(255), @move_to_zip), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 827, null, convert(varchar(255), @comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'taxes_paid_indicator' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9910, null, convert(varchar(255), @taxes_paid_indicator), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'taxes_paid_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9926, null, convert(varchar(255), @taxes_paid_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mh_movement' and
               chg_log_columns = 'taxes_paid_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 412, 9901, null, convert(varchar(255), @taxes_paid_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9938, convert(varchar(24), @mhm_id), @mhm_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     fetch next from curRows into @mhm_id, @prop_id, @imprv_id, @prop_val_yr, @sup_num, @mhm_type_cd, @mhm_status_cd, @status_dt, @created_by_id, @created_dt, @updated_by_id, @updated_dt, @real_prop_owner_different, @real_prop_owner_id, @mobile_home_is_moving, @mobile_home_is_moving_type, @escrow_id, @mh_taxes_due, @decal_print_date, @purchaser_type, @purchaser_id, @purchaser_name, @purchaser_addr_line1, @purchaser_addr_line2, @purchaser_addr_line3, @purchaser_addr_city, @purchaser_addr_state, @purchaser_addr_zip, @purchaser_addr_zip_cass, @purchaser_addr_country_cd, @purchaser_phone_type_cd, @purchaser_phone_number, @purchase_price, @mhm_transporter_cd, @move_to_county, @move_to_num, @move_to_street_prefix, @move_to_street, @move_to_street_suffix, @move_to_street_unit, @move_to_city, @move_to_state, @move_to_zip, @comment, @taxes_paid_indicator, @taxes_paid_user_id, @taxes_paid_date
end
 
close curRows
deallocate curRows

GO

