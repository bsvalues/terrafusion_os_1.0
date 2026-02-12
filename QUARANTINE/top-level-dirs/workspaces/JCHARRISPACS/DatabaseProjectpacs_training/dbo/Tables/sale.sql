CREATE TABLE [dbo].[sale] (
    [chg_of_owner_id]          INT             NOT NULL,
    [sl_ratio]                 NUMERIC (5, 2)  NULL,
    [sl_financing_cd]          CHAR (5)        NULL,
    [sl_ratio_type_cd]         CHAR (5)        NULL,
    [sl_adj_cd]                CHAR (5)        NULL,
    [sl_type_cd]               CHAR (5)        NULL,
    [sl_state_cd]              CHAR (5)        NULL,
    [sl_class_cd]              CHAR (10)       NULL,
    [sl_land_type_cd]          CHAR (10)       NULL,
    [sl_price]                 NUMERIC (14)    NULL,
    [sl_dt]                    DATETIME        NULL,
    [adjusted_sl_price]        NUMERIC (14)    NULL,
    [realtor]                  VARCHAR (30)    NULL,
    [finance_comment]          VARCHAR (50)    NULL,
    [amt_down]                 NUMERIC (18)    NULL,
    [amt_financed]             NUMERIC (18)    NULL,
    [interest_rate]            NUMERIC (14, 3) NULL,
    [finance_yrs]              NUMERIC (4, 1)  NULL,
    [suppress_on_ratio_rpt_cd] CHAR (5)        NULL,
    [suppress_on_ratio_rsn]    VARCHAR (30)    NULL,
    [sl_adj_sl_pct]            NUMERIC (8, 4)  NULL,
    [sl_adj_sl_amt]            NUMERIC (14)    NULL,
    [sl_adj_rsn]               VARCHAR (50)    NULL,
    [sl_comment]               VARCHAR (500)   NULL,
    [sl_yr_blt]                NUMERIC (4)     NULL,
    [sl_living_area]           NUMERIC (14)    NULL,
    [sl_imprv_unit_price]      NUMERIC (14, 2) NULL,
    [sl_land_sqft]             NUMERIC (18, 2) NULL,
    [sl_land_acres]            NUMERIC (18, 4) NULL,
    [sl_land_front_feet]       NUMERIC (18, 2) NULL,
    [sl_land_depth]            NUMERIC (18, 2) NULL,
    [sl_land_unit_price]       NUMERIC (14, 2) NULL,
    [sl_school_id]             INT             NULL,
    [sl_city_id]               INT             NULL,
    [sl_qualifier]             VARCHAR (10)    NULL,
    [include_no_calc]          CHAR (1)        NULL,
    [sl_ratio_cd]              CHAR (5)        NULL,
    [import_dt]                DATETIME        NULL,
    [include_reason]           VARCHAR (30)    NULL,
    [sales_exclude_calc_cd]    VARCHAR (10)    NULL,
    [amt_financed_2]           NUMERIC (18)    NULL,
    [interest_rate_2]          NUMERIC (14, 2) NULL,
    [finance_yrs_2]            NUMERIC (4, 1)  NULL,
    [sl_sub_class_cd]          VARCHAR (10)    NULL,
    [sl_imprv_type_cd]         VARCHAR (5)     NULL,
    [confidential_sale]        CHAR (1)        NULL,
    [frozen_characteristics]   CHAR (1)        NULL,
    [num_days_on_market]       NUMERIC (4)     NULL,
    [sl_exported_flag]         CHAR (1)        NULL,
    [land_only_sale]           BIT             NULL,
    [monthly_income]           NUMERIC (14)    NULL,
    [annual_income]            NUMERIC (14)    NULL,
    [sl_ratio_cd_reason]       VARCHAR (100)   NULL,
    [continue_current_use]     BIT             NULL,
    [sl_county_ratio_cd]       VARCHAR (10)    NULL,
    [primary_use_cd]           VARCHAR (10)    NULL,
    [secondary_use_cd]         VARCHAR (10)    NULL,
    [listing_price]            NUMERIC (14)    NULL,
    [listing_dt]               DATETIME        NULL,
    [pers_prop_val]            NUMERIC (14)    NULL,
    [exemption_amount]         NUMERIC (14)    NULL,
    [wac_cd]                   VARCHAR (32)    NULL,
    CONSTRAINT [CPK_sale] PRIMARY KEY CLUSTERED ([chg_of_owner_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sale_reet_wac_code] FOREIGN KEY ([wac_cd]) REFERENCES [dbo].[reet_wac_code] ([wac_cd]),
    CONSTRAINT [CFK_sale_sales_exclude_calc_cd] FOREIGN KEY ([sales_exclude_calc_cd]) REFERENCES [dbo].[sales_exclude_calc] ([sales_exclude_calc_cd]),
    CONSTRAINT [CFK_sale_sl_adj_cd] FOREIGN KEY ([sl_adj_cd]) REFERENCES [dbo].[sale_adjustment] ([sl_adj_cd]),
    CONSTRAINT [CFK_sale_sl_county_ratio_cd] FOREIGN KEY ([sl_county_ratio_cd]) REFERENCES [dbo].[county_ratio_code] ([ratio_cd]),
    CONSTRAINT [CFK_sale_sl_financing_cd] FOREIGN KEY ([sl_financing_cd]) REFERENCES [dbo].[sl_financing] ([sl_financing_cd]),
    CONSTRAINT [CFK_sale_sl_ratio_type_cd] FOREIGN KEY ([sl_ratio_type_cd]) REFERENCES [dbo].[sale_ratio_type] ([sl_ratio_type_cd]),
    CONSTRAINT [CFK_sale_sl_type_cd] FOREIGN KEY ([sl_type_cd]) REFERENCES [dbo].[sale_type] ([sl_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_sl_adj_cd]
    ON [dbo].[sale]([sl_adj_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_dt]
    ON [dbo].[sale]([sl_dt] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_financing_cd]
    ON [dbo].[sale]([sl_financing_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_type_cd]
    ON [dbo].[sale]([sl_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sl_ratio_type_cd]
    ON [dbo].[sale]([sl_ratio_type_cd] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_sale_update_ChangeLog
on sale
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
 
declare @old_chg_of_owner_id int
declare @new_chg_of_owner_id int
declare @old_sl_ratio numeric(5,2)
declare @new_sl_ratio numeric(5,2)
declare @old_sl_financing_cd char(5)
declare @new_sl_financing_cd char(5)
declare @old_sl_ratio_type_cd char(5)
declare @new_sl_ratio_type_cd char(5)
declare @old_sl_adj_cd char(5)
declare @new_sl_adj_cd char(5)
declare @old_sl_type_cd char(5)
declare @new_sl_type_cd char(5)
declare @old_sl_state_cd char(5)
declare @new_sl_state_cd char(5)
declare @old_sl_class_cd char(10)
declare @new_sl_class_cd char(10)
declare @old_sl_land_type_cd char(10)
declare @new_sl_land_type_cd char(10)
declare @old_sl_price numeric(14,0)
declare @new_sl_price numeric(14,0)
declare @old_sl_dt datetime
declare @new_sl_dt datetime
declare @old_adjusted_sl_price numeric(14,0)
declare @new_adjusted_sl_price numeric(14,0)
declare @old_realtor varchar(30)
declare @new_realtor varchar(30)
declare @old_finance_comment varchar(50)
declare @new_finance_comment varchar(50)
declare @old_amt_down numeric(18,0)
declare @new_amt_down numeric(18,0)
declare @old_amt_financed numeric(18,0)
declare @new_amt_financed numeric(18,0)
declare @old_interest_rate numeric(14,3)
declare @new_interest_rate numeric(14,3)
declare @old_finance_yrs numeric(4,1)
declare @new_finance_yrs numeric(4,1)
declare @old_suppress_on_ratio_rpt_cd char(5)
declare @new_suppress_on_ratio_rpt_cd char(5)
declare @old_suppress_on_ratio_rsn varchar(30)
declare @new_suppress_on_ratio_rsn varchar(30)
declare @old_sl_adj_sl_pct numeric(8,4)
declare @new_sl_adj_sl_pct numeric(8,4)
declare @old_sl_adj_sl_amt numeric(14,0)
declare @new_sl_adj_sl_amt numeric(14,0)
declare @old_sl_adj_rsn varchar(50)
declare @new_sl_adj_rsn varchar(50)
declare @old_sl_comment varchar(500)
declare @new_sl_comment varchar(500)
declare @old_sl_yr_blt numeric(4,0)
declare @new_sl_yr_blt numeric(4,0)
declare @old_sl_living_area numeric(14,0)
declare @new_sl_living_area numeric(14,0)
declare @old_sl_imprv_unit_price numeric(14,2)
declare @new_sl_imprv_unit_price numeric(14,2)
declare @old_sl_land_sqft numeric(18,2)
declare @new_sl_land_sqft numeric(18,2)
declare @old_sl_land_acres numeric(18,4)
declare @new_sl_land_acres numeric(18,4)
declare @old_sl_land_front_feet numeric(18,2)
declare @new_sl_land_front_feet numeric(18,2)
declare @old_sl_land_depth numeric(18,2)
declare @new_sl_land_depth numeric(18,2)
declare @old_sl_land_unit_price numeric(14,2)
declare @new_sl_land_unit_price numeric(14,2)
declare @old_sl_school_id int
declare @new_sl_school_id int
declare @old_sl_city_id int
declare @new_sl_city_id int
declare @old_sl_qualifier varchar(10)
declare @new_sl_qualifier varchar(10)
declare @old_include_no_calc char(1)
declare @new_include_no_calc char(1)
declare @old_sl_ratio_cd char(5)
declare @new_sl_ratio_cd char(5)
declare @old_import_dt datetime
declare @new_import_dt datetime
declare @old_include_reason varchar(30)
declare @new_include_reason varchar(30)
declare @old_sales_exclude_calc_cd varchar(10)
declare @new_sales_exclude_calc_cd varchar(10)
declare @old_amt_financed_2 numeric(18,0)
declare @new_amt_financed_2 numeric(18,0)
declare @old_interest_rate_2 numeric(14,2)
declare @new_interest_rate_2 numeric(14,2)
declare @old_finance_yrs_2 numeric(4,1)
declare @new_finance_yrs_2 numeric(4,1)
declare @old_sl_sub_class_cd varchar(10)
declare @new_sl_sub_class_cd varchar(10)
declare @old_sl_imprv_type_cd varchar(5)
declare @new_sl_imprv_type_cd varchar(5)
declare @old_confidential_sale char(1)
declare @new_confidential_sale char(1)
declare @old_frozen_characteristics char(1)
declare @new_frozen_characteristics char(1)
declare @old_num_days_on_market numeric(4,0)
declare @new_num_days_on_market numeric(4,0)
declare @old_sl_exported_flag char(1)
declare @new_sl_exported_flag char(1)
declare @old_land_only_sale bit
declare @new_land_only_sale bit

Declare @old_sl_ratio_cd_reason VarChar(30);
Declare @new_sl_ratio_cd_reason VarChar(30);

Declare @old_sl_county_ratio_cd VarChar(10);
Declare @new_sl_county_ratio_cd VarChar(10);

Declare @old_continue_current_use Bit;
Declare @new_continue_current_use Bit;
 
declare curRows cursor
for
select d.chg_of_owner_id, d.sl_ratio, d.sl_financing_cd, d.sl_ratio_type_cd, d.sl_adj_cd, d.sl_type_cd, d.sl_state_cd, d.sl_class_cd, d.sl_land_type_cd, d.sl_price, d.sl_dt, d.adjusted_sl_price, d.realtor, d.finance_comment, d.amt_down, d.amt_financed, d.interest_rate, d.finance_yrs, d.suppress_on_ratio_rpt_cd, d.suppress_on_ratio_rsn, d.sl_adj_sl_pct, d.sl_adj_sl_amt, d.sl_adj_rsn, d.sl_comment, d.sl_yr_blt, d.sl_living_area, d.sl_imprv_unit_price, d.sl_land_sqft, d.sl_land_acres, d.sl_land_front_feet, d.sl_land_depth, d.sl_land_unit_price, d.sl_school_id, d.sl_city_id, d.sl_qualifier, d.include_no_calc, d.sl_ratio_cd, d.import_dt, d.include_reason, d.sales_exclude_calc_cd, d.amt_financed_2, d.interest_rate_2, d.finance_yrs_2, d.sl_sub_class_cd, d.sl_imprv_type_cd, d.confidential_sale, d.frozen_characteristics, d.num_days_on_market, d.sl_exported_flag, d.land_only_sale, i.chg_of_owner_id, i.sl_ratio, i.sl_financing_cd, i.sl_ratio_type_cd, i.sl_adj_cd, i.sl_type_cd, i.sl_state_cd, i.sl_class_cd, i.sl_land_type_cd, i.sl_price, i.sl_dt, i.adjusted_sl_price, i.realtor, i.finance_comment, i.amt_down, i.amt_financed, i.interest_rate, i.finance_yrs, i.suppress_on_ratio_rpt_cd, i.suppress_on_ratio_rsn, i.sl_adj_sl_pct, i.sl_adj_sl_amt, i.sl_adj_rsn, i.sl_comment, i.sl_yr_blt, i.sl_living_area, i.sl_imprv_unit_price, i.sl_land_sqft, i.sl_land_acres, i.sl_land_front_feet, i.sl_land_depth, i.sl_land_unit_price, i.sl_school_id, i.sl_city_id, i.sl_qualifier, i.include_no_calc, i.sl_ratio_cd, i.import_dt, i.include_reason, i.sales_exclude_calc_cd, i.amt_financed_2, i.interest_rate_2, i.finance_yrs_2, i.sl_sub_class_cd, i.sl_imprv_type_cd, i.confidential_sale, i.frozen_characteristics, i.num_days_on_market, i.sl_exported_flag, i.land_only_sale, d.sl_ratio_cd_reason, i.sl_ratio_cd_reason, d.sl_county_ratio_cd, i.sl_county_ratio_cd, d.continue_current_use, i.continue_current_use
from deleted as d
join inserted as i on 
     d.chg_of_owner_id = i.chg_of_owner_id
for read only
 
open curRows
fetch next from curRows into @old_chg_of_owner_id, @old_sl_ratio, @old_sl_financing_cd, @old_sl_ratio_type_cd, @old_sl_adj_cd, @old_sl_type_cd, @old_sl_state_cd, @old_sl_class_cd, @old_sl_land_type_cd, @old_sl_price, @old_sl_dt, @old_adjusted_sl_price, @old_realtor, @old_finance_comment, @old_amt_down, @old_amt_financed, @old_interest_rate, @old_finance_yrs, @old_suppress_on_ratio_rpt_cd, @old_suppress_on_ratio_rsn, @old_sl_adj_sl_pct, @old_sl_adj_sl_amt, @old_sl_adj_rsn, @old_sl_comment, @old_sl_yr_blt, @old_sl_living_area, @old_sl_imprv_unit_price, @old_sl_land_sqft, @old_sl_land_acres, @old_sl_land_front_feet, @old_sl_land_depth, @old_sl_land_unit_price, @old_sl_school_id, @old_sl_city_id, @old_sl_qualifier, @old_include_no_calc, @old_sl_ratio_cd, @old_import_dt, @old_include_reason, @old_sales_exclude_calc_cd, @old_amt_financed_2, @old_interest_rate_2, @old_finance_yrs_2, @old_sl_sub_class_cd, @old_sl_imprv_type_cd, @old_confidential_sale, @old_frozen_characteristics, @old_num_days_on_market, @old_sl_exported_flag, @old_land_only_sale, @new_chg_of_owner_id, @new_sl_ratio, @new_sl_financing_cd, @new_sl_ratio_type_cd, @new_sl_adj_cd, @new_sl_type_cd, @new_sl_state_cd, @new_sl_class_cd, @new_sl_land_type_cd, @new_sl_price, @new_sl_dt, @new_adjusted_sl_price, @new_realtor, @new_finance_comment, @new_amt_down, @new_amt_financed, @new_interest_rate, @new_finance_yrs, @new_suppress_on_ratio_rpt_cd, @new_suppress_on_ratio_rsn, @new_sl_adj_sl_pct, @new_sl_adj_sl_amt, @new_sl_adj_rsn, @new_sl_comment, @new_sl_yr_blt, @new_sl_living_area, @new_sl_imprv_unit_price, @new_sl_land_sqft, @new_sl_land_acres, @new_sl_land_front_feet, @new_sl_land_depth, @new_sl_land_unit_price, @new_sl_school_id, @new_sl_city_id, @new_sl_qualifier, @new_include_no_calc, @new_sl_ratio_cd, @new_import_dt, @new_include_reason, @new_sales_exclude_calc_cd, @new_amt_financed_2, @new_interest_rate_2, @new_finance_yrs_2, @new_sl_sub_class_cd, @new_sl_imprv_type_cd, @new_confidential_sale, @new_frozen_characteristics, @new_num_days_on_market, @new_sl_exported_flag, @new_land_only_sale, @old_sl_ratio_cd_reason, @new_sl_ratio_cd_reason, @old_sl_county_ratio_cd, @new_sl_county_ratio_cd, @old_continue_current_use, @new_continue_current_use
 
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
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'chg_of_owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 713, convert(varchar(255), @old_chg_of_owner_id), convert(varchar(255), @new_chg_of_owner_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_ratio <> @new_sl_ratio
          or
          ( @old_sl_ratio is null and @new_sl_ratio is not null ) 
          or
          ( @old_sl_ratio is not null and @new_sl_ratio is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_ratio' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4787, convert(varchar(255), @old_sl_ratio), convert(varchar(255), @new_sl_ratio), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
       @old_sl_financing_cd <> @new_sl_financing_cd
          or
          ( @old_sl_financing_cd is null and @new_sl_financing_cd is not null ) 
          or
          ( @old_sl_financing_cd is not null and @new_sl_financing_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_financing_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4774, convert(varchar(255), @old_sl_financing_cd), convert(varchar(255), @new_sl_financing_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_ratio_type_cd <> @new_sl_ratio_type_cd
          or
          ( @old_sl_ratio_type_cd is null and @new_sl_ratio_type_cd is not null ) 
          or
          ( @old_sl_ratio_type_cd is not null and @new_sl_ratio_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_ratio_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4791, convert(varchar(255), @old_sl_ratio_type_cd), convert(varchar(255), @new_sl_ratio_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_adj_cd <> @new_sl_adj_cd
          or
          ( @old_sl_adj_cd is null and @new_sl_adj_cd is not null ) 
          or
          ( @old_sl_adj_cd is not null and @new_sl_adj_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_adj_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4755, convert(varchar(255), @old_sl_adj_cd), convert(varchar(255), @new_sl_adj_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_type_cd <> @new_sl_type_cd
          or
          ( @old_sl_type_cd is null and @new_sl_type_cd is not null ) 
          or
          ( @old_sl_type_cd is not null and @new_sl_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4796, convert(varchar(255), @old_sl_type_cd), convert(varchar(255), @new_sl_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_state_cd <> @new_sl_state_cd
          or
          ( @old_sl_state_cd is null and @new_sl_state_cd is not null ) 
          or
          ( @old_sl_state_cd is not null and @new_sl_state_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_state_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4794, convert(varchar(255), @old_sl_state_cd), convert(varchar(255), @new_sl_state_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_class_cd <> @new_sl_class_cd
          or
          ( @old_sl_class_cd is null and @new_sl_class_cd is not null ) 
          or
          ( @old_sl_class_cd is not null and @new_sl_class_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4763, convert(varchar(255), @old_sl_class_cd), convert(varchar(255), @new_sl_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_land_type_cd <> @new_sl_land_type_cd
          or
          ( @old_sl_land_type_cd is null and @new_sl_land_type_cd is not null ) 
          or
          ( @old_sl_land_type_cd is not null and @new_sl_land_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_land_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4781, convert(varchar(255), @old_sl_land_type_cd), convert(varchar(255), @new_sl_land_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
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
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4785, convert(varchar(255), @old_sl_price), convert(varchar(255), @new_sl_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_dt <> @new_sl_dt
          or
          ( @old_sl_dt is null and @new_sl_dt is not null ) 
          or
          ( @old_sl_dt is not null and @new_sl_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4769, convert(varchar(255), @old_sl_dt), convert(varchar(255), @new_sl_dt), @tvar_szRefID )
            set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_adjusted_sl_price <> @new_adjusted_sl_price
          or
          ( @old_adjusted_sl_price is null and @new_adjusted_sl_price is not null ) 
          or
          ( @old_adjusted_sl_price is not null and @new_adjusted_sl_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'adjusted_sl_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 101, convert(varchar(255), @old_adjusted_sl_price), convert(varchar(255), @new_adjusted_sl_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_realtor <> @new_realtor
          or
          ( @old_realtor is null and @new_realtor is not null ) 
          or
          ( @old_realtor is not null and @new_realtor is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'realtor' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4306, convert(varchar(255), @old_realtor), convert(varchar(255), @new_realtor), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_finance_comment <> @new_finance_comment
          or
          ( @old_finance_comment is null and @new_finance_comment is not null ) 
          or
          ( @old_finance_comment is not null and @new_finance_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'finance_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
            values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 1915, convert(varchar(255), @old_finance_comment), convert(varchar(255), @new_finance_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_amt_down <> @new_amt_down
          or
          ( @old_amt_down is null and @new_amt_down is not null ) 
          or
          ( @old_amt_down is not null and @new_amt_down is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'amt_down' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 182, convert(varchar(255), @old_amt_down), convert(varchar(255), @new_amt_down), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_amt_financed <> @new_amt_financed
          or
          ( @old_amt_financed is null and @new_amt_financed is not null ) 
          or
          ( @old_amt_financed is not null and @new_amt_financed is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'amt_financed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 185, convert(varchar(255), @old_amt_financed), convert(varchar(255), @new_amt_financed), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_interest_rate <> @new_interest_rate
          or
          ( @old_interest_rate is null and @new_interest_rate is not null ) 
          or
          ( @old_interest_rate is not null and @new_interest_rate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'interest_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 2464, convert(varchar(255), @old_interest_rate), convert(varchar(255), @new_interest_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_finance_yrs <> @new_finance_yrs
          or
          ( @old_finance_yrs is null and @new_finance_yrs is not null ) 
          or
          ( @old_finance_yrs is not null and @new_finance_yrs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'finance_yrs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 1916, convert(varchar(255), @old_finance_yrs), convert(varchar(255), @new_finance_yrs), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_suppress_on_ratio_rpt_cd <> @new_suppress_on_ratio_rpt_cd
          or
          ( @old_suppress_on_ratio_rpt_cd is null and @new_suppress_on_ratio_rpt_cd is not null ) 
          or
          ( @old_suppress_on_ratio_rpt_cd is not null and @new_suppress_on_ratio_rpt_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'suppress_on_ratio_rpt_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 5014, convert(varchar(255), @old_suppress_on_ratio_rpt_cd), convert(varchar(255), @new_suppress_on_ratio_rpt_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_suppress_on_ratio_rsn <> @new_suppress_on_ratio_rsn
          or
          ( @old_suppress_on_ratio_rsn is null and @new_suppress_on_ratio_rsn is not null ) 
          or
          ( @old_suppress_on_ratio_rsn is not null and @new_suppress_on_ratio_rsn is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'suppress_on_ratio_rsn' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 5015, convert(varchar(255), @old_suppress_on_ratio_rsn), convert(varchar(255), @new_suppress_on_ratio_rsn), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_adj_sl_pct <> @new_sl_adj_sl_pct
          or
          ( @old_sl_adj_sl_pct is null and @new_sl_adj_sl_pct is not null ) 
          or
          ( @old_sl_adj_sl_pct is not null and @new_sl_adj_sl_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_adj_sl_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4761, convert(varchar(255), @old_sl_adj_sl_pct), convert(varchar(255), @new_sl_adj_sl_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_adj_sl_amt <> @new_sl_adj_sl_amt
          or
          ( @old_sl_adj_sl_amt is null and @new_sl_adj_sl_amt is not null ) 
          or
          ( @old_sl_adj_sl_amt is not null and @new_sl_adj_sl_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_adj_sl_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4760, convert(varchar(255), @old_sl_adj_sl_amt), convert(varchar(255), @new_sl_adj_sl_amt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_adj_rsn <> @new_sl_adj_rsn
          or
          ( @old_sl_adj_rsn is null and @new_sl_adj_rsn is not null ) 
          or
          ( @old_sl_adj_rsn is not null and @new_sl_adj_rsn is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_adj_rsn' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4759, convert(varchar(255), @old_sl_adj_rsn), convert(varchar(255), @new_sl_adj_rsn), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_comment <> @new_sl_comment
          or
          ( @old_sl_comment is null and @new_sl_comment is not null ) 
          or
          ( @old_sl_comment is not null and @new_sl_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4764, convert(varchar(255), @old_sl_comment), convert(varchar(255), @new_sl_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_yr_blt <> @new_sl_yr_blt
          or
          ( @old_sl_yr_blt is null and @new_sl_yr_blt is not null ) 
          or
          ( @old_sl_yr_blt is not null and @new_sl_yr_blt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_yr_blt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4799, convert(varchar(255), @old_sl_yr_blt), convert(varchar(255), @new_sl_yr_blt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_living_area <> @new_sl_living_area
          or
          ( @old_sl_living_area is null and @new_sl_living_area is not null ) 
          or
          ( @old_sl_living_area is not null and @new_sl_living_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_living_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4783, convert(varchar(255), @old_sl_living_area), convert(varchar(255), @new_sl_living_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_imprv_unit_price <> @new_sl_imprv_unit_price
          or
          ( @old_sl_imprv_unit_price is null and @new_sl_imprv_unit_price is not null ) 
          or
          ( @old_sl_imprv_unit_price is not null and @new_sl_imprv_unit_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_imprv_unit_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4776, convert(varchar(255), @old_sl_imprv_unit_price), convert(varchar(255), @new_sl_imprv_unit_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_land_sqft <> @new_sl_land_sqft
          or
          ( @old_sl_land_sqft is null and @new_sl_land_sqft is not null ) 
          or
          ( @old_sl_land_sqft is not null and @new_sl_land_sqft is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_land_sqft' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4780, convert(varchar(255), @old_sl_land_sqft), convert(varchar(255), @new_sl_land_sqft), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_land_acres <> @new_sl_land_acres
          or
          ( @old_sl_land_acres is null and @new_sl_land_acres is not null ) 
          or
          ( @old_sl_land_acres is not null and @new_sl_land_acres is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_land_acres' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4777, convert(varchar(255), @old_sl_land_acres), convert(varchar(255), @new_sl_land_acres), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_land_front_feet <> @new_sl_land_front_feet
          or
          ( @old_sl_land_front_feet is null and @new_sl_land_front_feet is not null ) 
          or
          ( @old_sl_land_front_feet is not null and @new_sl_land_front_feet is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_land_front_feet' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4779, convert(varchar(255), @old_sl_land_front_feet), convert(varchar(255), @new_sl_land_front_feet), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_land_depth <> @new_sl_land_depth
          or
          ( @old_sl_land_depth is null and @new_sl_land_depth is not null ) 
          or
          ( @old_sl_land_depth is not null and @new_sl_land_depth is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_land_depth' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4778, convert(varchar(255), @old_sl_land_depth), convert(varchar(255), @new_sl_land_depth), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_land_unit_price <> @new_sl_land_unit_price
          or
          ( @old_sl_land_unit_price is null and @new_sl_land_unit_price is not null ) 
          or
          ( @old_sl_land_unit_price is not null and @new_sl_land_unit_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_land_unit_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4782, convert(varchar(255), @old_sl_land_unit_price), convert(varchar(255), @new_sl_land_unit_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_school_id <> @new_sl_school_id
          or
          ( @old_sl_school_id is null and @new_sl_school_id is not null ) 
          or
          ( @old_sl_school_id is not null and @new_sl_school_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_school_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4792, convert(varchar(255), @old_sl_school_id), convert(varchar(255), @new_sl_school_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_city_id <> @new_sl_city_id
          or
          ( @old_sl_city_id is null and @new_sl_city_id is not null ) 
          or
          ( @old_sl_city_id is not null and @new_sl_city_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_city_id' and
                    chg_log_audit = 1
          )
          begin
      insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4762, convert(varchar(255), @old_sl_city_id), convert(varchar(255), @new_sl_city_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_qualifier <> @new_sl_qualifier
          or
          ( @old_sl_qualifier is null and @new_sl_qualifier is not null ) 
          or
          ( @old_sl_qualifier is not null and @new_sl_qualifier is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_qualifier' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4786, convert(varchar(255), @old_sl_qualifier), convert(varchar(255), @new_sl_qualifier), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_include_no_calc <> @new_include_no_calc
          or
          ( @old_include_no_calc is null and @new_include_no_calc is not null ) 
          or
          ( @old_include_no_calc is not null and @new_include_no_calc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'include_no_calc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 2338, convert(varchar(255), @old_include_no_calc), convert(varchar(255), @new_include_no_calc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_ratio_cd <> @new_sl_ratio_cd
          or
          ( @old_sl_ratio_cd is null and @new_sl_ratio_cd is not null ) 
          or
          ( @old_sl_ratio_cd is not null and @new_sl_ratio_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
    where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_ratio_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4788, convert(varchar(255), @old_sl_ratio_cd), convert(varchar(255), @new_sl_ratio_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_import_dt <> @new_import_dt
          or
          ( @old_import_dt is null and @new_import_dt is not null ) 
          or
          ( @old_import_dt is not null and @new_import_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'import_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 2165, convert(varchar(255), @old_import_dt), convert(varchar(255), @new_import_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_include_reason <> @new_include_reason
          or
          ( @old_include_reason is null and @new_include_reason is not null ) 
          or
          ( @old_include_reason is not null and @new_include_reason is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'include_reason' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 2339, convert(varchar(255), @old_include_reason), convert(varchar(255), @new_include_reason), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sales_exclude_calc_cd <> @new_sales_exclude_calc_cd
          or
          ( @old_sales_exclude_calc_cd is null and @new_sales_exclude_calc_cd is not null ) 
          or
          ( @old_sales_exclude_calc_cd is not null and @new_sales_exclude_calc_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sales_exclude_calc_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 4608, convert(varchar(255), @old_sales_exclude_calc_cd), convert(varchar(255), @new_sales_exclude_calc_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_amt_financed_2 <> @new_amt_financed_2
          or
          ( @old_amt_financed_2 is null and @new_amt_financed_2 is not null ) 
          or
          ( @old_amt_financed_2 is not null and @new_amt_financed_2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'amt_financed_2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 186, convert(varchar(255), @old_amt_financed_2), convert(varchar(255), @new_amt_financed_2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_interest_rate_2 <> @new_interest_rate_2
          or
          ( @old_interest_rate_2 is null and @new_interest_rate_2 is not null ) 
          or
          ( @old_interest_rate_2 is not null and @new_interest_rate_2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'interest_rate_2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 2465, convert(varchar(255), @old_interest_rate_2), convert(varchar(255), @new_interest_rate_2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_finance_yrs_2 <> @new_finance_yrs_2
          or
          ( @old_finance_yrs_2 is null and @new_finance_yrs_2 is not null ) 
          or
          ( @old_finance_yrs_2 is not null and @new_finance_yrs_2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'finance_yrs_2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 1917, convert(varchar(255), @old_finance_yrs_2), convert(varchar(255), @new_finance_yrs_2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_sub_class_cd <> @new_sl_sub_class_cd
          or
          ( @old_sl_sub_class_cd is null and @new_sl_sub_class_cd is not null ) 
          or
          ( @old_sl_sub_class_cd is not null and @new_sl_sub_class_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_sub_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9227, convert(varchar(255), @old_sl_sub_class_cd), convert(varchar(255), @new_sl_sub_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_imprv_type_cd <> @new_sl_imprv_type_cd
          or
          ( @old_sl_imprv_type_cd is null and @new_sl_imprv_type_cd is not null ) 
          or
          ( @old_sl_imprv_type_cd is not null and @new_sl_imprv_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_imprv_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9226, convert(varchar(255), @old_sl_imprv_type_cd), convert(varchar(255), @new_sl_imprv_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_confidential_sale <> @new_confidential_sale
          or
          ( @old_confidential_sale is null and @new_confidential_sale is not null ) 
          or
          ( @old_confidential_sale is not null and @new_confidential_sale is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'confidential_sale' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9241, convert(varchar(255), @old_confidential_sale), convert(varchar(255), @new_confidential_sale), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_frozen_characteristics <> @new_frozen_characteristics
          or
          ( @old_frozen_characteristics is null and @new_frozen_characteristics is not null ) 
          or
          ( @old_frozen_characteristics is not null and @new_frozen_characteristics is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'frozen_characteristics' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9242, convert(varchar(255), @old_frozen_characteristics), convert(varchar(255), @new_frozen_characteristics), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_num_days_on_market <> @new_num_days_on_market
          or
          ( @old_num_days_on_market is null and @new_num_days_on_market is not null ) 
          or
          ( @old_num_days_on_market is not null and @new_num_days_on_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'num_days_on_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9243, convert(varchar(255), @old_num_days_on_market), convert(varchar(255), @new_num_days_on_market), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sl_exported_flag <> @new_sl_exported_flag
          or
          ( @old_sl_exported_flag is null and @new_sl_exported_flag is not null ) 
          or
          ( @old_sl_exported_flag is not null and @new_sl_exported_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_exported_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9244, convert(varchar(255), @old_sl_exported_flag), convert(varchar(255), @new_sl_exported_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_land_only_sale <> @new_land_only_sale
          or
          ( @old_land_only_sale is null and @new_land_only_sale is not null ) 
          or
          ( @old_land_only_sale is not null and @new_land_only_sale is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'land_only_sale' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9247, convert(varchar(255), @old_land_only_sale), convert(varchar(255), @new_land_only_sale), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end

     if (
						@old_sl_ratio_cd_reason <> @new_sl_ratio_cd_reason
          or
          ( @old_sl_ratio_cd_reason is null and @new_sl_ratio_cd_reason is not null ) 
          or
          ( @old_sl_ratio_cd_reason is not null and @new_sl_ratio_cd_reason is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_ratio_cd_reason' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9493, convert(varchar(255), @old_sl_ratio_cd_reason), convert(varchar(255), @new_sl_ratio_cd_reason), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
							 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end

		if (
						@old_sl_county_ratio_cd <> @new_sl_county_ratio_cd
          or
          ( @old_sl_county_ratio_cd is null and @new_sl_county_ratio_cd is not null ) 
          or
          ( @old_sl_county_ratio_cd is not null and @new_sl_county_ratio_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'sl_county_ratio_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9494, convert(varchar(255), @old_sl_county_ratio_cd), convert(varchar(255), @new_sl_county_ratio_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
							 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end

		if (
						@old_continue_current_use <> @new_continue_current_use
          or
          ( @old_continue_current_use is null and @new_continue_current_use is not null ) 
          or
          ( @old_continue_current_use is not null and @new_continue_current_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sale' and
                    chg_log_columns = 'continue_current_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 730, 9496, convert(varchar(255), @old_continue_current_use), convert(varchar(255), @new_continue_current_use), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
							 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     fetch next from curRows into @old_chg_of_owner_id, @old_sl_ratio, @old_sl_financing_cd, @old_sl_ratio_type_cd, @old_sl_adj_cd, @old_sl_type_cd, @old_sl_state_cd, @old_sl_class_cd, @old_sl_land_type_cd, @old_sl_price, @old_sl_dt, @old_adjusted_sl_price, @old_realtor, @old_finance_comment, @old_amt_down, @old_amt_financed, @old_interest_rate, @old_finance_yrs, @old_suppress_on_ratio_rpt_cd, @old_suppress_on_ratio_rsn, @old_sl_adj_sl_pct, @old_sl_adj_sl_amt, @old_sl_adj_rsn, @old_sl_comment, @old_sl_yr_blt, @old_sl_living_area, @old_sl_imprv_unit_price, @old_sl_land_sqft, @old_sl_land_acres, @old_sl_land_front_feet, @old_sl_land_depth, @old_sl_land_unit_price, @old_sl_school_id, @old_sl_city_id, @old_sl_qualifier, @old_include_no_calc, @old_sl_ratio_cd, @old_import_dt, @old_include_reason, @old_sales_exclude_calc_cd, @old_amt_financed_2, @old_interest_rate_2, @old_finance_yrs_2, @old_sl_sub_class_cd, @old_sl_imprv_type_cd, @old_confidential_sale, @old_frozen_characteristics, @old_num_days_on_market, @old_sl_exported_flag, @old_land_only_sale, @new_chg_of_owner_id, @new_sl_ratio, @new_sl_financing_cd, @new_sl_ratio_type_cd, @new_sl_adj_cd, @new_sl_type_cd, @new_sl_state_cd, @new_sl_class_cd, @new_sl_land_type_cd, @new_sl_price, @new_sl_dt, @new_adjusted_sl_price, @new_realtor, @new_finance_comment, @new_amt_down, @new_amt_financed, @new_interest_rate, @new_finance_yrs, @new_suppress_on_ratio_rpt_cd, @new_suppress_on_ratio_rsn, @new_sl_adj_sl_pct, @new_sl_adj_sl_amt, @new_sl_adj_rsn, @new_sl_comment, @new_sl_yr_blt, @new_sl_living_area, @new_sl_imprv_unit_price, @new_sl_land_sqft, @new_sl_land_acres, @new_sl_land_front_feet, @new_sl_land_depth, @new_sl_land_unit_price, @new_sl_school_id, @new_sl_city_id, @new_sl_qualifier, @new_include_no_calc, @new_sl_ratio_cd, @new_import_dt, @new_include_reason, @new_sales_exclude_calc_cd, @new_amt_financed_2, @new_interest_rate_2, @new_finance_yrs_2, @new_sl_sub_class_cd, @new_sl_imprv_type_cd, @new_confidential_sale, @new_frozen_characteristics, @new_num_days_on_market, @new_sl_exported_flag, @new_land_only_sale, @old_sl_ratio_cd_reason, @new_sl_ratio_cd_reason, @old_sl_county_ratio_cd, @new_sl_county_ratio_cd, @old_continue_current_use, @new_continue_current_use
end
 
close curRows
deallocate curRows

GO


create trigger tr_sale_delete_ChangeLog
on sale
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
          chg_log_tables = 'sale' and
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
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 730, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
 
     fetch next from curRows into @chg_of_owner_id
end
 
close curRows
deallocate curRows

GO


create trigger tr_sale_insert_ChangeLog
on sale
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
 
declare @chg_of_owner_id int
declare @sl_ratio numeric(5,2)
declare @sl_financing_cd char(5)
declare @sl_ratio_type_cd char(5)
declare @sl_adj_cd char(5)
declare @sl_type_cd char(5)
declare @sl_state_cd char(5)
declare @sl_class_cd char(10)
declare @sl_land_type_cd char(10)
declare @sl_price numeric(14,0)
declare @sl_dt datetime
declare @adjusted_sl_price numeric(14,0)
declare @realtor varchar(30)
declare @finance_comment varchar(50)
declare @amt_down numeric(18,0)
declare @amt_financed numeric(18,0)
declare @interest_rate numeric(14,3)
declare @finance_yrs numeric(4,1)
declare @suppress_on_ratio_rpt_cd char(5)
declare @suppress_on_ratio_rsn varchar(30)
declare @sl_adj_sl_pct numeric(8,4)
declare @sl_adj_sl_amt numeric(14,0)
declare @sl_adj_rsn varchar(50)
declare @sl_comment varchar(500)
declare @sl_yr_blt numeric(4,0)
declare @sl_living_area numeric(14,0)
declare @sl_imprv_unit_price numeric(14,2)
declare @sl_land_sqft numeric(18,2)
declare @sl_land_acres numeric(18,4)
declare @sl_land_front_feet numeric(18,2)
declare @sl_land_depth numeric(18,2)
declare @sl_land_unit_price numeric(14,2)
declare @sl_school_id int
declare @sl_city_id int
declare @sl_qualifier varchar(10)
declare @include_no_calc char(1)
declare @sl_ratio_cd char(5)
declare @import_dt datetime
declare @include_reason varchar(30)
declare @sales_exclude_calc_cd varchar(10)
declare @amt_financed_2 numeric(18,0)
declare @interest_rate_2 numeric(14,2)
declare @finance_yrs_2 numeric(4,1)
declare @sl_sub_class_cd varchar(10)
declare @sl_imprv_type_cd varchar(5)
declare @confidential_sale char(1)
declare @frozen_characteristics char(1)
declare @num_days_on_market numeric(4,0)
declare @sl_exported_flag char(1)
declare @land_only_sale bit
Declare @sl_ratio_cd_reason VarChar(30);
Declare @sl_county_ratio_cd VarChar(10);
Declare @continue_current_use Bit;
 
declare curRows cursor
for
     select chg_of_owner_id, sl_ratio, sl_financing_cd, sl_ratio_type_cd, sl_adj_cd, sl_type_cd, sl_state_cd, sl_class_cd, sl_land_type_cd, sl_price, sl_dt, adjusted_sl_price, realtor, finance_comment, amt_down, amt_financed, interest_rate, finance_yrs, suppress_on_ratio_rpt_cd, suppress_on_ratio_rsn, sl_adj_sl_pct, sl_adj_sl_amt, sl_adj_rsn, sl_comment, sl_yr_blt, sl_living_area, sl_imprv_unit_price, sl_land_sqft, sl_land_acres, sl_land_front_feet, sl_land_depth, sl_land_unit_price, sl_school_id, sl_city_id, sl_qualifier, include_no_calc, sl_ratio_cd, import_dt, include_reason, sales_exclude_calc_cd, amt_financed_2, interest_rate_2, finance_yrs_2, sl_sub_class_cd, sl_imprv_type_cd, confidential_sale, frozen_characteristics, num_days_on_market, sl_exported_flag, land_only_sale, sl_ratio_cd_reason, sl_county_ratio_cd, continue_current_use from inserted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @sl_ratio, @sl_financing_cd, @sl_ratio_type_cd, @sl_adj_cd, @sl_type_cd, @sl_state_cd, @sl_class_cd, @sl_land_type_cd, @sl_price, @sl_dt, @adjusted_sl_price, @realtor, @finance_comment, @amt_down, @amt_financed, @interest_rate, @finance_yrs, @suppress_on_ratio_rpt_cd, @suppress_on_ratio_rsn, @sl_adj_sl_pct, @sl_adj_sl_amt, @sl_adj_rsn, @sl_comment, @sl_yr_blt, @sl_living_area, @sl_imprv_unit_price, @sl_land_sqft, @sl_land_acres, @sl_land_front_feet, @sl_land_depth, @sl_land_unit_price, @sl_school_id, @sl_city_id, @sl_qualifier, @include_no_calc, @sl_ratio_cd, @import_dt, @include_reason, @sales_exclude_calc_cd, @amt_financed_2, @interest_rate_2, @finance_yrs_2, @sl_sub_class_cd, @sl_imprv_type_cd, @confidential_sale, @frozen_characteristics, @num_days_on_market, @sl_exported_flag, @land_only_sale, @sl_ratio_cd_reason, @sl_county_ratio_cd, @continue_current_use
 
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
               chg_log_tables = 'sale' and
               chg_log_columns = 'chg_of_owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 713, null, convert(varchar(255), @chg_of_owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_ratio' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4787, null, convert(varchar(255), @sl_ratio), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_financing_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4774, null, convert(varchar(255), @sl_financing_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_ratio_type_cd' and
            chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4791, null, convert(varchar(255), @sl_ratio_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_adj_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4755, null, convert(varchar(255), @sl_adj_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4796, null, convert(varchar(255), @sl_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_state_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4794, null, convert(varchar(255), @sl_state_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4763, null, convert(varchar(255), @sl_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_land_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4781, null, convert(varchar(255), @sl_land_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4785, null, convert(varchar(255), @sl_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4769, null, convert(varchar(255), @sl_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
     chg_log_columns = 'adjusted_sl_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 101, null, convert(varchar(255), @adjusted_sl_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'realtor' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4306, null, convert(varchar(255), @realtor), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'finance_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 1915, null, convert(varchar(255), @finance_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'amt_down' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 182, null, convert(varchar(255), @amt_down), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'amt_financed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 185, null, convert(varchar(255), @amt_financed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'interest_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 2464, null, convert(varchar(255), @interest_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'finance_yrs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 1916, null, convert(varchar(255), @finance_yrs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'suppress_on_ratio_rpt_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 5014, null, convert(varchar(255), @suppress_on_ratio_rpt_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'suppress_on_ratio_rsn' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 5015, null, convert(varchar(255), @suppress_on_ratio_rsn), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_adj_sl_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4761, null, convert(varchar(255), @sl_adj_sl_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_adj_sl_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4760, null, convert(varchar(255), @sl_adj_sl_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_adj_rsn' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4759, null, convert(varchar(255), @sl_adj_rsn), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
       select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4764, null, convert(varchar(255), @sl_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_yr_blt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4799, null, convert(varchar(255), @sl_yr_blt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_living_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4783, null, convert(varchar(255), @sl_living_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_imprv_unit_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4776, null, convert(varchar(255), @sl_imprv_unit_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_land_sqft' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4780, null, convert(varchar(255), @sl_land_sqft), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_land_acres' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4777, null, convert(varchar(255), @sl_land_acres), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_land_front_feet' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4779, null, convert(varchar(255), @sl_land_front_feet), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_land_depth' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4778, null, convert(varchar(255), @sl_land_depth), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_land_unit_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4782, null, convert(varchar(255), @sl_land_unit_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_school_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4792, null, convert(varchar(255), @sl_school_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_city_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4762, null, convert(varchar(255), @sl_city_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_qualifier' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4786, null, convert(varchar(255), @sl_qualifier), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'include_no_calc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 2338, null, convert(varchar(255), @include_no_calc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_ratio_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4788, null, convert(varchar(255), @sl_ratio_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'import_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 2165, null, convert(varchar(255), @import_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'include_reason' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 2339, null, convert(varchar(255), @include_reason), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sales_exclude_calc_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 4608, null, convert(varchar(255), @sales_exclude_calc_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'amt_financed_2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 186, null, convert(varchar(255), @amt_financed_2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'interest_rate_2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 2465, null, convert(varchar(255), @interest_rate_2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'finance_yrs_2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 1917, null, convert(varchar(255), @finance_yrs_2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_sub_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9227, null, convert(varchar(255), @sl_sub_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_imprv_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9226, null, convert(varchar(255), @sl_imprv_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'confidential_sale' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9241, null, convert(varchar(255), @confidential_sale), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'frozen_characteristics' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9242, null, convert(varchar(255), @frozen_characteristics), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'num_days_on_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9243, null, convert(varchar(255), @num_days_on_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_exported_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9244, null, convert(varchar(255), @sl_exported_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'land_only_sale' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9247, null, convert(varchar(255), @land_only_sale), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end

		if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_ratio_cd_reason' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9493, null, convert(varchar(255), @sl_ratio_cd_reason), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end

		if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'sl_county_ratio_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9494, null, convert(varchar(255), @sl_county_ratio_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end

		if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sale' and
               chg_log_columns = 'continue_current_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 730, 9496, null, convert(varchar(255), @continue_current_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end		
 
		fetch next from curRows into @chg_of_owner_id, @sl_ratio, @sl_financing_cd, @sl_ratio_type_cd, @sl_adj_cd, @sl_type_cd, @sl_state_cd, @sl_class_cd, @sl_land_type_cd, @sl_price, @sl_dt, @adjusted_sl_price, @realtor, @finance_comment, @amt_down, @amt_financed, @interest_rate, @finance_yrs, @suppress_on_ratio_rpt_cd, @suppress_on_ratio_rsn, @sl_adj_sl_pct, @sl_adj_sl_amt, @sl_adj_rsn, @sl_comment, @sl_yr_blt, @sl_living_area, @sl_imprv_unit_price, @sl_land_sqft, @sl_land_acres, @sl_land_front_feet, @sl_land_depth, @sl_land_unit_price, @sl_school_id, @sl_city_id, @sl_qualifier, @include_no_calc, @sl_ratio_cd, @import_dt, @include_reason, @sales_exclude_calc_cd, @amt_financed_2, @interest_rate_2, @finance_yrs_2, @sl_sub_class_cd, @sl_imprv_type_cd, @confidential_sale, @frozen_characteristics, @num_days_on_market, @sl_exported_flag, @land_only_sale, @sl_ratio_cd_reason, @sl_county_ratio_cd, @continue_current_use
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'bit flag to indicate if sale is confidential', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'confidential_sale';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sale exported to the State flag - Texas only', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_exported_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sale type code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'ratio code reason', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_ratio_cd_reason';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'primary use code on the property at the time of sale or last import', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'primary_use_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'listing date of the sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'listing_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'primary land type code on the property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_land_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'WAC code from REET record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'wac_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'adjusted sales price - if sale adjusted.  This is the price we normally use in comps/ratios/search results', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'adjusted_sl_price';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'dollar amount placed down on the sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'amt_down';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'primary year built on the property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_yr_blt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'total land square footage', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_land_sqft';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'land unit price on the property at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_land_unit_price';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'flag to indicate the sale should be in the ratio report, but not included in the calculations', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'include_no_calc';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'financing code entered by user', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_financing_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'code selected when include_no_calc is selected', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sales_exclude_calc_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'second loan term ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'finance_yrs_2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'total land depth on the property at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_land_depth';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'city entity code on the property at time of sale - does not work with WA, as they do not have entities', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_city_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'why the sale, if marked include_no_calc, was excluded from calcs', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'include_reason';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'ID established by PACS at the time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'chg_of_owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'second interest rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'interest_rate_2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'improvement type code on the property at the time of sale or last import', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_imprv_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sales price adjustment reason', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_adj_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'days the property was available for sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'num_days_on_market';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'If rental property, the monhtly income received', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'monthly_income';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'county sales ratio code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_county_ratio_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'primary class code of the property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_class_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'number of years financed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'finance_yrs';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sale price adjustment percentage', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_adj_sl_pct';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sale comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'living area unit price', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_imprv_unit_price';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Reason the sale will be suppressed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'suppress_on_ratio_rsn';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sale price adjustment reason', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_adj_rsn';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'total living area on the property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_living_area';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'total land front feet on the property at time of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_land_front_feet';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'school entity code on the property at time of sale - does not work with WA, as they do not have entities', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_school_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date property characteristics were imported into the sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'import_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption amount from REET record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'exemption_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'listing price of the sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'listing_price';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date of sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'comment specific to financing', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'finance_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'interest rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'interest_rate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'realtor involved in sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'realtor';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'dollar amount financed for the sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'amt_financed';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'T/F if the sale will be included on the ratio report', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'suppress_on_ratio_rpt_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sale price adjustment amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_adj_sl_amt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'second amount financed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'amt_financed_2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sale ratio type code entered by user', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_ratio_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sub-class code on the property at the time of sale or last import', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_sub_class_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'indicates if the user selected the charactersistics of this property are current flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'frozen_characteristics';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'the sale should be reflected as a land only sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'land_only_sale';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'primary state code of the property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_state_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'for Washington, a flag to indicate if the current use needs to continue', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'continue_current_use';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'secondary use code on the property at the time of sale or last import', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'secondary_use_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Personal property amount from REET record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'pers_prop_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'sales price', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sale', @level2type = N'COLUMN', @level2name = N'sl_price';


GO

