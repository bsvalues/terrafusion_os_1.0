CREATE TABLE [dbo].[reet] (
    [reet_id]                     INT              NOT NULL,
    [excise_number]               INT              NULL,
    [status_cd]                   VARCHAR (10)     NULL,
    [reet_type_cd]                VARCHAR (12)     NULL,
    [instrument_type_cd]          CHAR (10)        NULL,
    [completion_date]             DATETIME         NULL,
    [sale_date]                   DATETIME         NULL,
    [partial_sale]                BIT              NOT NULL,
    [acreage_transferred]         NUMERIC (25, 4)  NULL,
    [percent_transferred]         NUMERIC (13, 10) NULL,
    [base_excise_due]             NUMERIC (14, 2)  NULL,
    [excise_amount_paid]          NUMERIC (14, 2)  NULL,
    [base_escrow_due]             NUMERIC (14, 2)  NULL,
    [recording_number]            VARCHAR (50)     NULL,
    [recorded_date]               DATETIME         NULL,
    [recd_last_update_by_user_id] INT              NULL,
    [recd_last_update_date]       DATETIME         NULL,
    [volume]                      CHAR (20)        NULL,
    [page]                        CHAR (20)        NULL,
    [metes_and_bounds]            VARCHAR (5000)   NULL,
    [is_mobile_home_moving]       BIT              NOT NULL,
    [mobile_home_movement_cd]     VARCHAR (10)     NULL,
    [created_compensated_tax]     BIT              NOT NULL,
    [payment_id]                  INT              NULL,
    [sale_price]                  NUMERIC (11, 2)  NULL,
    [pers_prop_included]          BIT              NOT NULL,
    [pers_prop_val]               NUMERIC (11, 2)  NULL,
    [pers_prop_description]       VARCHAR (255)    NULL,
    [exemption_claimed]           BIT              NOT NULL,
    [wac_number_type_cd]          VARCHAR (32)     NULL,
    [wac_reason]                  VARCHAR (255)    NULL,
    [tax_area_id]                 INT              NULL,
    [urban_growth_cd]             VARCHAR (10)     NULL,
    [exemption_amount]            NUMERIC (11, 2)  NULL,
    [agency_id]                   DECIMAL (4)      NULL,
    [imp_manual_entry]            BIT              NULL,
    [imp_partial_sale]            BIT              NULL,
    [imp_continuance_flag]        BIT              NULL,
    [imp_historic_flag]           BIT              NULL,
    [imp_forestland_flag]         BIT              NULL,
    [imp_open_space_flag]         BIT              NULL,
    [imp_city]                    VARCHAR (150)    NULL,
    [imp_current_use_flag]        BIT              NULL,
    [imp_unique_identifier]       DECIMAL (10)     NULL,
    [export_date]                 DATETIME         NULL,
    [recalc_status]               BIT              NULL,
    [comment]                     VARCHAR (500)    NULL,
    [hidden]                      BIT              NULL,
    [imp_timber_ag_flag]          BIT              NULL,
    [imp_multiple_locations]      BIT              NULL,
    [combined_sale_price]         NUMERIC (11, 2)  NULL,
    [personal_property_deduct]    NUMERIC (11, 2)  NULL,
    [exemption_claimed_deduct]    NUMERIC (11, 2)  NULL,
    CONSTRAINT [CPK_reet] PRIMARY KEY CLUSTERED ([reet_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_reet_mobile_home_movement_cd] FOREIGN KEY ([mobile_home_movement_cd]) REFERENCES [dbo].[mobile_home_movement] ([mobile_home_movement_cd]),
    CONSTRAINT [CFK_reet_status_cd] FOREIGN KEY ([status_cd]) REFERENCES [dbo].[reet_status_code] ([reet_status_cd]),
    CONSTRAINT [CFK_reet_urban_growth_cd] FOREIGN KEY ([urban_growth_cd]) REFERENCES [dbo].[urban_growth_code] ([urban_growth_cd]),
    CONSTRAINT [CFK_reet_wac_number_type_cd] FOREIGN KEY ([wac_number_type_cd]) REFERENCES [dbo].[reet_wac_code] ([wac_cd])
);


GO


create trigger tr_reet_update_ChangeLog
on reet
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
 
declare @old_reet_id int
declare @new_reet_id int
declare @old_excise_number int
declare @new_excise_number int
declare @old_status_cd varchar(10)
declare @new_status_cd varchar(10)
declare @old_reet_type_cd varchar(12)
declare @new_reet_type_cd varchar(12)
declare @old_instrument_type_cd char(10)
declare @new_instrument_type_cd char(10)
declare @old_completion_date datetime
declare @new_completion_date datetime
declare @old_sale_date datetime
declare @new_sale_date datetime
declare @old_partial_sale bit
declare @new_partial_sale bit
declare @old_acreage_transferred numeric(25,4)
declare @new_acreage_transferred numeric(25,4)
declare @old_percent_transferred numeric(13,10)
declare @new_percent_transferred numeric(13,10)
declare @old_base_excise_due numeric(14,2)
declare @new_base_excise_due numeric(14,2)
declare @old_excise_amount_paid numeric(14,2)
declare @new_excise_amount_paid numeric(14,2)
declare @old_base_escrow_due numeric(14,2)
declare @new_base_escrow_due numeric(14,2)
declare @old_recording_number varchar(50)
declare @new_recording_number varchar(50)
declare @old_recorded_date datetime
declare @new_recorded_date datetime
declare @old_recd_last_update_by_user_id int
declare @new_recd_last_update_by_user_id int
declare @old_recd_last_update_date datetime
declare @new_recd_last_update_date datetime
declare @old_volume char(20)
declare @new_volume char(20)
declare @old_page char(20)
declare @new_page char(20)
declare @old_metes_and_bounds varchar(5000)
declare @new_metes_and_bounds varchar(5000)
declare @old_is_mobile_home_moving bit
declare @new_is_mobile_home_moving bit
declare @old_mobile_home_movement_cd varchar(10)
declare @new_mobile_home_movement_cd varchar(10)
declare @old_created_compensated_tax bit
declare @new_created_compensated_tax bit
declare @old_payment_id int
declare @new_payment_id int
declare @old_sale_price numeric(11,2)
declare @new_sale_price numeric(11,2)
declare @old_pers_prop_included bit
declare @new_pers_prop_included bit
declare @old_pers_prop_val numeric(11,2)
declare @new_pers_prop_val numeric(11,2)
declare @old_pers_prop_description varchar(255)
declare @new_pers_prop_description varchar(255)
declare @old_exemption_claimed bit
declare @new_exemption_claimed bit
declare @old_wac_number_type_cd varchar(15)
declare @new_wac_number_type_cd varchar(15)
declare @old_wac_reason varchar(255)
declare @new_wac_reason varchar(255)
declare @old_tax_area_id int
declare @new_tax_area_id int
declare @old_urban_growth_cd varchar(10)
declare @new_urban_growth_cd varchar(10)
declare @old_exemption_amount numeric(11,2)
declare @new_exemption_amount numeric(11,2)
declare @old_agency_id decimal(4,0)
declare @new_agency_id decimal(4,0)
declare @old_imp_manual_entry bit
declare @new_imp_manual_entry bit
declare @old_imp_partial_sale bit
declare @new_imp_partial_sale bit
declare @old_imp_continuance_flag bit
declare @new_imp_continuance_flag bit
declare @old_imp_historic_flag bit
declare @new_imp_historic_flag bit
declare @old_imp_forestland_flag bit
declare @new_imp_forestland_flag bit
declare @old_imp_open_space_flag bit
declare @new_imp_open_space_flag bit
declare @old_imp_city varchar(150)
declare @new_imp_city varchar(150)
declare @old_imp_current_use_flag bit
declare @new_imp_current_use_flag bit
declare @old_imp_unique_identifier decimal(10,0)
declare @new_imp_unique_identifier decimal(10,0)
declare @old_export_date datetime
declare @new_export_date datetime
declare @old_recalc_status bit
declare @new_recalc_status bit
 
declare curRows cursor
for
     select d.reet_id, d.excise_number, d.status_cd, d.reet_type_cd, d.instrument_type_cd, d.completion_date, d.sale_date, d.partial_sale, d.acreage_transferred, d.percent_transferred, d.base_excise_due, d.excise_amount_paid, d.base_escrow_due, d.recording_number, d.recorded_date, d.recd_last_update_by_user_id, d.recd_last_update_date, d.volume, d.page, d.metes_and_bounds, d.is_mobile_home_moving, d.mobile_home_movement_cd, d.created_compensated_tax, d.payment_id, d.sale_price, d.pers_prop_included, d.pers_prop_val, d.pers_prop_description, d.exemption_claimed, d.wac_number_type_cd, d.wac_reason, d.tax_area_id, d.urban_growth_cd, d.exemption_amount, d.agency_id, d.imp_manual_entry, d.imp_partial_sale, d.imp_continuance_flag, d.imp_historic_flag, d.imp_forestland_flag, d.imp_open_space_flag, d.imp_city, d.imp_current_use_flag, d.imp_unique_identifier, d.export_date, d.recalc_status, 
            i.reet_id, i.excise_number, i.status_cd, i.reet_type_cd, i.instrument_type_cd, i.completion_date, i.sale_date, i.partial_sale, i.acreage_transferred, i.percent_transferred, i.base_excise_due, i.excise_amount_paid, i.base_escrow_due, i.recording_number, i.recorded_date, i.recd_last_update_by_user_id, i.recd_last_update_date, i.volume, i.page, i.metes_and_bounds, i.is_mobile_home_moving, i.mobile_home_movement_cd, i.created_compensated_tax, i.payment_id, i.sale_price, i.pers_prop_included, i.pers_prop_val, i.pers_prop_description, i.exemption_claimed, i.wac_number_type_cd, i.wac_reason, i.tax_area_id, i.urban_growth_cd, i.exemption_amount, i.agency_id, i.imp_manual_entry, i.imp_partial_sale, i.imp_continuance_flag, i.imp_historic_flag, i.imp_forestland_flag, i.imp_open_space_flag, i.imp_city, i.imp_current_use_flag, i.imp_unique_identifier, i.export_date, i.recalc_status
from deleted as d
join inserted as i on 
     d.reet_id = i.reet_id
for read only
 
open curRows
fetch next from curRows into @old_reet_id, @old_excise_number, @old_status_cd, @old_reet_type_cd, @old_instrument_type_cd, @old_completion_date, @old_sale_date, @old_partial_sale, @old_acreage_transferred, @old_percent_transferred, @old_base_excise_due, @old_excise_amount_paid, @old_base_escrow_due, @old_recording_number, @old_recorded_date, @old_recd_last_update_by_user_id, @old_recd_last_update_date, @old_volume, @old_page, @old_metes_and_bounds, @old_is_mobile_home_moving, @old_mobile_home_movement_cd, @old_created_compensated_tax, @old_payment_id, @old_sale_price, @old_pers_prop_included, @old_pers_prop_val, @old_pers_prop_description, @old_exemption_claimed, @old_wac_number_type_cd, @old_wac_reason, @old_tax_area_id, @old_urban_growth_cd, @old_exemption_amount, @old_agency_id, @old_imp_manual_entry, @old_imp_partial_sale, @old_imp_continuance_flag, @old_imp_historic_flag, @old_imp_forestland_flag, @old_imp_open_space_flag, @old_imp_city, @old_imp_current_use_flag, @old_imp_unique_identifier, @old_export_date, @old_recalc_status, 
                             @new_reet_id, @new_excise_number, @new_status_cd, @new_reet_type_cd, @new_instrument_type_cd, @new_completion_date, @new_sale_date, @new_partial_sale, @new_acreage_transferred, @new_percent_transferred, @new_base_excise_due, @new_excise_amount_paid, @new_base_escrow_due, @new_recording_number, @new_recorded_date, @new_recd_last_update_by_user_id, @new_recd_last_update_date, @new_volume, @new_page, @new_metes_and_bounds, @new_is_mobile_home_moving, @new_mobile_home_movement_cd, @new_created_compensated_tax, @new_payment_id, @new_sale_price, @new_pers_prop_included, @new_pers_prop_val, @new_pers_prop_description, @new_exemption_claimed, @new_wac_number_type_cd, @new_wac_reason, @new_tax_area_id, @new_urban_growth_cd, @new_exemption_amount, @new_agency_id, @new_imp_manual_entry, @new_imp_partial_sale, @new_imp_continuance_flag, @new_imp_historic_flag, @new_imp_forestland_flag, @new_imp_open_space_flag, @new_imp_city, @new_imp_current_use_flag, @new_imp_unique_identifier, @new_export_date, @new_recalc_status
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@old_reet_id as varchar)
 
     if (
          @old_reet_id <> @new_reet_id
          or
          ( @old_reet_id is null and @new_reet_id is not null ) 
          or
          ( @old_reet_id is not null and @new_reet_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'reet_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9497, convert(varchar(255), @old_reet_id), convert(varchar(255), @new_reet_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_excise_number <> @new_excise_number
          or
          ( @old_excise_number is null and @new_excise_number is not null ) 
          or
          ( @old_excise_number is not null and @new_excise_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'excise_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9498, convert(varchar(255), @old_excise_number), convert(varchar(255), @new_excise_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_status_cd <> @new_status_cd
          or
          ( @old_status_cd is null and @new_status_cd is not null ) 
          or
          ( @old_status_cd is not null and @new_status_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'status_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 4948, convert(varchar(255), @old_status_cd), convert(varchar(255), @new_status_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_reet_type_cd <> @new_reet_type_cd
          or
          ( @old_reet_type_cd is null and @new_reet_type_cd is not null ) 
          or
          ( @old_reet_type_cd is not null and @new_reet_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'reet_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9499, convert(varchar(255), @old_reet_type_cd), convert(varchar(255), @new_reet_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_instrument_type_cd <> @new_instrument_type_cd
          or
          ( @old_instrument_type_cd is null and @new_instrument_type_cd is not null ) 
          or
          ( @old_instrument_type_cd is not null and @new_instrument_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'instrument_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 2452, convert(varchar(255), @old_instrument_type_cd), convert(varchar(255), @new_instrument_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_completion_date <> @new_completion_date
          or
          ( @old_completion_date is null and @new_completion_date is not null ) 
          or
          ( @old_completion_date is not null and @new_completion_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'completion_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9500, convert(varchar(255), @old_completion_date), convert(varchar(255), @new_completion_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_sale_date <> @new_sale_date
          or
          ( @old_sale_date is null and @new_sale_date is not null ) 
          or
          ( @old_sale_date is not null and @new_sale_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'sale_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 4475, convert(varchar(255), @old_sale_date), convert(varchar(255), @new_sale_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_partial_sale <> @new_partial_sale
          or
          ( @old_partial_sale is null and @new_partial_sale is not null ) 
          or
          ( @old_partial_sale is not null and @new_partial_sale is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'partial_sale' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9501, convert(varchar(255), @old_partial_sale), convert(varchar(255), @new_partial_sale), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_acreage_transferred <> @new_acreage_transferred
          or
          ( @old_acreage_transferred is null and @new_acreage_transferred is not null ) 
          or
          ( @old_acreage_transferred is not null and @new_acreage_transferred is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'acreage_transferred' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9502, convert(varchar(255), @old_acreage_transferred), convert(varchar(255), @new_acreage_transferred), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_percent_transferred <> @new_percent_transferred
          or
          ( @old_percent_transferred is null and @new_percent_transferred is not null ) 
          or
          ( @old_percent_transferred is not null and @new_percent_transferred is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'percent_transferred' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9503, convert(varchar(255), @old_percent_transferred), convert(varchar(255), @new_percent_transferred), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_base_excise_due <> @new_base_excise_due
          or
          ( @old_base_excise_due is null and @new_base_excise_due is not null ) 
          or
          ( @old_base_excise_due is not null and @new_base_excise_due is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'base_excise_due' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9504, convert(varchar(255), @old_base_excise_due), convert(varchar(255), @new_base_excise_due), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_excise_amount_paid <> @new_excise_amount_paid
          or
          ( @old_excise_amount_paid is null and @new_excise_amount_paid is not null ) 
          or
          ( @old_excise_amount_paid is not null and @new_excise_amount_paid is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'excise_amount_paid' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9505, convert(varchar(255), @old_excise_amount_paid), convert(varchar(255), @new_excise_amount_paid), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_base_escrow_due <> @new_base_escrow_due
          or
          ( @old_base_escrow_due is null and @new_base_escrow_due is not null ) 
          or
          ( @old_base_escrow_due is not null and @new_base_escrow_due is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'base_escrow_due' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9506, convert(varchar(255), @old_base_escrow_due), convert(varchar(255), @new_base_escrow_due), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_recording_number <> @new_recording_number
          or
          ( @old_recording_number is null and @new_recording_number is not null ) 
          or
          ( @old_recording_number is not null and @new_recording_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'recording_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9418, convert(varchar(255), @old_recording_number), convert(varchar(255), @new_recording_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_recorded_date <> @new_recorded_date
          or
          ( @old_recorded_date is null and @new_recorded_date is not null ) 
          or
          ( @old_recorded_date is not null and @new_recorded_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'recorded_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9507, convert(varchar(255), @old_recorded_date), convert(varchar(255), @new_recorded_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_recd_last_update_by_user_id <> @new_recd_last_update_by_user_id
          or
          ( @old_recd_last_update_by_user_id is null and @new_recd_last_update_by_user_id is not null ) 
          or
          ( @old_recd_last_update_by_user_id is not null and @new_recd_last_update_by_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'recd_last_update_by_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9508, convert(varchar(255), @old_recd_last_update_by_user_id), convert(varchar(255), @new_recd_last_update_by_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_recd_last_update_date <> @new_recd_last_update_date
          or
          ( @old_recd_last_update_date is null and @new_recd_last_update_date is not null ) 
          or
          ( @old_recd_last_update_date is not null and @new_recd_last_update_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'recd_last_update_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9509, convert(varchar(255), @old_recd_last_update_date), convert(varchar(255), @new_recd_last_update_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_volume <> @new_volume
          or
          ( @old_volume is null and @new_volume is not null ) 
          or
          ( @old_volume is not null and @new_volume is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'volume' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9510, convert(varchar(255), @old_volume), convert(varchar(255), @new_volume), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_page <> @new_page
          or
          ( @old_page is null and @new_page is not null ) 
          or
          ( @old_page is not null and @new_page is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'page' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 3532, convert(varchar(255), @old_page), convert(varchar(255), @new_page), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_metes_and_bounds <> @new_metes_and_bounds
          or
          ( @old_metes_and_bounds is null and @new_metes_and_bounds is not null ) 
          or
          ( @old_metes_and_bounds is not null and @new_metes_and_bounds is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'metes_and_bounds' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9511, convert(varchar(255), @old_metes_and_bounds), convert(varchar(255), @new_metes_and_bounds), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_is_mobile_home_moving <> @new_is_mobile_home_moving
          or
          ( @old_is_mobile_home_moving is null and @new_is_mobile_home_moving is not null ) 
          or
          ( @old_is_mobile_home_moving is not null and @new_is_mobile_home_moving is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'is_mobile_home_moving' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9512, convert(varchar(255), @old_is_mobile_home_moving), convert(varchar(255), @new_is_mobile_home_moving), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_mobile_home_movement_cd <> @new_mobile_home_movement_cd
          or
          ( @old_mobile_home_movement_cd is null and @new_mobile_home_movement_cd is not null ) 
          or
          ( @old_mobile_home_movement_cd is not null and @new_mobile_home_movement_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'mobile_home_movement_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9513, convert(varchar(255), @old_mobile_home_movement_cd), convert(varchar(255), @new_mobile_home_movement_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_created_compensated_tax <> @new_created_compensated_tax
          or
          ( @old_created_compensated_tax is null and @new_created_compensated_tax is not null ) 
          or
          ( @old_created_compensated_tax is not null and @new_created_compensated_tax is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'created_compensated_tax' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9514, convert(varchar(255), @old_created_compensated_tax), convert(varchar(255), @new_created_compensated_tax), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_payment_id <> @new_payment_id
          or
          ( @old_payment_id is null and @new_payment_id is not null ) 
          or
          ( @old_payment_id is not null and @new_payment_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'payment_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 3586, convert(varchar(255), @old_payment_id), convert(varchar(255), @new_payment_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_sale_price <> @new_sale_price
          or
          ( @old_sale_price is null and @new_sale_price is not null ) 
          or
          ( @old_sale_price is not null and @new_sale_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'sale_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 4492, convert(varchar(255), @old_sale_price), convert(varchar(255), @new_sale_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_pers_prop_included <> @new_pers_prop_included
          or
          ( @old_pers_prop_included is null and @new_pers_prop_included is not null ) 
          or
          ( @old_pers_prop_included is not null and @new_pers_prop_included is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'pers_prop_included' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9515, convert(varchar(255), @old_pers_prop_included), convert(varchar(255), @new_pers_prop_included), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_pers_prop_val <> @new_pers_prop_val
          or
          ( @old_pers_prop_val is null and @new_pers_prop_val is not null ) 
          or
          ( @old_pers_prop_val is not null and @new_pers_prop_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'pers_prop_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 3639, convert(varchar(255), @old_pers_prop_val), convert(varchar(255), @new_pers_prop_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_pers_prop_description <> @new_pers_prop_description
          or
          ( @old_pers_prop_description is null and @new_pers_prop_description is not null ) 
          or
          ( @old_pers_prop_description is not null and @new_pers_prop_description is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'pers_prop_description' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9516, convert(varchar(255), @old_pers_prop_description), convert(varchar(255), @new_pers_prop_description), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_exemption_claimed <> @new_exemption_claimed
          or
          ( @old_exemption_claimed is null and @new_exemption_claimed is not null ) 
          or
          ( @old_exemption_claimed is not null and @new_exemption_claimed is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'exemption_claimed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9517, convert(varchar(255), @old_exemption_claimed), convert(varchar(255), @new_exemption_claimed), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_wac_number_type_cd <> @new_wac_number_type_cd
          or
          ( @old_wac_number_type_cd is null and @new_wac_number_type_cd is not null ) 
          or
          ( @old_wac_number_type_cd is not null and @new_wac_number_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'wac_number_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9518, convert(varchar(255), @old_wac_number_type_cd), convert(varchar(255), @new_wac_number_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_wac_reason <> @new_wac_reason
          or
          ( @old_wac_reason is null and @new_wac_reason is not null ) 
          or
          ( @old_wac_reason is not null and @new_wac_reason is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'wac_reason' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9519, convert(varchar(255), @old_wac_reason), convert(varchar(255), @new_wac_reason), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_tax_area_id <> @new_tax_area_id
          or
          ( @old_tax_area_id is null and @new_tax_area_id is not null ) 
          or
          ( @old_tax_area_id is not null and @new_tax_area_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'tax_area_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9368, convert(varchar(255), @old_tax_area_id), convert(varchar(255), @new_tax_area_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_urban_growth_cd <> @new_urban_growth_cd
          or
          ( @old_urban_growth_cd is null and @new_urban_growth_cd is not null ) 
          or
          ( @old_urban_growth_cd is not null and @new_urban_growth_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'urban_growth_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9480, convert(varchar(255), @old_urban_growth_cd), convert(varchar(255), @new_urban_growth_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_exemption_amount <> @new_exemption_amount
          or
          ( @old_exemption_amount is null and @new_exemption_amount is not null ) 
          or
          ( @old_exemption_amount is not null and @new_exemption_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'exemption_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9520, convert(varchar(255), @old_exemption_amount), convert(varchar(255), @new_exemption_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_agency_id <> @new_agency_id
          or
          ( @old_agency_id is null and @new_agency_id is not null ) 
          or
          ( @old_agency_id is not null and @new_agency_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'agency_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9488, convert(varchar(255), @old_agency_id), convert(varchar(255), @new_agency_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_manual_entry <> @new_imp_manual_entry
          or
          ( @old_imp_manual_entry is null and @new_imp_manual_entry is not null ) 
          or
          ( @old_imp_manual_entry is not null and @new_imp_manual_entry is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_manual_entry' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9521, convert(varchar(255), @old_imp_manual_entry), convert(varchar(255), @new_imp_manual_entry), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_partial_sale <> @new_imp_partial_sale
          or
          ( @old_imp_partial_sale is null and @new_imp_partial_sale is not null ) 
          or
          ( @old_imp_partial_sale is not null and @new_imp_partial_sale is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_partial_sale' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9522, convert(varchar(255), @old_imp_partial_sale), convert(varchar(255), @new_imp_partial_sale), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_continuance_flag <> @new_imp_continuance_flag
          or
          ( @old_imp_continuance_flag is null and @new_imp_continuance_flag is not null ) 
          or
          ( @old_imp_continuance_flag is not null and @new_imp_continuance_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_continuance_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9523, convert(varchar(255), @old_imp_continuance_flag), convert(varchar(255), @new_imp_continuance_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_historic_flag <> @new_imp_historic_flag
          or
          ( @old_imp_historic_flag is null and @new_imp_historic_flag is not null ) 
          or
          ( @old_imp_historic_flag is not null and @new_imp_historic_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_historic_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9524, convert(varchar(255), @old_imp_historic_flag), convert(varchar(255), @new_imp_historic_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_forestland_flag <> @new_imp_forestland_flag
          or
          ( @old_imp_forestland_flag is null and @new_imp_forestland_flag is not null ) 
          or
          ( @old_imp_forestland_flag is not null and @new_imp_forestland_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_forestland_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9525, convert(varchar(255), @old_imp_forestland_flag), convert(varchar(255), @new_imp_forestland_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_open_space_flag <> @new_imp_open_space_flag
          or
          ( @old_imp_open_space_flag is null and @new_imp_open_space_flag is not null ) 
          or
          ( @old_imp_open_space_flag is not null and @new_imp_open_space_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_open_space_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9526, convert(varchar(255), @old_imp_open_space_flag), convert(varchar(255), @new_imp_open_space_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_city <> @new_imp_city
          or
          ( @old_imp_city is null and @new_imp_city is not null ) 
          or
          ( @old_imp_city is not null and @new_imp_city is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_city' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9527, convert(varchar(255), @old_imp_city), convert(varchar(255), @new_imp_city), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_current_use_flag <> @new_imp_current_use_flag
          or
          ( @old_imp_current_use_flag is null and @new_imp_current_use_flag is not null ) 
          or
          ( @old_imp_current_use_flag is not null and @new_imp_current_use_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_current_use_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9528, convert(varchar(255), @old_imp_current_use_flag), convert(varchar(255), @new_imp_current_use_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_imp_unique_identifier <> @new_imp_unique_identifier
          or
          ( @old_imp_unique_identifier is null and @new_imp_unique_identifier is not null ) 
          or
          ( @old_imp_unique_identifier is not null and @new_imp_unique_identifier is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'imp_unique_identifier' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9529, convert(varchar(255), @old_imp_unique_identifier), convert(varchar(255), @new_imp_unique_identifier), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_export_date <> @new_export_date
          or
          ( @old_export_date is null and @new_export_date is not null ) 
          or
          ( @old_export_date is not null and @new_export_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'export_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9534, convert(varchar(255), @old_export_date), convert(varchar(255), @new_export_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     if (
          @old_recalc_status <> @new_recalc_status
          or
          ( @old_recalc_status is null and @new_recalc_status is not null ) 
          or
          ( @old_recalc_status is not null and @new_recalc_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'reet' and
                    chg_log_columns = 'recalc_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1204, 9538, convert(varchar(255), @old_recalc_status), convert(varchar(255), @new_recalc_status), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @new_reet_id), @new_reet_id)
          end
     end
 
     fetch next from curRows into @old_reet_id, @old_excise_number, @old_status_cd, @old_reet_type_cd, @old_instrument_type_cd, @old_completion_date, @old_sale_date, @old_partial_sale, @old_acreage_transferred, @old_percent_transferred, @old_base_excise_due, @old_excise_amount_paid, @old_base_escrow_due, @old_recording_number, @old_recorded_date, @old_recd_last_update_by_user_id, @old_recd_last_update_date, @old_volume, @old_page, @old_metes_and_bounds, @old_is_mobile_home_moving, @old_mobile_home_movement_cd, @old_created_compensated_tax, @old_payment_id, @old_sale_price, @old_pers_prop_included, @old_pers_prop_val, @old_pers_prop_description, @old_exemption_claimed, @old_wac_number_type_cd, @old_wac_reason, @old_tax_area_id, @old_urban_growth_cd, @old_exemption_amount, @old_agency_id, @old_imp_manual_entry, @old_imp_partial_sale, @old_imp_continuance_flag, @old_imp_historic_flag, @old_imp_forestland_flag, @old_imp_open_space_flag, @old_imp_city, @old_imp_current_use_flag, @old_imp_unique_identifier, @old_export_date, @old_recalc_status, 
                                  @new_reet_id, @new_excise_number, @new_status_cd, @new_reet_type_cd, @new_instrument_type_cd, @new_completion_date, @new_sale_date, @new_partial_sale, @new_acreage_transferred, @new_percent_transferred, @new_base_excise_due, @new_excise_amount_paid, @new_base_escrow_due, @new_recording_number, @new_recorded_date, @new_recd_last_update_by_user_id, @new_recd_last_update_date, @new_volume, @new_page, @new_metes_and_bounds, @new_is_mobile_home_moving, @new_mobile_home_movement_cd, @new_created_compensated_tax, @new_payment_id, @new_sale_price, @new_pers_prop_included, @new_pers_prop_val, @new_pers_prop_description, @new_exemption_claimed, @new_wac_number_type_cd, @new_wac_reason, @new_tax_area_id, @new_urban_growth_cd, @new_exemption_amount, @new_agency_id, @new_imp_manual_entry, @new_imp_partial_sale, @new_imp_continuance_flag, @new_imp_historic_flag, @new_imp_forestland_flag, @new_imp_open_space_flag, @new_imp_city, @new_imp_current_use_flag, @new_imp_unique_identifier, @new_export_date, @new_recalc_status
end
 
close curRows
deallocate curRows

GO


create trigger tr_reet_insert_ChangeLog
on reet
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
 
declare @reet_id int
declare @excise_number int
declare @status_cd varchar(10)
declare @reet_type_cd varchar(12)
declare @instrument_type_cd char(10)
declare @completion_date datetime
declare @sale_date datetime
declare @partial_sale bit
declare @acreage_transferred numeric(25,4)
declare @percent_transferred numeric(13,10)
declare @base_excise_due numeric(14,2)
declare @excise_amount_paid numeric(14,2)
declare @base_escrow_due numeric(14,2)
declare @recording_number varchar(50)
declare @recorded_date datetime
declare @recd_last_update_by_user_id int
declare @recd_last_update_date datetime
declare @volume char(20)
declare @page char(20)
declare @metes_and_bounds varchar(5000)
declare @is_mobile_home_moving bit
declare @mobile_home_movement_cd varchar(10)
declare @created_compensated_tax bit
declare @payment_id int
declare @sale_price numeric(11,2)
declare @pers_prop_included bit
declare @pers_prop_val numeric(11,2)
declare @pers_prop_description varchar(255)
declare @exemption_claimed bit
declare @wac_number_type_cd varchar(15)
declare @wac_reason varchar(255)
declare @tax_area_id int
declare @urban_growth_cd varchar(10)
declare @exemption_amount numeric(11,2)
declare @agency_id decimal(4,0)
declare @imp_manual_entry bit
declare @imp_partial_sale bit
declare @imp_continuance_flag bit
declare @imp_historic_flag bit
declare @imp_forestland_flag bit
declare @imp_open_space_flag bit
declare @imp_city varchar(150)
declare @imp_current_use_flag bit
declare @imp_unique_identifier decimal(10,0)
declare @export_date datetime
declare @recalc_status bit
 
declare curRows cursor
for
     select reet_id, excise_number, status_cd, reet_type_cd, instrument_type_cd, completion_date, sale_date, partial_sale, acreage_transferred, percent_transferred, base_excise_due, excise_amount_paid, base_escrow_due, recording_number, recorded_date, recd_last_update_by_user_id, recd_last_update_date, volume, page, metes_and_bounds, is_mobile_home_moving, mobile_home_movement_cd, created_compensated_tax, payment_id, sale_price, pers_prop_included, pers_prop_val, pers_prop_description, exemption_claimed, wac_number_type_cd, wac_reason, tax_area_id, urban_growth_cd, exemption_amount, agency_id, imp_manual_entry, imp_partial_sale, imp_continuance_flag, imp_historic_flag, imp_forestland_flag, imp_open_space_flag, imp_city, imp_current_use_flag, imp_unique_identifier, export_date, recalc_status from inserted
for read only
 
open curRows
fetch next from curRows into @reet_id, @excise_number, @status_cd, @reet_type_cd, @instrument_type_cd, @completion_date, @sale_date, @partial_sale, @acreage_transferred, @percent_transferred, @base_excise_due, @excise_amount_paid, @base_escrow_due, @recording_number, @recorded_date, @recd_last_update_by_user_id, @recd_last_update_date, @volume, @page, @metes_and_bounds, @is_mobile_home_moving, @mobile_home_movement_cd, @created_compensated_tax, @payment_id, @sale_price, @pers_prop_included, @pers_prop_val, @pers_prop_description, @exemption_claimed, @wac_number_type_cd, @wac_reason, @tax_area_id, @urban_growth_cd, @exemption_amount, @agency_id, @imp_manual_entry, @imp_partial_sale, @imp_continuance_flag, @imp_historic_flag, @imp_forestland_flag, @imp_open_space_flag, @imp_city, @imp_current_use_flag, @imp_unique_identifier, @export_date, @recalc_status
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@reet_id as varchar)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'reet_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9497, null, convert(varchar(255), @reet_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'excise_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9498, null, convert(varchar(255), @excise_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'status_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 4948, null, convert(varchar(255), @status_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'reet_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9499, null, convert(varchar(255), @reet_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'instrument_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 2452, null, convert(varchar(255), @instrument_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'completion_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9500, null, convert(varchar(255), @completion_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'sale_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 4475, null, convert(varchar(255), @sale_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'partial_sale' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9501, null, convert(varchar(255), @partial_sale), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'acreage_transferred' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9502, null, convert(varchar(255), @acreage_transferred), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'percent_transferred' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9503, null, convert(varchar(255), @percent_transferred), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'base_excise_due' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9504, null, convert(varchar(255), @base_excise_due), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'excise_amount_paid' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9505, null, convert(varchar(255), @excise_amount_paid), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'base_escrow_due' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9506, null, convert(varchar(255), @base_escrow_due), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'recording_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9418, null, convert(varchar(255), @recording_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'recorded_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9507, null, convert(varchar(255), @recorded_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'recd_last_update_by_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9508, null, convert(varchar(255), @recd_last_update_by_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'recd_last_update_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9509, null, convert(varchar(255), @recd_last_update_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'volume' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9510, null, convert(varchar(255), @volume), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'page' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 3532, null, convert(varchar(255), @page), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'metes_and_bounds' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9511, null, convert(varchar(255), @metes_and_bounds), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'is_mobile_home_moving' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9512, null, convert(varchar(255), @is_mobile_home_moving), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'mobile_home_movement_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9513, null, convert(varchar(255), @mobile_home_movement_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'created_compensated_tax' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9514, null, convert(varchar(255), @created_compensated_tax), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'payment_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 3586, null, convert(varchar(255), @payment_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'sale_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 4492, null, convert(varchar(255), @sale_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'pers_prop_included' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9515, null, convert(varchar(255), @pers_prop_included), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'pers_prop_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 3639, null, convert(varchar(255), @pers_prop_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'pers_prop_description' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9516, null, convert(varchar(255), @pers_prop_description), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'exemption_claimed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9517, null, convert(varchar(255), @exemption_claimed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'wac_number_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9518, null, convert(varchar(255), @wac_number_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'wac_reason' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9519, null, convert(varchar(255), @wac_reason), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'tax_area_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9368, null, convert(varchar(255), @tax_area_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'urban_growth_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9480, null, convert(varchar(255), @urban_growth_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'exemption_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9520, null, convert(varchar(255), @exemption_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'agency_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9488, null, convert(varchar(255), @agency_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_manual_entry' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9521, null, convert(varchar(255), @imp_manual_entry), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_partial_sale' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9522, null, convert(varchar(255), @imp_partial_sale), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_continuance_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9523, null, convert(varchar(255), @imp_continuance_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_historic_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9524, null, convert(varchar(255), @imp_historic_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_forestland_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9525, null, convert(varchar(255), @imp_forestland_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_open_space_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9526, null, convert(varchar(255), @imp_open_space_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_city' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9527, null, convert(varchar(255), @imp_city), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_current_use_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9528, null, convert(varchar(255), @imp_current_use_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'imp_unique_identifier' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9529, null, convert(varchar(255), @imp_unique_identifier), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'export_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9534, null, convert(varchar(255), @export_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'reet' and
               chg_log_columns = 'recalc_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1204, 9538, null, convert(varchar(255), @recalc_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
     end
 
     fetch next from curRows into @reet_id, @excise_number, @status_cd, @reet_type_cd, @instrument_type_cd, @completion_date, @sale_date, @partial_sale, @acreage_transferred, @percent_transferred, @base_excise_due, @excise_amount_paid, @base_escrow_due, @recording_number, @recorded_date, @recd_last_update_by_user_id, @recd_last_update_date, @volume, @page, @metes_and_bounds, @is_mobile_home_moving, @mobile_home_movement_cd, @created_compensated_tax, @payment_id, @sale_price, @pers_prop_included, @pers_prop_val, @pers_prop_description, @exemption_claimed, @wac_number_type_cd, @wac_reason, @tax_area_id, @urban_growth_cd, @exemption_amount, @agency_id, @imp_manual_entry, @imp_partial_sale, @imp_continuance_flag, @imp_historic_flag, @imp_forestland_flag, @imp_open_space_flag, @imp_city, @imp_current_use_flag, @imp_unique_identifier, @export_date, @recalc_status
end
 
close curRows
deallocate curRows

GO


create trigger tr_reet_delete_ChangeLog
on reet
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
          chg_log_tables = 'reet' and
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
 
declare @reet_id int
 
declare curRows cursor
for
     select reet_id from deleted
for read only
 
open curRows
fetch next from curRows into @reet_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@reet_id as varchar)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1204, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9497, convert(varchar(24), @reet_id), @reet_id)
 
     fetch next from curRows into @reet_id
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'hide_on_ownership_transfer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet', @level2type = N'COLUMN', @level2name = N'hidden';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Combined Sale Price', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet', @level2type = N'COLUMN', @level2name = N'combined_sale_price';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Multiple Locations Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet', @level2type = N'COLUMN', @level2name = N'imp_multiple_locations';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Combined Sale Price Exemption Deduction', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet', @level2type = N'COLUMN', @level2name = N'exemption_claimed_deduct';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Comment for REET', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet', @level2type = N'COLUMN', @level2name = N'comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'State Timber/Ag REET Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet', @level2type = N'COLUMN', @level2name = N'imp_timber_ag_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Combined Sale Price Personal Deduction', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet', @level2type = N'COLUMN', @level2name = N'personal_property_deduct';


GO

