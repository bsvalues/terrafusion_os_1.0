CREATE TABLE [dbo].[building_permit] (
    [bldg_permit_id]                      INT             NOT NULL,
    [bldg_permit_status]                  VARCHAR (5)     NULL,
    [bldg_permit_cad_status]              VARCHAR (5)     NULL,
    [bldg_permit_type_cd]                 VARCHAR (10)    NULL,
    [bldg_permit_sub_type_cd]             VARCHAR (5)     NULL,
    [bldg_permit_num]                     VARCHAR (30)    NULL,
    [bldg_permit_issuer]                  VARCHAR (5)     NULL,
    [bldg_permit_issue_dt]                DATETIME        NULL,
    [bldg_permit_limit_dt]                DATETIME        NULL,
    [bldg_permit_dt_complete]             DATETIME        NULL,
    [bldg_permit_val]                     NUMERIC (18)    NULL,
    [bldg_permit_area]                    NUMERIC (18)    NULL,
    [bldg_permit_dim_1]                   VARCHAR (10)    NULL,
    [bldg_permit_dim_2]                   VARCHAR (10)    NULL,
    [bldg_permit_dim_3]                   VARCHAR (10)    NULL,
    [bldg_permit_num_floors]              NUMERIC (18)    NULL,
    [bldg_permit_num_units]               NUMERIC (18)    NULL,
    [bldg_permit_appraiser_id]            INT             NULL,
    [bldg_permit_dt_worked]               DATETIME        NULL,
    [bldg_permit_pct_complete]            NUMERIC (5, 2)  NULL,
    [bldg_permit_builder]                 VARCHAR (30)    NULL,
    [bldg_permit_builder_phone]           VARCHAR (16)    NULL,
    [bldg_permit_active]                  CHAR (1)        NULL,
    [bldg_permit_last_chg]                DATETIME        NULL,
    [bldg_permit_cmnt]                    VARCHAR (512)   NULL,
    [bldg_permit_issued_to]               VARCHAR (255)   NULL,
    [bldg_permit_owner_phone]             VARCHAR (16)    NULL,
    [bldg_permit_res_com]                 CHAR (1)        NULL,
    [bldg_permit_street_num]              VARCHAR (10)    NULL,
    [bldg_permit_street_prefix]           VARCHAR (10)    NULL,
    [bldg_permit_street_name]             VARCHAR (50)    NULL,
    [bldg_permit_street_suffix]           VARCHAR (10)    NULL,
    [bldg_permit_unit_type]               VARCHAR (5)     NULL,
    [bldg_permit_unit_number]             VARCHAR (15)    NULL,
    [bldg_permit_sub_division]            VARCHAR (50)    NULL,
    [bldg_permit_plat]                    VARCHAR (4)     NULL,
    [bldg_permit_block]                   VARCHAR (4)     NULL,
    [bldg_permit_lot]                     VARCHAR (30)    NULL,
    [bldg_permit_city]                    VARCHAR (30)    NULL,
    [bldg_permit_land_use]                VARCHAR (30)    NULL,
    [bldg_permit_source]                  VARCHAR (50)    NULL,
    [bldg_permit_pct_complete_override]   BIT             CONSTRAINT [CDF_building_permit_bldg_permit_pct_complete_override] DEFAULT ((0)) NOT NULL,
    [bldg_permit_bldg_inspect_req]        CHAR (1)        NULL,
    [bldg_permit_elec_inspect_req]        CHAR (1)        NULL,
    [bldg_permit_mech_inspect_req]        CHAR (1)        NULL,
    [bldg_permit_plumb_inspect_req]       CHAR (1)        NULL,
    [bldg_permit_old_permit_no]           VARCHAR (20)    NULL,
    [bldg_permit_property_roll]           VARCHAR (50)    NULL,
    [bldg_permit_place_id]                NUMERIC (18)    NULL,
    [bldg_permit_import_dt]               DATETIME        NULL,
    [bldg_permit_street_sub]              VARCHAR (5)     NULL,
    [bldg_permit_case_name]               VARCHAR (30)    NULL,
    [bldg_permit_project_num]             VARCHAR (15)    NULL,
    [bldg_permit_project_name]            VARCHAR (30)    NULL,
    [bldg_permit_calc_value]              NUMERIC (18)    NULL,
    [bldg_permit_acreage]                 NUMERIC (18, 4) NULL,
    [bldg_permit_prim_zoning]             VARCHAR (15)    NULL,
    [bldg_permit_second_zoning]           VARCHAR (15)    NULL,
    [bldg_permit_import_prop_id]          VARCHAR (15)    NULL,
    [bldg_permit_legal]                   VARCHAR (255)   NULL,
    [bldg_permit_bldg_number]             VARCHAR (6)     NULL,
    [bldg_permit_desc]                    VARCHAR (255)   NULL,
    [bldg_permit_county_percent_complete] NUMERIC (5, 2)  NULL,
    [bldg_permit_import_status]           VARCHAR (15)    NULL,
    [active_bit]                          BIT             NULL,
    [bldg_permit_other_id]                VARCHAR (15)    NULL,
    [bldg_permit_worksheet_type_cd]       VARCHAR (10)    NULL,
    CONSTRAINT [CPK_building_permit] PRIMARY KEY CLUSTERED ([bldg_permit_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_building_permit_bldg_permit_appraiser_id] FOREIGN KEY ([bldg_permit_appraiser_id]) REFERENCES [dbo].[appraiser] ([appraiser_id]),
    CONSTRAINT [CFK_building_permit_bldg_permit_cad_status] FOREIGN KEY ([bldg_permit_cad_status]) REFERENCES [dbo].[bp_cad_status_cd] ([CadStatus]),
    CONSTRAINT [CFK_building_permit_bldg_permit_issuer] FOREIGN KEY ([bldg_permit_issuer]) REFERENCES [dbo].[building_permit_issuer] ([issuer_cd]),
    CONSTRAINT [CFK_building_permit_bldg_permit_status] FOREIGN KEY ([bldg_permit_status]) REFERENCES [dbo].[bp_issuer_status_cd] ([IssuerStatus]),
    CONSTRAINT [CFK_building_permit_bldg_permit_sub_type_cd] FOREIGN KEY ([bldg_permit_sub_type_cd]) REFERENCES [dbo].[bld_permit_sub_type] ([PermitSubtypeCode]),
    CONSTRAINT [CFK_building_permit_bldg_permit_type_cd] FOREIGN KEY ([bldg_permit_type_cd]) REFERENCES [dbo].[bld_permit_type] ([bld_permit_type_cd]),
    CONSTRAINT [CFK_building_permit_bldg_permit_worksheet_type_cd] FOREIGN KEY ([bldg_permit_worksheet_type_cd]) REFERENCES [dbo].[building_permit_worksheet_type] ([type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_issue_dt]
    ON [dbo].[building_permit]([bldg_permit_issue_dt] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_import_dt]
    ON [dbo].[building_permit]([bldg_permit_import_dt] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_status]
    ON [dbo].[building_permit]([bldg_permit_status] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_street_name]
    ON [dbo].[building_permit]([bldg_permit_street_name] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_type_cd]
    ON [dbo].[building_permit]([bldg_permit_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_num]
    ON [dbo].[building_permit]([bldg_permit_num] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_city]
    ON [dbo].[building_permit]([bldg_permit_city] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_sub_type_cd]
    ON [dbo].[building_permit]([bldg_permit_sub_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

create trigger tr_building_permit_update_ChangeLog
on dbo.building_permit
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
 
declare @old_bldg_permit_id int
declare @new_bldg_permit_id int
declare @old_bldg_permit_status varchar(5)
declare @new_bldg_permit_status varchar(5)
declare @old_bldg_permit_cad_status varchar(5)
declare @new_bldg_permit_cad_status varchar(5)
declare @old_bldg_permit_type_cd varchar(10)
declare @new_bldg_permit_type_cd varchar(10)
declare @old_bldg_permit_sub_type_cd varchar(5)
declare @new_bldg_permit_sub_type_cd varchar(5)
declare @old_bldg_permit_num varchar(30)
declare @new_bldg_permit_num varchar(30)
declare @old_bldg_permit_issuer varchar(30)
declare @new_bldg_permit_issuer varchar(30)
declare @old_bldg_permit_issue_dt datetime
declare @new_bldg_permit_issue_dt datetime
declare @old_bldg_permit_limit_dt datetime
declare @new_bldg_permit_limit_dt datetime
declare @old_bldg_permit_dt_complete datetime
declare @new_bldg_permit_dt_complete datetime
declare @old_bldg_permit_val numeric(18,0)
declare @new_bldg_permit_val numeric(18,0)
declare @old_bldg_permit_area numeric(18,0)
declare @new_bldg_permit_area numeric(18,0)
declare @old_bldg_permit_dim_1 varchar(10)
declare @new_bldg_permit_dim_1 varchar(10)
declare @old_bldg_permit_dim_2 varchar(10)
declare @new_bldg_permit_dim_2 varchar(10)
declare @old_bldg_permit_dim_3 varchar(10)
declare @new_bldg_permit_dim_3 varchar(10)
declare @old_bldg_permit_num_floors numeric(18,0)
declare @new_bldg_permit_num_floors numeric(18,0)
declare @old_bldg_permit_num_units numeric(18,0)
declare @new_bldg_permit_num_units numeric(18,0)
declare @old_bldg_permit_appraiser_id int
declare @new_bldg_permit_appraiser_id int
declare @old_bldg_permit_dt_worked datetime
declare @new_bldg_permit_dt_worked datetime
declare @old_bldg_permit_pct_complete numeric(18,0)
declare @new_bldg_permit_pct_complete numeric(18,0)
declare @old_bldg_permit_builder varchar(30)
declare @new_bldg_permit_builder varchar(30)
declare @old_bldg_permit_builder_phone varchar(16)
declare @new_bldg_permit_builder_phone varchar(16)
declare @old_bldg_permit_active char(1)
declare @new_bldg_permit_active char(1)
declare @old_bldg_permit_last_chg datetime
declare @new_bldg_permit_last_chg datetime
declare @old_bldg_permit_cmnt varchar(512)
declare @new_bldg_permit_cmnt varchar(512)
declare @old_bldg_permit_issued_to varchar(50)
declare @new_bldg_permit_issued_to varchar(50)
declare @old_bldg_permit_owner_phone varchar(16)
declare @new_bldg_permit_owner_phone varchar(16)
declare @old_bldg_permit_res_com char(1)
declare @new_bldg_permit_res_com char(1)
declare @old_bldg_permit_street_num varchar(10)
declare @new_bldg_permit_street_num varchar(10)
declare @old_bldg_permit_street_prefix varchar(10)
declare @new_bldg_permit_street_prefix varchar(10)
declare @old_bldg_permit_street_name varchar(50)
declare @new_bldg_permit_street_name varchar(50)
declare @old_bldg_permit_street_suffix varchar(10)
declare @new_bldg_permit_street_suffix varchar(10)
declare @old_bldg_permit_unit_type varchar(5)
declare @new_bldg_permit_unit_type varchar(5)
declare @old_bldg_permit_unit_number varchar(15)
declare @new_bldg_permit_unit_number varchar(15)
declare @old_bldg_permit_sub_division varchar(30)
declare @new_bldg_permit_sub_division varchar(30)
declare @old_bldg_permit_plat varchar(4)
declare @new_bldg_permit_plat varchar(4)
declare @old_bldg_permit_block varchar(3)
declare @new_bldg_permit_block varchar(3)
declare @old_bldg_permit_lot varchar(30)
declare @new_bldg_permit_lot varchar(30)
declare @old_bldg_permit_city varchar(30)
declare @new_bldg_permit_city varchar(30)
declare @old_bldg_permit_land_use varchar(30)
declare @new_bldg_permit_land_use varchar(30)
declare @old_bldg_permit_source varchar(50)
declare @new_bldg_permit_source varchar(50)
declare @old_bldg_permit_pct_complete_override bit
declare @new_bldg_permit_pct_complete_override bit
declare @old_bldg_permit_bldg_inspect_req char(1)
declare @new_bldg_permit_bldg_inspect_req char(1)
declare @old_bldg_permit_elec_inspect_req char(1)
declare @new_bldg_permit_elec_inspect_req char(1)
declare @old_bldg_permit_mech_inspect_req char(1)
declare @new_bldg_permit_mech_inspect_req char(1)
declare @old_bldg_permit_plumb_inspect_req char(1)
declare @new_bldg_permit_plumb_inspect_req char(1)
declare @old_bldg_permit_old_permit_no varchar(20)
declare @new_bldg_permit_old_permit_no varchar(20)
declare @old_bldg_permit_property_roll varchar(50)
declare @new_bldg_permit_property_roll varchar(50)
declare @old_bldg_permit_place_id numeric(18,0)
declare @new_bldg_permit_place_id numeric(18,0)
declare @old_bldg_permit_import_dt datetime
declare @new_bldg_permit_import_dt datetime
 
declare curRows cursor
for
     select d.bldg_permit_id, d.bldg_permit_status, d.bldg_permit_cad_status, d.bldg_permit_type_cd, d.bldg_permit_sub_type_cd, d.bldg_permit_num, d.bldg_permit_issuer, d.bldg_permit_issue_dt, d.bldg_permit_limit_dt, d.bldg_permit_dt_complete, d.bldg_permit_val, d.bldg_permit_area, d.bldg_permit_dim_1, d.bldg_permit_dim_2, d.bldg_permit_dim_3, d.bldg_permit_num_floors, d.bldg_permit_num_units, d.bldg_permit_appraiser_id, d.bldg_permit_dt_worked, d.bldg_permit_pct_complete, d.bldg_permit_builder, d.bldg_permit_builder_phone, d.bldg_permit_active, d.bldg_permit_last_chg, d.bldg_permit_cmnt, d.bldg_permit_issued_to, d.bldg_permit_owner_phone, d.bldg_permit_res_com, d.bldg_permit_street_num, d.bldg_permit_street_prefix, d.bldg_permit_street_name, d.bldg_permit_street_suffix, d.bldg_permit_unit_type, d.bldg_permit_unit_number, d.bldg_permit_sub_division, d.bldg_permit_plat, d.bldg_permit_block, d.bldg_permit_lot, d.bldg_permit_city, d.bldg_permit_land_use, d.bldg_permit_source, d.bldg_permit_pct_complete_override, d.bldg_permit_bldg_inspect_req, d.bldg_permit_elec_inspect_req, d.bldg_permit_mech_inspect_req, d.bldg_permit_plumb_inspect_req, d.bldg_permit_old_permit_no, d.bldg_permit_property_roll, d.bldg_permit_place_id, d.bldg_permit_import_dt, i.bldg_permit_id, i.bldg_permit_status, i.bldg_permit_cad_status, i.bldg_permit_type_cd, i.bldg_permit_sub_type_cd, i.bldg_permit_num, i.bldg_permit_issuer, i.bldg_permit_issue_dt, i.bldg_permit_limit_dt, i.bldg_permit_dt_complete, i.bldg_permit_val, i.bldg_permit_area, i.bldg_permit_dim_1, i.bldg_permit_dim_2, i.bldg_permit_dim_3, i.bldg_permit_num_floors, i.bldg_permit_num_units, i.bldg_permit_appraiser_id, i.bldg_permit_dt_worked, i.bldg_permit_pct_complete, i.bldg_permit_builder, i.bldg_permit_builder_phone, i.bldg_permit_active, i.bldg_permit_last_chg, i.bldg_permit_cmnt, i.bldg_permit_issued_to, i.bldg_permit_owner_phone, i.bldg_permit_res_com, i.bldg_permit_street_num, i.bldg_permit_street_prefix, i.bldg_permit_street_name, i.bldg_permit_street_suffix, i.bldg_permit_unit_type, i.bldg_permit_unit_number, i.bldg_permit_sub_division, i.bldg_permit_plat, i.bldg_permit_block, i.bldg_permit_lot, i.bldg_permit_city, i.bldg_permit_land_use, i.bldg_permit_source, i.bldg_permit_pct_complete_override, i.bldg_permit_bldg_inspect_req, i.bldg_permit_elec_inspect_req, i.bldg_permit_mech_inspect_req, i.bldg_permit_plumb_inspect_req, i.bldg_permit_old_permit_no, i.bldg_permit_property_roll, i.bldg_permit_place_id, i.bldg_permit_import_dt
from deleted as d
join inserted as i on 
     d.bldg_permit_id = i.bldg_permit_id
for read only
 
open curRows
fetch next from curRows into @old_bldg_permit_id, @old_bldg_permit_status, @old_bldg_permit_cad_status, @old_bldg_permit_type_cd, @old_bldg_permit_sub_type_cd, @old_bldg_permit_num, @old_bldg_permit_issuer, @old_bldg_permit_issue_dt, @old_bldg_permit_limit_dt, @old_bldg_permit_dt_complete, @old_bldg_permit_val, @old_bldg_permit_area, @old_bldg_permit_dim_1, @old_bldg_permit_dim_2, @old_bldg_permit_dim_3, @old_bldg_permit_num_floors, @old_bldg_permit_num_units, @old_bldg_permit_appraiser_id, @old_bldg_permit_dt_worked, @old_bldg_permit_pct_complete, @old_bldg_permit_builder, @old_bldg_permit_builder_phone, @old_bldg_permit_active, @old_bldg_permit_last_chg, @old_bldg_permit_cmnt, @old_bldg_permit_issued_to, @old_bldg_permit_owner_phone, @old_bldg_permit_res_com, @old_bldg_permit_street_num, @old_bldg_permit_street_prefix, @old_bldg_permit_street_name, @old_bldg_permit_street_suffix, @old_bldg_permit_unit_type, @old_bldg_permit_unit_number, @old_bldg_permit_sub_division, @old_bldg_permit_plat, @old_bldg_permit_block, @old_bldg_permit_lot, @old_bldg_permit_city, @old_bldg_permit_land_use, @old_bldg_permit_source, @old_bldg_permit_pct_complete_override, @old_bldg_permit_bldg_inspect_req, @old_bldg_permit_elec_inspect_req, @old_bldg_permit_mech_inspect_req, @old_bldg_permit_plumb_inspect_req, @old_bldg_permit_old_permit_no, @old_bldg_permit_property_roll, @old_bldg_permit_place_id, @old_bldg_permit_import_dt, @new_bldg_permit_id, @new_bldg_permit_status, @new_bldg_permit_cad_status, @new_bldg_permit_type_cd, @new_bldg_permit_sub_type_cd, @new_bldg_permit_num, @new_bldg_permit_issuer, @new_bldg_permit_issue_dt, @new_bldg_permit_limit_dt, @new_bldg_permit_dt_complete, @new_bldg_permit_val, @new_bldg_permit_area, @new_bldg_permit_dim_1, @new_bldg_permit_dim_2, @new_bldg_permit_dim_3, @new_bldg_permit_num_floors, @new_bldg_permit_num_units, @new_bldg_permit_appraiser_id, @new_bldg_permit_dt_worked, @new_bldg_permit_pct_complete, @new_bldg_permit_builder, @new_bldg_permit_builder_phone, @new_bldg_permit_active, @new_bldg_permit_last_chg, @new_bldg_permit_cmnt, @new_bldg_permit_issued_to, @new_bldg_permit_owner_phone, @new_bldg_permit_res_com, @new_bldg_permit_street_num, @new_bldg_permit_street_prefix, @new_bldg_permit_street_name, @new_bldg_permit_street_suffix, @new_bldg_permit_unit_type, @new_bldg_permit_unit_number, @new_bldg_permit_sub_division, @new_bldg_permit_plat, @new_bldg_permit_block, @new_bldg_permit_lot, @new_bldg_permit_city, @new_bldg_permit_land_use, @new_bldg_permit_source, @new_bldg_permit_pct_complete_override, @new_bldg_permit_bldg_inspect_req, @new_bldg_permit_elec_inspect_req, @new_bldg_permit_mech_inspect_req, @new_bldg_permit_plumb_inspect_req, @new_bldg_permit_old_permit_no, @new_bldg_permit_property_roll, @new_bldg_permit_place_id, @new_bldg_permit_import_dt
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Permit: ' + convert(varchar(12), @new_bldg_permit_id)
 
     if (
          @old_bldg_permit_id <> @new_bldg_permit_id
          or
          ( @old_bldg_permit_id is null and @new_bldg_permit_id is not null ) 
          or
          ( @old_bldg_permit_id is not null and @new_bldg_permit_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 531, convert(varchar(255), @old_bldg_permit_id), convert(varchar(255), @new_bldg_permit_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_status <> @new_bldg_permit_status
          or
          ( @old_bldg_permit_status is null and @new_bldg_permit_status is not null ) 
          or
          ( @old_bldg_permit_status is not null and @new_bldg_permit_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8507, convert(varchar(255), @old_bldg_permit_status), convert(varchar(255), @new_bldg_permit_status) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_cad_status <> @new_bldg_permit_cad_status
          or
          ( @old_bldg_permit_cad_status is null and @new_bldg_permit_cad_status is not null ) 
          or
          ( @old_bldg_permit_cad_status is not null and @new_bldg_permit_cad_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_cad_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8822, convert(varchar(255), @old_bldg_permit_cad_status), convert(varchar(255), @new_bldg_permit_cad_status) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_type_cd <> @new_bldg_permit_type_cd
          or
          ( @old_bldg_permit_type_cd is null and @new_bldg_permit_type_cd is not null ) 
          or
          ( @old_bldg_permit_type_cd is not null and @new_bldg_permit_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 546, convert(varchar(255), @old_bldg_permit_type_cd), convert(varchar(255), @new_bldg_permit_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_sub_type_cd <> @new_bldg_permit_sub_type_cd
          or
          ( @old_bldg_permit_sub_type_cd is null and @new_bldg_permit_sub_type_cd is not null ) 
          or
          ( @old_bldg_permit_sub_type_cd is not null and @new_bldg_permit_sub_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_sub_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8509, convert(varchar(255), @old_bldg_permit_sub_type_cd), convert(varchar(255), @new_bldg_permit_sub_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_num <> @new_bldg_permit_num
          or
          ( @old_bldg_permit_num is null and @new_bldg_permit_num is not null ) 
          or
          ( @old_bldg_permit_num is not null and @new_bldg_permit_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 538, convert(varchar(255), @old_bldg_permit_num), convert(varchar(255), @new_bldg_permit_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_issuer <> @new_bldg_permit_issuer
          or
          ( @old_bldg_permit_issuer is null and @new_bldg_permit_issuer is not null ) 
          or
          ( @old_bldg_permit_issuer is not null and @new_bldg_permit_issuer is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_issuer' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 534, convert(varchar(255), @old_bldg_permit_issuer), convert(varchar(255), @new_bldg_permit_issuer) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_issue_dt <> @new_bldg_permit_issue_dt
          or
          ( @old_bldg_permit_issue_dt is null and @new_bldg_permit_issue_dt is not null ) 
          or
          ( @old_bldg_permit_issue_dt is not null and @new_bldg_permit_issue_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_issue_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 532, convert(varchar(255), @old_bldg_permit_issue_dt), convert(varchar(255), @new_bldg_permit_issue_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_limit_dt <> @new_bldg_permit_limit_dt
          or
          ( @old_bldg_permit_limit_dt is null and @new_bldg_permit_limit_dt is not null ) 
          or
          ( @old_bldg_permit_limit_dt is not null and @new_bldg_permit_limit_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_limit_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 537, convert(varchar(255), @old_bldg_permit_limit_dt), convert(varchar(255), @new_bldg_permit_limit_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_dt_complete <> @new_bldg_permit_dt_complete
          or
          ( @old_bldg_permit_dt_complete is null and @new_bldg_permit_dt_complete is not null ) 
          or
          ( @old_bldg_permit_dt_complete is not null and @new_bldg_permit_dt_complete is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_dt_complete' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 529, convert(varchar(255), @old_bldg_permit_dt_complete), convert(varchar(255), @new_bldg_permit_dt_complete) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_val <> @new_bldg_permit_val
          or
          ( @old_bldg_permit_val is null and @new_bldg_permit_val is not null ) 
          or
          ( @old_bldg_permit_val is not null and @new_bldg_permit_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 547, convert(varchar(255), @old_bldg_permit_val), convert(varchar(255), @new_bldg_permit_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_area <> @new_bldg_permit_area
          or
          ( @old_bldg_permit_area is null and @new_bldg_permit_area is not null ) 
          or
          ( @old_bldg_permit_area is not null and @new_bldg_permit_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 525, convert(varchar(255), @old_bldg_permit_area), convert(varchar(255), @new_bldg_permit_area) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_dim_1 <> @new_bldg_permit_dim_1
          or
          ( @old_bldg_permit_dim_1 is null and @new_bldg_permit_dim_1 is not null ) 
          or
          ( @old_bldg_permit_dim_1 is not null and @new_bldg_permit_dim_1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_dim_1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8492, convert(varchar(255), @old_bldg_permit_dim_1), convert(varchar(255), @new_bldg_permit_dim_1) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_dim_2 <> @new_bldg_permit_dim_2
          or
          ( @old_bldg_permit_dim_2 is null and @new_bldg_permit_dim_2 is not null ) 
          or
          ( @old_bldg_permit_dim_2 is not null and @new_bldg_permit_dim_2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_dim_2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8493, convert(varchar(255), @old_bldg_permit_dim_2), convert(varchar(255), @new_bldg_permit_dim_2) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_dim_3 <> @new_bldg_permit_dim_3
          or
          ( @old_bldg_permit_dim_3 is null and @new_bldg_permit_dim_3 is not null ) 
          or
          ( @old_bldg_permit_dim_3 is not null and @new_bldg_permit_dim_3 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_dim_3' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8494, convert(varchar(255), @old_bldg_permit_dim_3), convert(varchar(255), @new_bldg_permit_dim_3) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_num_floors <> @new_bldg_permit_num_floors
          or
          ( @old_bldg_permit_num_floors is null and @new_bldg_permit_num_floors is not null ) 
          or
          ( @old_bldg_permit_num_floors is not null and @new_bldg_permit_num_floors is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_num_floors' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8498, convert(varchar(255), @old_bldg_permit_num_floors), convert(varchar(255), @new_bldg_permit_num_floors) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_num_units <> @new_bldg_permit_num_units
          or
          ( @old_bldg_permit_num_units is null and @new_bldg_permit_num_units is not null ) 
          or
          ( @old_bldg_permit_num_units is not null and @new_bldg_permit_num_units is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_num_units' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8499, convert(varchar(255), @old_bldg_permit_num_units), convert(varchar(255), @new_bldg_permit_num_units) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_appraiser_id <> @new_bldg_permit_appraiser_id
          or
          ( @old_bldg_permit_appraiser_id is null and @new_bldg_permit_appraiser_id is not null ) 
          or
          ( @old_bldg_permit_appraiser_id is not null and @new_bldg_permit_appraiser_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_appraiser_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 524, convert(varchar(255), @old_bldg_permit_appraiser_id), convert(varchar(255), @new_bldg_permit_appraiser_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_dt_worked <> @new_bldg_permit_dt_worked
          or
          ( @old_bldg_permit_dt_worked is null and @new_bldg_permit_dt_worked is not null ) 
          or
          ( @old_bldg_permit_dt_worked is not null and @new_bldg_permit_dt_worked is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_dt_worked' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 530, convert(varchar(255), @old_bldg_permit_dt_worked), convert(varchar(255), @new_bldg_permit_dt_worked) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_pct_complete <> @new_bldg_permit_pct_complete
          or
          ( @old_bldg_permit_pct_complete is null and @new_bldg_permit_pct_complete is not null ) 
          or
          ( @old_bldg_permit_pct_complete is not null and @new_bldg_permit_pct_complete is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_pct_complete' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 539, convert(varchar(255), @old_bldg_permit_pct_complete), convert(varchar(255), @new_bldg_permit_pct_complete) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_builder <> @new_bldg_permit_builder
          or
          ( @old_bldg_permit_builder is null and @new_bldg_permit_builder is not null ) 
          or
          ( @old_bldg_permit_builder is not null and @new_bldg_permit_builder is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_builder' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 526, convert(varchar(255), @old_bldg_permit_builder), convert(varchar(255), @new_bldg_permit_builder) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_builder_phone <> @new_bldg_permit_builder_phone
          or
          ( @old_bldg_permit_builder_phone is null and @new_bldg_permit_builder_phone is not null ) 
          or
          ( @old_bldg_permit_builder_phone is not null and @new_bldg_permit_builder_phone is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_builder_phone' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8491, convert(varchar(255), @old_bldg_permit_builder_phone), convert(varchar(255), @new_bldg_permit_builder_phone) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_active <> @new_bldg_permit_active
          or
          ( @old_bldg_permit_active is null and @new_bldg_permit_active is not null ) 
          or
          ( @old_bldg_permit_active is not null and @new_bldg_permit_active is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_active' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 523, convert(varchar(255), @old_bldg_permit_active), convert(varchar(255), @new_bldg_permit_active) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_last_chg <> @new_bldg_permit_last_chg
          or
          ( @old_bldg_permit_last_chg is null and @new_bldg_permit_last_chg is not null ) 
          or
          ( @old_bldg_permit_last_chg is not null and @new_bldg_permit_last_chg is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_last_chg' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 536, convert(varchar(255), @old_bldg_permit_last_chg), convert(varchar(255), @new_bldg_permit_last_chg) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_cmnt <> @new_bldg_permit_cmnt
          or
          ( @old_bldg_permit_cmnt is null and @new_bldg_permit_cmnt is not null ) 
          or
          ( @old_bldg_permit_cmnt is not null and @new_bldg_permit_cmnt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_cmnt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 528, convert(varchar(255), @old_bldg_permit_cmnt), convert(varchar(255), @new_bldg_permit_cmnt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_issued_to <> @new_bldg_permit_issued_to
          or
          ( @old_bldg_permit_issued_to is null and @new_bldg_permit_issued_to is not null ) 
          or
          ( @old_bldg_permit_issued_to is not null and @new_bldg_permit_issued_to is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_issued_to' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 533, convert(varchar(255), @old_bldg_permit_issued_to), convert(varchar(255), @new_bldg_permit_issued_to) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
        end
     end
 
     if (
          @old_bldg_permit_owner_phone <> @new_bldg_permit_owner_phone
          or
          ( @old_bldg_permit_owner_phone is null and @new_bldg_permit_owner_phone is not null ) 
          or
          ( @old_bldg_permit_owner_phone is not null and @new_bldg_permit_owner_phone is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_owner_phone' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8501, convert(varchar(255), @old_bldg_permit_owner_phone), convert(varchar(255), @new_bldg_permit_owner_phone) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_res_com <> @new_bldg_permit_res_com
          or
          ( @old_bldg_permit_res_com is null and @new_bldg_permit_res_com is not null ) 
          or
          ( @old_bldg_permit_res_com is not null and @new_bldg_permit_res_com is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_res_com' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8824, convert(varchar(255), @old_bldg_permit_res_com), convert(varchar(255), @new_bldg_permit_res_com) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_street_num <> @new_bldg_permit_street_num
          or
          ( @old_bldg_permit_street_num is null and @new_bldg_permit_street_num is not null ) 
          or
          ( @old_bldg_permit_street_num is not null and @new_bldg_permit_street_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_street_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 543, convert(varchar(255), @old_bldg_permit_street_num), convert(varchar(255), @new_bldg_permit_street_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_street_prefix <> @new_bldg_permit_street_prefix
          or
          ( @old_bldg_permit_street_prefix is null and @new_bldg_permit_street_prefix is not null ) 
          or
          ( @old_bldg_permit_street_prefix is not null and @new_bldg_permit_street_prefix is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_street_prefix' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 544, convert(varchar(255), @old_bldg_permit_street_prefix), convert(varchar(255), @new_bldg_permit_street_prefix) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_street_name <> @new_bldg_permit_street_name
          or
          ( @old_bldg_permit_street_name is null and @new_bldg_permit_street_name is not null ) 
          or
          ( @old_bldg_permit_street_name is not null and @new_bldg_permit_street_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_street_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 542, convert(varchar(255), @old_bldg_permit_street_name), convert(varchar(255), @new_bldg_permit_street_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_street_suffix <> @new_bldg_permit_street_suffix
          or
          ( @old_bldg_permit_street_suffix is null and @new_bldg_permit_street_suffix is not null ) 
          or
          ( @old_bldg_permit_street_suffix is not null and @new_bldg_permit_street_suffix is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_street_suffix' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 545, convert(varchar(255), @old_bldg_permit_street_suffix), convert(varchar(255), @new_bldg_permit_street_suffix) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_unit_type <> @new_bldg_permit_unit_type
          or
          ( @old_bldg_permit_unit_type is null and @new_bldg_permit_unit_type is not null ) 
          or
      ( @old_bldg_permit_unit_type is not null and @new_bldg_permit_unit_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_unit_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8511, convert(varchar(255), @old_bldg_permit_unit_type), convert(varchar(255), @new_bldg_permit_unit_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_unit_number <> @new_bldg_permit_unit_number
          or
          ( @old_bldg_permit_unit_number is null and @new_bldg_permit_unit_number is not null ) 
          or
          ( @old_bldg_permit_unit_number is not null and @new_bldg_permit_unit_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_unit_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8510, convert(varchar(255), @old_bldg_permit_unit_number), convert(varchar(255), @new_bldg_permit_unit_number) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_sub_division <> @new_bldg_permit_sub_division
          or
          ( @old_bldg_permit_sub_division is null and @new_bldg_permit_sub_division is not null ) 
          or
          ( @old_bldg_permit_sub_division is not null and @new_bldg_permit_sub_division is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_sub_division' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8508, convert(varchar(255), @old_bldg_permit_sub_division), convert(varchar(255), @new_bldg_permit_sub_division) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_plat <> @new_bldg_permit_plat
          or
          ( @old_bldg_permit_plat is null and @new_bldg_permit_plat is not null ) 
          or
          ( @old_bldg_permit_plat is not null and @new_bldg_permit_plat is null ) 
     )
     begin
          if exists (
select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_plat' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8503, convert(varchar(255), @old_bldg_permit_plat), convert(varchar(255), @new_bldg_permit_plat) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_block <> @new_bldg_permit_block
          or
          ( @old_bldg_permit_block is null and @new_bldg_permit_block is not null ) 
          or
          ( @old_bldg_permit_block is not null and @new_bldg_permit_block is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_block' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8490, convert(varchar(255), @old_bldg_permit_block), convert(varchar(255), @new_bldg_permit_block) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_lot <> @new_bldg_permit_lot
          or
          ( @old_bldg_permit_lot is null and @new_bldg_permit_lot is not null ) 
          or
          ( @old_bldg_permit_lot is not null and @new_bldg_permit_lot is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_lot' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8496, convert(varchar(255), @old_bldg_permit_lot), convert(varchar(255), @new_bldg_permit_lot) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_city <> @new_bldg_permit_city
          or
          ( @old_bldg_permit_city is null and @new_bldg_permit_city is not null ) 
          or
          ( @old_bldg_permit_city is not null and @new_bldg_permit_city is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_city' and
                    chg_log_audit = 1
          )
          begin
  insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 527, convert(varchar(255), @old_bldg_permit_city), convert(varchar(255), @new_bldg_permit_city) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_land_use <> @new_bldg_permit_land_use
          or
          ( @old_bldg_permit_land_use is null and @new_bldg_permit_land_use is not null ) 
          or
          ( @old_bldg_permit_land_use is not null and @new_bldg_permit_land_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_land_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 535, convert(varchar(255), @old_bldg_permit_land_use), convert(varchar(255), @new_bldg_permit_land_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_source <> @new_bldg_permit_source
          or
          ( @old_bldg_permit_source is null and @new_bldg_permit_source is not null ) 
          or
          ( @old_bldg_permit_source is not null and @new_bldg_permit_source is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_source' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 541, convert(varchar(255), @old_bldg_permit_source), convert(varchar(255), @new_bldg_permit_source) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_pct_complete_override <> @new_bldg_permit_pct_complete_override
          or
          ( @old_bldg_permit_pct_complete_override is null and @new_bldg_permit_pct_complete_override is not null ) 
          or
          ( @old_bldg_permit_pct_complete_override is not null and @new_bldg_permit_pct_complete_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_pct_complete_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 540, convert(varchar(255), @old_bldg_permit_pct_complete_override), convert(varchar(255), @new_bldg_permit_pct_complete_override) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_bldg_inspect_req <> @new_bldg_permit_bldg_inspect_req
          or
          ( @old_bldg_permit_bldg_inspect_req is null and @new_bldg_permit_bldg_inspect_req is not null ) 
          or
          ( @old_bldg_permit_bldg_inspect_req is not null and @new_bldg_permit_bldg_inspect_req is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_bldg_inspect_req' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8489, convert(varchar(255), @old_bldg_permit_bldg_inspect_req), convert(varchar(255), @new_bldg_permit_bldg_inspect_req) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_elec_inspect_req <> @new_bldg_permit_elec_inspect_req
          or
          ( @old_bldg_permit_elec_inspect_req is null and @new_bldg_permit_elec_inspect_req is not null ) 
          or
          ( @old_bldg_permit_elec_inspect_req is not null and @new_bldg_permit_elec_inspect_req is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_elec_inspect_req' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8495, convert(varchar(255), @old_bldg_permit_elec_inspect_req), convert(varchar(255), @new_bldg_permit_elec_inspect_req) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_mech_inspect_req <> @new_bldg_permit_mech_inspect_req
          or
          ( @old_bldg_permit_mech_inspect_req is null and @new_bldg_permit_mech_inspect_req is not null ) 
          or
          ( @old_bldg_permit_mech_inspect_req is not null and @new_bldg_permit_mech_inspect_req is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_mech_inspect_req' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8497, convert(varchar(255), @old_bldg_permit_mech_inspect_req), convert(varchar(255), @new_bldg_permit_mech_inspect_req) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_plumb_inspect_req <> @new_bldg_permit_plumb_inspect_req
          or
          ( @old_bldg_permit_plumb_inspect_req is null and @new_bldg_permit_plumb_inspect_req is not null ) 
          or
          ( @old_bldg_permit_plumb_inspect_req is not null and @new_bldg_permit_plumb_inspect_req is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_plumb_inspect_req' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8504, convert(varchar(255), @old_bldg_permit_plumb_inspect_req), convert(varchar(255), @new_bldg_permit_plumb_inspect_req) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_old_permit_no <> @new_bldg_permit_old_permit_no
          or
          ( @old_bldg_permit_old_permit_no is null and @new_bldg_permit_old_permit_no is not null ) 
          or
          ( @old_bldg_permit_old_permit_no is not null and @new_bldg_permit_old_permit_no is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_old_permit_no' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8500, convert(varchar(255), @old_bldg_permit_old_permit_no), convert(varchar(255), @new_bldg_permit_old_permit_no) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_property_roll <> @new_bldg_permit_property_roll
          or
          ( @old_bldg_permit_property_roll is null and @new_bldg_permit_property_roll is not null ) 
          or
          ( @old_bldg_permit_property_roll is not null and @new_bldg_permit_property_roll is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_property_roll' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8505, convert(varchar(255), @old_bldg_permit_property_roll), convert(varchar(255), @new_bldg_permit_property_roll) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_place_id <> @new_bldg_permit_place_id
          or
          ( @old_bldg_permit_place_id is null and @new_bldg_permit_place_id is not null ) 
          or
          ( @old_bldg_permit_place_id is not null and @new_bldg_permit_place_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_place_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8502, convert(varchar(255), @old_bldg_permit_place_id), convert(varchar(255), @new_bldg_permit_place_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     if (
          @old_bldg_permit_import_dt <> @new_bldg_permit_import_dt
          or
          ( @old_bldg_permit_import_dt is null and @new_bldg_permit_import_dt is not null ) 
          or
          ( @old_bldg_permit_import_dt is not null and @new_bldg_permit_import_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit' and
                    chg_log_columns = 'bldg_permit_import_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 141, 8823, convert(varchar(255), @old_bldg_permit_import_dt), convert(varchar(255), @new_bldg_permit_import_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @new_bldg_permit_id), @new_bldg_permit_id)
          end
     end
 
     fetch next from curRows into @old_bldg_permit_id, @old_bldg_permit_status, @old_bldg_permit_cad_status, @old_bldg_permit_type_cd, @old_bldg_permit_sub_type_cd, @old_bldg_permit_num, @old_bldg_permit_issuer, @old_bldg_permit_issue_dt, @old_bldg_permit_limit_dt, @old_bldg_permit_dt_complete, @old_bldg_permit_val, @old_bldg_permit_area, @old_bldg_permit_dim_1, @old_bldg_permit_dim_2, @old_bldg_permit_dim_3, @old_bldg_permit_num_floors, @old_bldg_permit_num_units, @old_bldg_permit_appraiser_id, @old_bldg_permit_dt_worked, @old_bldg_permit_pct_complete, @old_bldg_permit_builder, @old_bldg_permit_builder_phone, @old_bldg_permit_active, @old_bldg_permit_last_chg, @old_bldg_permit_cmnt, @old_bldg_permit_issued_to, @old_bldg_permit_owner_phone, @old_bldg_permit_res_com, @old_bldg_permit_street_num, @old_bldg_permit_street_prefix, @old_bldg_permit_street_name, @old_bldg_permit_street_suffix, @old_bldg_permit_unit_type, @old_bldg_permit_unit_number, @old_bldg_permit_sub_division, @old_bldg_permit_plat, @old_bldg_permit_block, @old_bldg_permit_lot, @old_bldg_permit_city, @old_bldg_permit_land_use, @old_bldg_permit_source, @old_bldg_permit_pct_complete_override, @old_bldg_permit_bldg_inspect_req, @old_bldg_permit_elec_inspect_req, @old_bldg_permit_mech_inspect_req, @old_bldg_permit_plumb_inspect_req, @old_bldg_permit_old_permit_no, @old_bldg_permit_property_roll, @old_bldg_permit_place_id, @old_bldg_permit_import_dt, @new_bldg_permit_id, @new_bldg_permit_status, @new_bldg_permit_cad_status, @new_bldg_permit_type_cd, @new_bldg_permit_sub_type_cd, @new_bldg_permit_num, @new_bldg_permit_issuer, @new_bldg_permit_issue_dt, @new_bldg_permit_limit_dt, @new_bldg_permit_dt_complete, @new_bldg_permit_val, @new_bldg_permit_area, @new_bldg_permit_dim_1, @new_bldg_permit_dim_2, @new_bldg_permit_dim_3, @new_bldg_permit_num_floors, @new_bldg_permit_num_units, @new_bldg_permit_appraiser_id, @new_bldg_permit_dt_worked, @new_bldg_permit_pct_complete, @new_bldg_permit_builder, @new_bldg_permit_builder_phone, @new_bldg_permit_active, @new_bldg_permit_last_chg, @new_bldg_permit_cmnt, @new_bldg_permit_issued_to, @new_bldg_permit_owner_phone, @new_bldg_permit_res_com, @new_bldg_permit_street_num, @new_bldg_permit_street_prefix, @new_bldg_permit_street_name, @new_bldg_permit_street_suffix, @new_bldg_permit_unit_type, @new_bldg_permit_unit_number, @new_bldg_permit_sub_division, @new_bldg_permit_plat, @new_bldg_permit_block, @new_bldg_permit_lot, @new_bldg_permit_city, @new_bldg_permit_land_use, @new_bldg_permit_source, @new_bldg_permit_pct_complete_override, @new_bldg_permit_bldg_inspect_req, @new_bldg_permit_elec_inspect_req, @new_bldg_permit_mech_inspect_req, @new_bldg_permit_plumb_inspect_req, @new_bldg_permit_old_permit_no, @new_bldg_permit_property_roll, @new_bldg_permit_place_id, @new_bldg_permit_import_dt
end
 
close curRows
deallocate curRows

GO

create trigger tr_building_permit_delete_ChangeLog
on dbo.building_permit
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
          chg_log_tables = 'building_permit' and
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
 
declare @bldg_permit_id int
 
declare curRows cursor
for
     select bldg_permit_id from deleted
for read only
 
open curRows
fetch next from curRows into @bldg_permit_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Permit: ' + convert(varchar(12), @bldg_permit_id)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 141, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
 
     fetch next from curRows into @bldg_permit_id
end
 
close curRows
deallocate curRows

GO

create trigger tr_building_permit_insert_ChangeLog
on dbo.building_permit
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
 
declare @bldg_permit_id int
declare @bldg_permit_status varchar(5)
declare @bldg_permit_cad_status varchar(5)
declare @bldg_permit_type_cd varchar(10)
declare @bldg_permit_sub_type_cd varchar(5)
declare @bldg_permit_num varchar(30)
declare @bldg_permit_issuer varchar(30)
declare @bldg_permit_issue_dt datetime
declare @bldg_permit_limit_dt datetime
declare @bldg_permit_dt_complete datetime
declare @bldg_permit_val numeric(18,0)
declare @bldg_permit_area numeric(18,0)
declare @bldg_permit_dim_1 varchar(10)
declare @bldg_permit_dim_2 varchar(10)
declare @bldg_permit_dim_3 varchar(10)
declare @bldg_permit_num_floors numeric(18,0)
declare @bldg_permit_num_units numeric(18,0)
declare @bldg_permit_appraiser_id int
declare @bldg_permit_dt_worked datetime
declare @bldg_permit_pct_complete numeric(18,0)
declare @bldg_permit_builder varchar(30)
declare @bldg_permit_builder_phone varchar(16)
declare @bldg_permit_active char(1)
declare @bldg_permit_last_chg datetime
declare @bldg_permit_cmnt varchar(512)
declare @bldg_permit_issued_to varchar(50)
declare @bldg_permit_owner_phone varchar(16)
declare @bldg_permit_res_com char(1)
declare @bldg_permit_street_num varchar(10)
declare @bldg_permit_street_prefix varchar(10)
declare @bldg_permit_street_name varchar(50)
declare @bldg_permit_street_suffix varchar(10)
declare @bldg_permit_unit_type varchar(5)
declare @bldg_permit_unit_number varchar(15)
declare @bldg_permit_sub_division varchar(30)
declare @bldg_permit_plat varchar(4)
declare @bldg_permit_block varchar(3)
declare @bldg_permit_lot varchar(30)
declare @bldg_permit_city varchar(30)
declare @bldg_permit_land_use varchar(30)
declare @bldg_permit_source varchar(50)
declare @bldg_permit_pct_complete_override bit
declare @bldg_permit_bldg_inspect_req char(1)
declare @bldg_permit_elec_inspect_req char(1)
declare @bldg_permit_mech_inspect_req char(1)
declare @bldg_permit_plumb_inspect_req char(1)
declare @bldg_permit_old_permit_no varchar(20)
declare @bldg_permit_property_roll varchar(50)
declare @bldg_permit_place_id numeric(18,0)
declare @bldg_permit_import_dt datetime
 
declare curRows cursor
for
     select bldg_permit_id, bldg_permit_status, bldg_permit_cad_status, bldg_permit_type_cd, bldg_permit_sub_type_cd, bldg_permit_num, bldg_permit_issuer, bldg_permit_issue_dt, bldg_permit_limit_dt, bldg_permit_dt_complete, bldg_permit_val, bldg_permit_area, bldg_permit_dim_1, bldg_permit_dim_2, bldg_permit_dim_3, bldg_permit_num_floors, bldg_permit_num_units, bldg_permit_appraiser_id, bldg_permit_dt_worked, bldg_permit_pct_complete, bldg_permit_builder, bldg_permit_builder_phone, bldg_permit_active, bldg_permit_last_chg, bldg_permit_cmnt, bldg_permit_issued_to, bldg_permit_owner_phone, bldg_permit_res_com, bldg_permit_street_num, bldg_permit_street_prefix, bldg_permit_street_name, bldg_permit_street_suffix, bldg_permit_unit_type, bldg_permit_unit_number, bldg_permit_sub_division, bldg_permit_plat, bldg_permit_block, bldg_permit_lot, bldg_permit_city, bldg_permit_land_use, bldg_permit_source, bldg_permit_pct_complete_override, bldg_permit_bldg_inspect_req, bldg_permit_elec_inspect_req, bldg_permit_mech_inspect_req, bldg_permit_plumb_inspect_req, bldg_permit_old_permit_no, bldg_permit_property_roll, bldg_permit_place_id, bldg_permit_import_dt from inserted
for read only
 
open curRows
fetch next from curRows into @bldg_permit_id, @bldg_permit_status, @bldg_permit_cad_status, @bldg_permit_type_cd, @bldg_permit_sub_type_cd, @bldg_permit_num, @bldg_permit_issuer, @bldg_permit_issue_dt, @bldg_permit_limit_dt, @bldg_permit_dt_complete, @bldg_permit_val, @bldg_permit_area, @bldg_permit_dim_1, @bldg_permit_dim_2, @bldg_permit_dim_3, @bldg_permit_num_floors, @bldg_permit_num_units, @bldg_permit_appraiser_id, @bldg_permit_dt_worked, @bldg_permit_pct_complete, @bldg_permit_builder, @bldg_permit_builder_phone, @bldg_permit_active, @bldg_permit_last_chg, @bldg_permit_cmnt, @bldg_permit_issued_to, @bldg_permit_owner_phone, @bldg_permit_res_com, @bldg_permit_street_num, @bldg_permit_street_prefix, @bldg_permit_street_name, @bldg_permit_street_suffix, @bldg_permit_unit_type, @bldg_permit_unit_number, @bldg_permit_sub_division, @bldg_permit_plat, @bldg_permit_block, @bldg_permit_lot, @bldg_permit_city, @bldg_permit_land_use, @bldg_permit_source, @bldg_permit_pct_complete_override, @bldg_permit_bldg_inspect_req, @bldg_permit_elec_inspect_req, @bldg_permit_mech_inspect_req, @bldg_permit_plumb_inspect_req, @bldg_permit_old_permit_no, @bldg_permit_property_roll, @bldg_permit_place_id, @bldg_permit_import_dt
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Permit: ' + convert(varchar(12), @bldg_permit_id)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 531, null, convert(varchar(255), @bldg_permit_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8507, null, convert(varchar(255), @bldg_permit_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_cad_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8822, null, convert(varchar(255), @bldg_permit_cad_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 546, null, convert(varchar(255), @bldg_permit_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_sub_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8509, null, convert(varchar(255), @bldg_permit_sub_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 538, null, convert(varchar(255), @bldg_permit_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_issuer' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 534, null, convert(varchar(255), @bldg_permit_issuer), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_issue_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 532, null, convert(varchar(255), @bldg_permit_issue_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_limit_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 537, null, convert(varchar(255), @bldg_permit_limit_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_dt_complete' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 529, null, convert(varchar(255), @bldg_permit_dt_complete), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 547, null, convert(varchar(255), @bldg_permit_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 525, null, convert(varchar(255), @bldg_permit_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_dim_1' and
               chg_log_audit = 1
    )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8492, null, convert(varchar(255), @bldg_permit_dim_1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_dim_2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8493, null, convert(varchar(255), @bldg_permit_dim_2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_dim_3' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8494, null, convert(varchar(255), @bldg_permit_dim_3), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_num_floors' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8498, null, convert(varchar(255), @bldg_permit_num_floors), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_num_units' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8499, null, convert(varchar(255), @bldg_permit_num_units), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
 select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_appraiser_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 524, null, convert(varchar(255), @bldg_permit_appraiser_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_dt_worked' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 530, null, convert(varchar(255), @bldg_permit_dt_worked), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_pct_complete' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 539, null, convert(varchar(255), @bldg_permit_pct_complete), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_builder' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 526, null, convert(varchar(255), @bldg_permit_builder), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_builder_phone' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8491, null, convert(varchar(255), @bldg_permit_builder_phone), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_active' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 523, null, convert(varchar(255), @bldg_permit_active), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_last_chg' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 536, null, convert(varchar(255), @bldg_permit_last_chg), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_cmnt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 528, null, convert(varchar(255), @bldg_permit_cmnt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_issued_to' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 533, null, convert(varchar(255), @bldg_permit_issued_to), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_owner_phone' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8501, null, convert(varchar(255), @bldg_permit_owner_phone), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_res_com' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8824, null, convert(varchar(255), @bldg_permit_res_com), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_street_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 543, null, convert(varchar(255), @bldg_permit_street_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_street_prefix' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 544, null, convert(varchar(255), @bldg_permit_street_prefix), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_street_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 542, null, convert(varchar(255), @bldg_permit_street_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_street_suffix' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 545, null, convert(varchar(255), @bldg_permit_street_suffix), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_unit_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8511, null, convert(varchar(255), @bldg_permit_unit_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_unit_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8510, null, convert(varchar(255), @bldg_permit_unit_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_sub_division' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8508, null, convert(varchar(255), @bldg_permit_sub_division), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_plat' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8503, null, convert(varchar(255), @bldg_permit_plat), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_block' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8490, null, convert(varchar(255), @bldg_permit_block), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_lot' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8496, null, convert(varchar(255), @bldg_permit_lot), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_city' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 527, null, convert(varchar(255), @bldg_permit_city), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_land_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 535, null, convert(varchar(255), @bldg_permit_land_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_source' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 541, null, convert(varchar(255), @bldg_permit_source), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_pct_complete_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 540, null, convert(varchar(255), @bldg_permit_pct_complete_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_bldg_inspect_req' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8489, null, convert(varchar(255), @bldg_permit_bldg_inspect_req), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_elec_inspect_req' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8495, null, convert(varchar(255), @bldg_permit_elec_inspect_req), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_mech_inspect_req' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8497, null, convert(varchar(255), @bldg_permit_mech_inspect_req), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_plumb_inspect_req' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8504, null, convert(varchar(255), @bldg_permit_plumb_inspect_req), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_old_permit_no' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8500, null, convert(varchar(255), @bldg_permit_old_permit_no), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_property_roll' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8505, null, convert(varchar(255), @bldg_permit_property_roll), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_place_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8502, null, convert(varchar(255), @bldg_permit_place_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit' and
               chg_log_columns = 'bldg_permit_import_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 141, 8823, null, convert(varchar(255), @bldg_permit_import_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     end
 
     fetch next from curRows into @bldg_permit_id, @bldg_permit_status, @bldg_permit_cad_status, @bldg_permit_type_cd, @bldg_permit_sub_type_cd, @bldg_permit_num, @bldg_permit_issuer, @bldg_permit_issue_dt, @bldg_permit_limit_dt, @bldg_permit_dt_complete, @bldg_permit_val, @bldg_permit_area, @bldg_permit_dim_1, @bldg_permit_dim_2, @bldg_permit_dim_3, @bldg_permit_num_floors, @bldg_permit_num_units, @bldg_permit_appraiser_id, @bldg_permit_dt_worked, @bldg_permit_pct_complete, @bldg_permit_builder, @bldg_permit_builder_phone, @bldg_permit_active, @bldg_permit_last_chg, @bldg_permit_cmnt, @bldg_permit_issued_to, @bldg_permit_owner_phone, @bldg_permit_res_com, @bldg_permit_street_num, @bldg_permit_street_prefix, @bldg_permit_street_name, @bldg_permit_street_suffix, @bldg_permit_unit_type, @bldg_permit_unit_number, @bldg_permit_sub_division, @bldg_permit_plat, @bldg_permit_block, @bldg_permit_lot, @bldg_permit_city, @bldg_permit_land_use, @bldg_permit_source, @bldg_permit_pct_complete_override, @bldg_permit_bldg_inspect_req, @bldg_permit_elec_inspect_req, @bldg_permit_mech_inspect_req, @bldg_permit_plumb_inspect_req, @bldg_permit_old_permit_no, @bldg_permit_property_roll, @bldg_permit_place_id, @bldg_permit_import_dt
end
 
close curRows
deallocate curRows

GO

CREATE TRIGGER tr_building_permit_UpdateLastChange ON dbo.building_permit 
FOR INSERT, UPDATE

as

update building_permit
set bldg_permit_last_chg = GetDate() 
from inserted
where building_permit.bldg_permit_id=inserted.bldg_permit_id

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'the calculated value of the permit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_calc_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'permit number issued from the outside agency', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'appraiser assigned to the permit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_appraiser_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'outside agency who issued the permit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_issuer';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date the permit was worked by an appraiser', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_dt_worked';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'where a user can override the % complete from the permit worksheet', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_pct_complete_override';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'permit worksheet type associated with a permit to assist the CAD with determining % complete', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_worksheet_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS permit status to determine the permit status from the CAD - open, closed, in progress, etc', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_cad_status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'value assigned to the permit via the outside agency or from a PACS user', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_val';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date permit was imported from the outside agency file', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_import_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'type of permit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'square footage of the permit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_area';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date the permit is completed within PACS', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_dt_complete';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date of the last change on the permit record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_last_chg';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'status of the import', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_import_status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'unique identifier for building permit record', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'indicates if the permit was imported or manually added to PACS', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_source';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'PACS permit status to determine the permit status from the outside agency - open, closed, in progress, etc', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Bit flag to indicate if record is active', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'active_bit';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date permit was issued from the outside agency', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_issue_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'pct complete as determined by the appraiser', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_pct_complete';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'property ID imported from the outside agency (if available)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_import_prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'date the permit expires from the outside agency', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_limit_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'flag to indicate if the permit is active or inactive (closed)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_active';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Holds information pertaining to building permits', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = '% complete as determined by the CAD via the worksheet calculations', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit', @level2type = N'COLUMN', @level2name = N'bldg_permit_county_percent_complete';


GO

