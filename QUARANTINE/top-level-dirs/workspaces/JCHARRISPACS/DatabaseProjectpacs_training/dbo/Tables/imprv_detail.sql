CREATE TABLE [dbo].[imprv_detail] (
    [prop_id]                               INT             NOT NULL,
    [prop_val_yr]                           NUMERIC (4)     NOT NULL,
    [imprv_id]                              INT             NOT NULL,
    [imprv_det_id]                          INT             NOT NULL,
    [sup_num]                               INT             NOT NULL,
    [sale_id]                               INT             NOT NULL,
    [imprv_det_class_cd]                    CHAR (10)       NOT NULL,
    [imprv_det_meth_cd]                     CHAR (5)        NOT NULL,
    [imprv_det_type_cd]                     CHAR (10)       NOT NULL,
    [seq_num]                               INT             NULL,
    [imprv_det_val]                         NUMERIC (18)    NULL,
    [imprv_det_val_source]                  CHAR (1)        NULL,
    [imprv_det_desc]                        VARCHAR (100)   NULL,
    [imprv_det_area]                        NUMERIC (18, 1) NULL,
    [imprv_det_area_type]                   CHAR (1)        NULL,
    [condition_cd]                          CHAR (5)        NULL,
    [cubic_area]                            NUMERIC (18, 1) NULL,
    [calc_area]                             NUMERIC (18, 1) NULL,
    [sketch_area]                           NUMERIC (18, 1) NULL,
    [override_area]                         CHAR (1)        NULL,
    [override_cubic_area]                   CHAR (1)        NULL,
    [override_perimeter]                    CHAR (1)        NULL,
    [perimeter]                             NUMERIC (18, 1) NULL,
    [length]                                NUMERIC (18, 1) NULL,
    [width]                                 NUMERIC (18, 1) NULL,
    [height]                                NUMERIC (18, 1) NULL,
    [unit_price]                            NUMERIC (14, 2) NULL,
    [yr_new]                                NUMERIC (4)     NULL,
    [yr_built]                              NUMERIC (4)     NULL,
    [depreciation_yr]                       NUMERIC (4)     NULL,
    [depreciation_yr_override]              CHAR (1)        NULL,
    [imprv_det_orig_val]                    NUMERIC (14)    NULL,
    [imprv_det_orig_up]                     NUMERIC (14, 2) NULL,
    [effective_tax_yr]                      NUMERIC (4)     NULL,
    [imprv_det_adj_factor]                  NUMERIC (8, 6)  NULL,
    [imprv_det_adj_amt]                     NUMERIC (14)    NULL,
    [imprv_det_calc_val]                    NUMERIC (14)    NULL,
    [imprv_det_adj_val]                     NUMERIC (14)    NULL,
    [imprv_det_flat_val]                    NUMERIC (14)    NULL,
    [economic_pct]                          NUMERIC (5, 2)  NULL,
    [physical_pct]                          NUMERIC (5, 2)  NULL,
    [physical_pct_source]                   CHAR (1)        NULL,
    [functional_pct]                        NUMERIC (5, 2)  NULL,
    [economic_pct_override]                 CHAR (1)        NULL,
    [physical_pct_override]                 CHAR (1)        NULL,
    [functional_pct_override]               CHAR (1)        NULL,
    [economic_cmnt]                         VARCHAR (255)   NULL,
    [physical_cmnt]                         VARCHAR (255)   NULL,
    [functional_cmnt]                       VARCHAR (255)   NULL,
    [percent_complete]                      NUMERIC (5, 2)  NULL,
    [percent_complete_override]             CHAR (1)        NULL,
    [percent_complete_cmnt]                 VARCHAR (255)   NULL,
    [new_value_flag]                        CHAR (1)        NULL,
    [new_value]                             NUMERIC (14)    NULL,
    [new_value_override]                    CHAR (1)        NULL,
    [sketch_cmds]                           VARCHAR (1800)  NULL,
    [use_up_for_pct_base]                   CHAR (1)        NULL,
    [ref_id1]                               VARCHAR (50)    NULL,
    [reserved1]                             NUMERIC (14)    NULL,
    [can_close_sketch]                      CHAR (1)        NULL,
    [dep_pct]                               NUMERIC (5, 2)  NULL,
    [add_factor]                            NUMERIC (5, 2)  NULL,
    [add_factor_override]                   CHAR (1)        NULL,
    [size_adj_pct]                          NUMERIC (5, 2)  NULL,
    [dep_pct_override]                      CHAR (1)        NULL,
    [size_adj_pct_override]                 CHAR (1)        NULL,
    [imprv_det_sub_class_cd]                VARCHAR (10)    NULL,
    [num_units]                             INT             NULL,
    [num_stories]                           INT             NULL,
    [stories_multiplier]                    BIT             NULL,
    [tsRowVersion]                          ROWVERSION      NOT NULL,
    [lease_class]                           VARCHAR (10)    NULL,
    [actual_year_built_override]            BIT             DEFAULT ((0)) NOT NULL,
    [flat_value_comment]                    VARCHAR (3000)  NULL,
    [flat_value_user_id]                    INT             NULL,
    [flat_value_date]                       DATETIME        NULL,
    [depreciated_replacement_cost_new]      NUMERIC (14)    NULL,
    [floor_number]                          NUMERIC (4)     NULL,
    [load_factor]                           NUMERIC (3)     NULL,
    [actual_age]                            NUMERIC (4)     NULL,
    [net_rentable_area]                     NUMERIC (18)    NULL,
    [building_id]                           INT             NULL,
    [permanent_crop_acres]                  NUMERIC (14, 4) NULL,
    [permanent_crop_irrigation_acres]       NUMERIC (14, 4) NULL,
    [permanent_crop_age_group]              VARCHAR (15)    NULL,
    [permanent_crop_trellis]                VARCHAR (15)    NULL,
    [permanent_crop_irrigation_system_type] VARCHAR (15)    NULL,
    [permanent_crop_irrigation_sub_class]   VARCHAR (15)    NULL,
    [permanent_crop_density]                VARCHAR (15)    NULL,
    [imprv_det_cost_unit_price]             NUMERIC (14, 2) NULL,
    [imprv_det_ms_val]                      NUMERIC (14)    NULL,
    [imprv_det_ms_unit_price]               NUMERIC (14, 2) NULL,
    [recalc_error_validate_flag]            BIT             CONSTRAINT [CDF_imprv_detail_recalc_error_validate_flag] DEFAULT ((0)) NULL,
    [recalc_error_validate_date]            DATETIME        NULL,
    [recalc_error_validate_user_id]         INT             NULL,
    [ms_building_json]                      NVARCHAR (MAX)  NULL,
    CONSTRAINT [CPK_imprv_detail] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [imprv_id] ASC, [imprv_det_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_imprv_detail_condition_cd] FOREIGN KEY ([condition_cd]) REFERENCES [dbo].[condition] ([condition_cd]),
    CONSTRAINT [CFK_imprv_detail_imprv_det_class_cd] FOREIGN KEY ([imprv_det_class_cd]) REFERENCES [dbo].[imprv_det_class] ([imprv_det_class_cd]),
    CONSTRAINT [CFK_imprv_detail_imprv_det_meth_cd] FOREIGN KEY ([imprv_det_meth_cd]) REFERENCES [dbo].[imprv_det_meth] ([imprv_det_meth_cd]),
    CONSTRAINT [CFK_imprv_detail_imprv_det_sub_class_cd] FOREIGN KEY ([imprv_det_sub_class_cd]) REFERENCES [dbo].[imprv_det_sub_class] ([imprv_det_sub_cls_cd]),
    CONSTRAINT [CFK_imprv_detail_imprv_det_type_cd] FOREIGN KEY ([imprv_det_type_cd]) REFERENCES [dbo].[imprv_det_type] ([imprv_det_type_cd]),
    CONSTRAINT [CFK_imprv_detail_lease_class] FOREIGN KEY ([lease_class]) REFERENCES [dbo].[lease_class_code] ([class_cd]),
    CONSTRAINT [CFK_imprv_detail_permanent_crop_age_group] FOREIGN KEY ([permanent_crop_age_group]) REFERENCES [dbo].[permanent_crop_age_group] ([age_group_cd]),
    CONSTRAINT [CFK_imprv_detail_permanent_crop_density] FOREIGN KEY ([permanent_crop_density]) REFERENCES [dbo].[permanent_crop_density] ([density_cd]),
    CONSTRAINT [CFK_imprv_detail_permanent_crop_irrigation_sub_class] FOREIGN KEY ([permanent_crop_irrigation_sub_class]) REFERENCES [dbo].[permanent_crop_irrigation_sub_class_type] ([sub_class_type_cd]),
    CONSTRAINT [CFK_imprv_detail_permanent_crop_irrigation_system_type] FOREIGN KEY ([permanent_crop_irrigation_system_type]) REFERENCES [dbo].[permanent_crop_irrigation_system_type] ([irrigation_type_cd]),
    CONSTRAINT [CFK_imprv_detail_permanent_crop_trellis] FOREIGN KEY ([permanent_crop_trellis]) REFERENCES [dbo].[permanent_crop_trellis_type] ([trellis_cd]),
    CONSTRAINT [CFK_imprv_detail_prop_val_yr_sup_num_sale_id_prop_id_imprv_id] FOREIGN KEY ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id]) REFERENCES [dbo].[imprv] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_class_cd]
    ON [dbo].[imprv_detail]([imprv_det_class_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id1]
    ON [dbo].[imprv_detail]([ref_id1] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_meth_cd]
    ON [dbo].[imprv_detail]([imprv_det_meth_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[imprv_detail]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_sale_id]
    ON [dbo].[imprv_detail]([sale_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_imprv_det_type_cd]
    ON [dbo].[imprv_detail]([imprv_det_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_condition_cd]
    ON [dbo].[imprv_detail]([condition_cd] ASC) WITH (FILLFACTOR = 90);


GO

 
create trigger tr_imprv_detail_update_ChangeLog
on imprv_detail
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
 
declare @old_prop_id int
declare @new_prop_id int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_imprv_id int
declare @new_imprv_id int
declare @old_imprv_det_id int
declare @new_imprv_det_id int
declare @old_sup_num int
declare @new_sup_num int
declare @old_sale_id int
declare @new_sale_id int
declare @old_imprv_det_class_cd char(10)
declare @new_imprv_det_class_cd char(10)
declare @old_imprv_det_meth_cd char(5)
declare @new_imprv_det_meth_cd char(5)
declare @old_imprv_det_type_cd char(10)
declare @new_imprv_det_type_cd char(10)
declare @old_seq_num int
declare @new_seq_num int
declare @old_imprv_det_val numeric(18,0)
declare @new_imprv_det_val numeric(18,0)
declare @old_imprv_det_val_source char(1)
declare @new_imprv_det_val_source char(1)
declare @old_imprv_det_desc varchar(30)
declare @new_imprv_det_desc varchar(30)
declare @old_imprv_det_area numeric(18,1)
declare @new_imprv_det_area numeric(18,1)
declare @old_imprv_det_area_type char(1)
declare @new_imprv_det_area_type char(1)
declare @old_condition_cd char(5)
declare @new_condition_cd char(5)
declare @old_cubic_area numeric(18,1)
declare @new_cubic_area numeric(18,1)
declare @old_calc_area numeric(18,1)
declare @new_calc_area numeric(18,1)
declare @old_sketch_area numeric(18,1)
declare @new_sketch_area numeric(18,1)
declare @old_override_area char(1)
declare @new_override_area char(1)
declare @old_override_cubic_area char(1)
declare @new_override_cubic_area char(1)
declare @old_override_perimeter char(1)
declare @new_override_perimeter char(1)
declare @old_perimeter numeric(18,1)
declare @new_perimeter numeric(18,1)
declare @old_length numeric(18,1)
declare @new_length numeric(18,1)
declare @old_width numeric(18,1)
declare @new_width numeric(18,1)
declare @old_height numeric(18,1)
declare @new_height numeric(18,1)
declare @old_unit_price numeric(14,2)
declare @new_unit_price numeric(14,2)
declare @old_yr_new numeric(4,0)
declare @new_yr_new numeric(4,0)
declare @old_yr_built numeric(4,0)
declare @new_yr_built numeric(4,0)
declare @old_depreciation_yr numeric(4,0)
declare @new_depreciation_yr numeric(4,0)
declare @old_depreciation_yr_override char(1)
declare @new_depreciation_yr_override char(1)
declare @old_imprv_det_orig_val numeric(14,0)
declare @new_imprv_det_orig_val numeric(14,0)
declare @old_imprv_det_orig_up numeric(14,2)
declare @new_imprv_det_orig_up numeric(14,2)
declare @old_effective_tax_yr numeric(4,0)
declare @new_effective_tax_yr numeric(4,0)
declare @old_imprv_det_adj_factor numeric(8,6)
declare @new_imprv_det_adj_factor numeric(8,6)
declare @old_imprv_det_adj_amt numeric(14,0)
declare @new_imprv_det_adj_amt numeric(14,0)
declare @old_imprv_det_calc_val numeric(14,0)
declare @new_imprv_det_calc_val numeric(14,0)
declare @old_imprv_det_adj_val numeric(14,0)
declare @new_imprv_det_adj_val numeric(14,0)
declare @old_imprv_det_flat_val numeric(14,0)
declare @new_imprv_det_flat_val numeric(14,0)
declare @old_economic_pct numeric(5,2)
declare @new_economic_pct numeric(5,2)
declare @old_physical_pct numeric(5,2)
declare @new_physical_pct numeric(5,2)
declare @old_physical_pct_source char(1)
declare @new_physical_pct_source char(1)
declare @old_functional_pct numeric(5,2)
declare @new_functional_pct numeric(5,2)
declare @old_economic_pct_override char(1)
declare @new_economic_pct_override char(1)
declare @old_physical_pct_override char(1)
declare @new_physical_pct_override char(1)
declare @old_functional_pct_override char(1)
declare @new_functional_pct_override char(1)
declare @old_economic_cmnt varchar(255)
declare @new_economic_cmnt varchar(255)
declare @old_physical_cmnt varchar(255)
declare @new_physical_cmnt varchar(255)
declare @old_functional_cmnt varchar(255)
declare @new_functional_cmnt varchar(255)
declare @old_percent_complete numeric(5,2)
declare @new_percent_complete numeric(5,2)
declare @old_percent_complete_override char(1)
declare @new_percent_complete_override char(1)
declare @old_percent_complete_cmnt varchar(255)
declare @new_percent_complete_cmnt varchar(255)
declare @old_new_value_flag char(1)
declare @new_new_value_flag char(1)
declare @old_new_value numeric(14,0)
declare @new_new_value numeric(14,0)
declare @old_new_value_override char(1)
declare @new_new_value_override char(1)
declare @old_sketch_cmds varchar(1800)
declare @new_sketch_cmds varchar(1800)
declare @old_use_up_for_pct_base char(1)
declare @new_use_up_for_pct_base char(1)
declare @old_ref_id1 varchar(50)
declare @new_ref_id1 varchar(50)
declare @old_reserved1 numeric(14,0)
declare @new_reserved1 numeric(14,0)
declare @old_can_close_sketch char(1)
declare @new_can_close_sketch char(1)
declare @old_dep_pct numeric(5,2)
declare @new_dep_pct numeric(5,2)
declare @old_add_factor numeric(5,2)
declare @new_add_factor numeric(5,2)
declare @old_add_factor_override char(1)
declare @new_add_factor_override char(1)
declare @old_size_adj_pct numeric(5,2)
declare @new_size_adj_pct numeric(5,2)
declare @old_dep_pct_override char(1)
declare @new_dep_pct_override char(1)
declare @old_size_adj_pct_override char(1)
declare @new_size_adj_pct_override char(1)
declare @old_imprv_det_sub_class_cd varchar(10)
declare @new_imprv_det_sub_class_cd varchar(10)
declare @old_num_units int
declare @new_num_units int
declare @old_num_stories int
declare @new_num_stories int
declare @old_stories_multiplier bit
declare @new_stories_multiplier bit
declare @old_lease_class varchar(10)
declare @new_lease_class varchar(10)
declare @old_actual_year_built_override bit
declare @new_actual_year_built_override bit
declare @old_flat_value_comment varchar(50)
declare @new_flat_value_comment varchar(50)
declare @old_flat_value_user_id int
declare @new_flat_value_user_id int
declare @old_flat_value_date datetime
declare @new_flat_value_date datetime
declare @old_depreciated_replacement_cost_new numeric(14,0)
declare @new_depreciated_replacement_cost_new numeric(14,0)
declare @old_floor_number numeric(4,0)
declare @new_floor_number numeric(4,0)
declare @old_load_factor numeric(3,0)
declare @new_load_factor numeric(3,0)
declare @old_actual_age numeric(4,0)
declare @new_actual_age numeric(4,0)
declare @old_net_rentable_area numeric(18,0)
declare @new_net_rentable_area numeric(18,0)
declare @old_building_id int
declare @new_building_id int
 
declare curRows cursor
for
     select d.prop_id, case d.prop_val_yr when 0 then @tvar_lFutureYear else d.prop_val_yr end, d.imprv_id, d.imprv_det_id, d.sup_num, d.sale_id, d.imprv_det_class_cd, d.imprv_det_meth_cd, d.imprv_det_type_cd, d.seq_num, d.imprv_det_val, d.imprv_det_val_source, d.imprv_det_desc, d.imprv_det_area, d.imprv_det_area_type, d.condition_cd, d.cubic_area, d.calc_area, d.sketch_area, d.override_area, d.override_cubic_area, d.override_perimeter, d.perimeter, d.length, d.width, d.height, d.unit_price, d.yr_new, d.yr_built, d.depreciation_yr, d.depreciation_yr_override, d.imprv_det_orig_val, d.imprv_det_orig_up, d.effective_tax_yr, d.imprv_det_adj_factor, d.imprv_det_adj_amt, d.imprv_det_calc_val, d.imprv_det_adj_val, d.imprv_det_flat_val, d.economic_pct, d.physical_pct, d.physical_pct_source, d.functional_pct, d.economic_pct_override, d.physical_pct_override, d.functional_pct_override, d.economic_cmnt, d.physical_cmnt, d.functional_cmnt, d.percent_complete, d.percent_complete_override, d.percent_complete_cmnt, d.new_value_flag, d.new_value, d.new_value_override, d.sketch_cmds, d.use_up_for_pct_base, d.ref_id1, d.reserved1, d.can_close_sketch, d.dep_pct, d.add_factor, d.add_factor_override, d.size_adj_pct, d.dep_pct_override, d.size_adj_pct_override, d.imprv_det_sub_class_cd, d.num_units, d.num_stories, d.stories_multiplier, d.lease_class, d.actual_year_built_override, d.flat_value_comment, d.flat_value_user_id, d.flat_value_date, d.depreciated_replacement_cost_new, d.floor_number, d.load_factor, d.actual_age, d.net_rentable_area, d.building_id, i.prop_id, case i.prop_val_yr when 0 then @tvar_lFutureYear else i.prop_val_yr end, i.imprv_id, i.imprv_det_id, i.sup_num, i.sale_id, i.imprv_det_class_cd, i.imprv_det_meth_cd, i.imprv_det_type_cd, i.seq_num, i.imprv_det_val, i.imprv_det_val_source, i.imprv_det_desc, i.imprv_det_area, i.imprv_det_area_type, i.condition_cd, i.cubic_area, i.calc_area, i.sketch_area, i.override_area, i.override_cubic_area, i.override_perimeter, i.perimeter, i.length, i.width, i.height, i.unit_price, i.yr_new, i.yr_built, i.depreciation_yr, i.depreciation_yr_override, i.imprv_det_orig_val, i.imprv_det_orig_up, i.effective_tax_yr, i.imprv_det_adj_factor, i.imprv_det_adj_amt, i.imprv_det_calc_val, i.imprv_det_adj_val, i.imprv_det_flat_val, i.economic_pct, i.physical_pct, i.physical_pct_source, i.functional_pct, i.economic_pct_override, i.physical_pct_override, i.functional_pct_override, i.economic_cmnt, i.physical_cmnt, i.functional_cmnt, i.percent_complete, i.percent_complete_override, i.percent_complete_cmnt, i.new_value_flag, i.new_value, i.new_value_override, i.sketch_cmds, i.use_up_for_pct_base, i.ref_id1, i.reserved1, i.can_close_sketch, i.dep_pct, i.add_factor, i.add_factor_override, i.size_adj_pct, i.dep_pct_override, i.size_adj_pct_override, i.imprv_det_sub_class_cd, i.num_units, i.num_stories, i.stories_multiplier, i.lease_class, i.actual_year_built_override, i.flat_value_comment, i.flat_value_user_id, i.flat_value_date, i.depreciated_replacement_cost_new, i.floor_number, i.load_factor, i.actual_age, i.net_rentable_area, i.building_id
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.prop_val_yr = i.prop_val_yr and
     d.imprv_id = i.imprv_id and
     d.imprv_det_id = i.imprv_det_id and
     d.sup_num = i.sup_num and
     d.sale_id = i.sale_id
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_imprv_id, @old_imprv_det_id, @old_sup_num, @old_sale_id, @old_imprv_det_class_cd, @old_imprv_det_meth_cd, @old_imprv_det_type_cd, @old_seq_num, @old_imprv_det_val, @old_imprv_det_val_source, @old_imprv_det_desc, @old_imprv_det_area, @old_imprv_det_area_type, @old_condition_cd, @old_cubic_area, @old_calc_area, @old_sketch_area, @old_override_area, @old_override_cubic_area, @old_override_perimeter, @old_perimeter, @old_length, @old_width, @old_height, @old_unit_price, @old_yr_new, @old_yr_built, @old_depreciation_yr, @old_depreciation_yr_override, @old_imprv_det_orig_val, @old_imprv_det_orig_up, @old_effective_tax_yr, @old_imprv_det_adj_factor, @old_imprv_det_adj_amt, @old_imprv_det_calc_val, @old_imprv_det_adj_val, @old_imprv_det_flat_val, @old_economic_pct, @old_physical_pct, @old_physical_pct_source, @old_functional_pct, @old_economic_pct_override, @old_physical_pct_override, @old_functional_pct_override, @old_economic_cmnt, @old_physical_cmnt, @old_functional_cmnt, @old_percent_complete, @old_percent_complete_override, @old_percent_complete_cmnt, @old_new_value_flag, @old_new_value, @old_new_value_override, @old_sketch_cmds, @old_use_up_for_pct_base, @old_ref_id1, @old_reserved1, @old_can_close_sketch, @old_dep_pct, @old_add_factor, @old_add_factor_override, @old_size_adj_pct, @old_dep_pct_override, @old_size_adj_pct_override, @old_imprv_det_sub_class_cd, @old_num_units, @old_num_stories, @old_stories_multiplier, @old_lease_class, @old_actual_year_built_override, @old_flat_value_comment, @old_flat_value_user_id, @old_flat_value_date, @old_depreciated_replacement_cost_new, @old_floor_number, @old_load_factor, @old_actual_age, @old_net_rentable_area, @old_building_id, @new_prop_id, @new_prop_val_yr, @new_imprv_id, @new_imprv_det_id, @new_sup_num, @new_sale_id, @new_imprv_det_class_cd, @new_imprv_det_meth_cd, @new_imprv_det_type_cd, @new_seq_num, @new_imprv_det_val, @new_imprv_det_val_source, @new_imprv_det_desc, @new_imprv_det_area, @new_imprv_det_area_type, @new_condition_cd, @new_cubic_area, @new_calc_area, @new_sketch_area, @new_override_area, @new_override_cubic_area, @new_override_perimeter, @new_perimeter, @new_length, @new_width, @new_height, @new_unit_price, @new_yr_new, @new_yr_built, @new_depreciation_yr, @new_depreciation_yr_override, @new_imprv_det_orig_val, @new_imprv_det_orig_up, @new_effective_tax_yr, @new_imprv_det_adj_factor, @new_imprv_det_adj_amt, @new_imprv_det_calc_val, @new_imprv_det_adj_val, @new_imprv_det_flat_val, @new_economic_pct, @new_physical_pct, @new_physical_pct_source, @new_functional_pct, @new_economic_pct_override, @new_physical_pct_override, @new_functional_pct_override, @new_economic_cmnt, @new_physical_cmnt, @new_functional_cmnt, @new_percent_complete, @new_percent_complete_override, @new_percent_complete_cmnt, @new_new_value_flag, @new_new_value, @new_new_value_override, @new_sketch_cmds, @new_use_up_for_pct_base, @new_ref_id1, @new_reserved1, @new_can_close_sketch, @new_dep_pct, @new_add_factor, @new_add_factor_override, @new_size_adj_pct, @new_dep_pct_override, @new_size_adj_pct_override, @new_imprv_det_sub_class_cd, @new_num_units, @new_num_stories, @new_stories_multiplier, @new_lease_class, @new_actual_year_built_override, @new_flat_value_comment, @new_flat_value_user_id, @new_flat_value_date, @new_depreciated_replacement_cost_new, @new_floor_number, @new_load_factor, @new_actual_age, @new_net_rentable_area, @new_building_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = id.imprv_det_class_cd + '-' + id.imprv_det_meth_cd + '-' + id.imprv_det_type_cd
     from imprv_detail as id with(nolock)
     where id.prop_id = @new_prop_id
     and id.prop_val_yr = @new_prop_val_yr
     and id.sup_num = @new_sup_num
     and id.imprv_id = @new_imprv_id
     and id.imprv_det_id = @new_imprv_det_id
     and id.sale_id = @new_sale_id
 
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2275, convert(varchar(255), @old_imprv_id), convert(varchar(255), @new_imprv_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_id <> @new_imprv_det_id
          or
          ( @old_imprv_det_id is null and @new_imprv_det_id is not null ) 
          or
          ( @old_imprv_det_id is not null and @new_imprv_det_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2256, convert(varchar(255), @old_imprv_det_id), convert(varchar(255), @new_imprv_det_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'sale_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4485, convert(varchar(255), @old_sale_id), convert(varchar(255), @new_sale_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2252, convert(varchar(255), @old_imprv_det_class_cd), convert(varchar(255), @new_imprv_det_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_meth_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2257, convert(varchar(255), @old_imprv_det_meth_cd), convert(varchar(255), @new_imprv_det_meth_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2263, convert(varchar(255), @old_imprv_det_type_cd), convert(varchar(255), @new_imprv_det_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'seq_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4700, convert(varchar(255), @old_seq_num), convert(varchar(255), @new_seq_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_val <> @new_imprv_det_val
          or
          ( @old_imprv_det_val is null and @new_imprv_det_val is not null ) 
          or
          ( @old_imprv_det_val is not null and @new_imprv_det_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2264, convert(varchar(255), @old_imprv_det_val), convert(varchar(255), @new_imprv_det_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_val_source <> @new_imprv_det_val_source
          or
          ( @old_imprv_det_val_source is null and @new_imprv_det_val_source is not null ) 
          or
          ( @old_imprv_det_val_source is not null and @new_imprv_det_val_source is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_val_source' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2265, convert(varchar(255), @old_imprv_det_val_source), convert(varchar(255), @new_imprv_det_val_source), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_desc <> @new_imprv_det_desc
          or
          ( @old_imprv_det_desc is null and @new_imprv_det_desc is not null ) 
          or
          ( @old_imprv_det_desc is not null and @new_imprv_det_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2254, convert(varchar(255), @old_imprv_det_desc), convert(varchar(255), @new_imprv_det_desc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_area <> @new_imprv_det_area
          or
          ( @old_imprv_det_area is null and @new_imprv_det_area is not null ) 
          or
          ( @old_imprv_det_area is not null and @new_imprv_det_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2249, convert(varchar(255), @old_imprv_det_area), convert(varchar(255), @new_imprv_det_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_area_type <> @new_imprv_det_area_type
          or
          ( @old_imprv_det_area_type is null and @new_imprv_det_area_type is not null ) 
          or
          ( @old_imprv_det_area_type is not null and @new_imprv_det_area_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_area_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2250, convert(varchar(255), @old_imprv_det_area_type), convert(varchar(255), @new_imprv_det_area_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_condition_cd <> @new_condition_cd
          or
          ( @old_condition_cd is null and @new_condition_cd is not null ) 
          or
          ( @old_condition_cd is not null and @new_condition_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'condition_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 844, convert(varchar(255), @old_condition_cd), convert(varchar(255), @new_condition_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_cubic_area <> @new_cubic_area
          or
          ( @old_cubic_area is null and @new_cubic_area is not null ) 
          or
          ( @old_cubic_area is not null and @new_cubic_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'cubic_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 931, convert(varchar(255), @old_cubic_area), convert(varchar(255), @new_cubic_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_calc_area <> @new_calc_area
          or
          ( @old_calc_area is null and @new_calc_area is not null ) 
          or
          ( @old_calc_area is not null and @new_calc_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'calc_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 603, convert(varchar(255), @old_calc_area), convert(varchar(255), @new_calc_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_sketch_area <> @new_sketch_area
          or
          ( @old_sketch_area is null and @new_sketch_area is not null ) 
          or
          ( @old_sketch_area is not null and @new_sketch_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'sketch_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4753, convert(varchar(255), @old_sketch_area), convert(varchar(255), @new_sketch_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_override_area <> @new_override_area
          or
          ( @old_override_area is null and @new_override_area is not null ) 
          or
          ( @old_override_area is not null and @new_override_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'override_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3457, convert(varchar(255), @old_override_area), convert(varchar(255), @new_override_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_override_cubic_area <> @new_override_cubic_area
          or
          ( @old_override_cubic_area is null and @new_override_cubic_area is not null ) 
          or
          ( @old_override_cubic_area is not null and @new_override_cubic_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'override_cubic_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3458, convert(varchar(255), @old_override_cubic_area), convert(varchar(255), @new_override_cubic_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_override_perimeter <> @new_override_perimeter
          or
          ( @old_override_perimeter is null and @new_override_perimeter is not null ) 
          or
          ( @old_override_perimeter is not null and @new_override_perimeter is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'override_perimeter' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3465, convert(varchar(255), @old_override_perimeter), convert(varchar(255), @new_override_perimeter), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_perimeter <> @new_perimeter
          or
          ( @old_perimeter is null and @new_perimeter is not null ) 
          or
          ( @old_perimeter is not null and @new_perimeter is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'perimeter' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3637, convert(varchar(255), @old_perimeter), convert(varchar(255), @new_perimeter), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_length <> @new_length
          or
          ( @old_length is null and @new_length is not null ) 
          or
          ( @old_length is not null and @new_length is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'length' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2784, convert(varchar(255), @old_length), convert(varchar(255), @new_length), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_width <> @new_width
          or
          ( @old_width is null and @new_width is not null ) 
          or
          ( @old_width is not null and @new_width is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'width' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 5537, convert(varchar(255), @old_width), convert(varchar(255), @new_width), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_height <> @new_height
          or
          ( @old_height is null and @new_height is not null ) 
          or
          ( @old_height is not null and @new_height is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'height' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2057, convert(varchar(255), @old_height), convert(varchar(255), @new_height), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_unit_price <> @new_unit_price
          or
          ( @old_unit_price is null and @new_unit_price is not null ) 
          or
          ( @old_unit_price is not null and @new_unit_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'unit_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 5416, convert(varchar(255), @old_unit_price), convert(varchar(255), @new_unit_price), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_yr_new <> @new_yr_new
          or
          ( @old_yr_new is null and @new_yr_new is not null ) 
          or
          ( @old_yr_new is not null and @new_yr_new is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'yr_new' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 5559, convert(varchar(255), @old_yr_new), convert(varchar(255), @new_yr_new), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_yr_built <> @new_yr_built
          or
          ( @old_yr_built is null and @new_yr_built is not null ) 
          or
          ( @old_yr_built is not null and @new_yr_built is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'yr_built' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 5558, convert(varchar(255), @old_yr_built), convert(varchar(255), @new_yr_built), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_depreciation_yr <> @new_depreciation_yr
          or
          ( @old_depreciation_yr is null and @new_depreciation_yr is not null ) 
          or
          ( @old_depreciation_yr is not null and @new_depreciation_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'depreciation_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1314, convert(varchar(255), @old_depreciation_yr), convert(varchar(255), @new_depreciation_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_depreciation_yr_override <> @new_depreciation_yr_override
          or
          ( @old_depreciation_yr_override is null and @new_depreciation_yr_override is not null ) 
          or
          ( @old_depreciation_yr_override is not null and @new_depreciation_yr_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'depreciation_yr_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1315, convert(varchar(255), @old_depreciation_yr_override), convert(varchar(255), @new_depreciation_yr_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_orig_val <> @new_imprv_det_orig_val
          or
          ( @old_imprv_det_orig_val is null and @new_imprv_det_orig_val is not null ) 
          or
          ( @old_imprv_det_orig_val is not null and @new_imprv_det_orig_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_orig_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2260, convert(varchar(255), @old_imprv_det_orig_val), convert(varchar(255), @new_imprv_det_orig_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_orig_up <> @new_imprv_det_orig_up
          or
          ( @old_imprv_det_orig_up is null and @new_imprv_det_orig_up is not null ) 
          or
          ( @old_imprv_det_orig_up is not null and @new_imprv_det_orig_up is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_orig_up' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2259, convert(varchar(255), @old_imprv_det_orig_up), convert(varchar(255), @new_imprv_det_orig_up), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_effective_tax_yr <> @new_effective_tax_yr
          or
          ( @old_effective_tax_yr is null and @new_effective_tax_yr is not null ) 
          or
          ( @old_effective_tax_yr is not null and @new_effective_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'effective_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1431, convert(varchar(255), @old_effective_tax_yr), convert(varchar(255), @new_effective_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_adj_factor <> @new_imprv_det_adj_factor
          or
          ( @old_imprv_det_adj_factor is null and @new_imprv_det_adj_factor is not null ) 
          or
          ( @old_imprv_det_adj_factor is not null and @new_imprv_det_adj_factor is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_adj_factor' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2241, convert(varchar(255), @old_imprv_det_adj_factor), convert(varchar(255), @new_imprv_det_adj_factor), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_adj_amt <> @new_imprv_det_adj_amt
          or
          ( @old_imprv_det_adj_amt is null and @new_imprv_det_adj_amt is not null ) 
          or
          ( @old_imprv_det_adj_amt is not null and @new_imprv_det_adj_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_adj_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2238, convert(varchar(255), @old_imprv_det_adj_amt), convert(varchar(255), @new_imprv_det_adj_amt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_calc_val <> @new_imprv_det_calc_val
          or
          ( @old_imprv_det_calc_val is null and @new_imprv_det_calc_val is not null ) 
          or
          ( @old_imprv_det_calc_val is not null and @new_imprv_det_calc_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_calc_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2251, convert(varchar(255), @old_imprv_det_calc_val), convert(varchar(255), @new_imprv_det_calc_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_adj_val <> @new_imprv_det_adj_val
          or
          ( @old_imprv_det_adj_val is null and @new_imprv_det_adj_val is not null ) 
          or
          ( @old_imprv_det_adj_val is not null and @new_imprv_det_adj_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_adj_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2248, convert(varchar(255), @old_imprv_det_adj_val), convert(varchar(255), @new_imprv_det_adj_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_imprv_det_flat_val <> @new_imprv_det_flat_val
          or
          ( @old_imprv_det_flat_val is null and @new_imprv_det_flat_val is not null ) 
          or
          ( @old_imprv_det_flat_val is not null and @new_imprv_det_flat_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_flat_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 2255, convert(varchar(255), @old_imprv_det_flat_val), convert(varchar(255), @new_imprv_det_flat_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_economic_pct <> @new_economic_pct
          or
          ( @old_economic_pct is null and @new_economic_pct is not null ) 
          or
          ( @old_economic_pct is not null and @new_economic_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'economic_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1413, convert(varchar(255), @old_economic_pct), convert(varchar(255), @new_economic_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_physical_pct <> @new_physical_pct
          or
          ( @old_physical_pct is null and @new_physical_pct is not null ) 
          or
          ( @old_physical_pct is not null and @new_physical_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'physical_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3741, convert(varchar(255), @old_physical_pct), convert(varchar(255), @new_physical_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_physical_pct_source <> @new_physical_pct_source
          or
          ( @old_physical_pct_source is null and @new_physical_pct_source is not null ) 
          or
          ( @old_physical_pct_source is not null and @new_physical_pct_source is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'physical_pct_source' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3743, convert(varchar(255), @old_physical_pct_source), convert(varchar(255), @new_physical_pct_source), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_functional_pct <> @new_functional_pct
          or
          ( @old_functional_pct is null and @new_functional_pct is not null ) 
          or
          ( @old_functional_pct is not null and @new_functional_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'functional_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1988, convert(varchar(255), @old_functional_pct), convert(varchar(255), @new_functional_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_economic_pct_override <> @new_economic_pct_override
          or
          ( @old_economic_pct_override is null and @new_economic_pct_override is not null ) 
          or
          ( @old_economic_pct_override is not null and @new_economic_pct_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'economic_pct_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1414, convert(varchar(255), @old_economic_pct_override), convert(varchar(255), @new_economic_pct_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_physical_pct_override <> @new_physical_pct_override
          or
          ( @old_physical_pct_override is null and @new_physical_pct_override is not null ) 
          or
          ( @old_physical_pct_override is not null and @new_physical_pct_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'physical_pct_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3742, convert(varchar(255), @old_physical_pct_override), convert(varchar(255), @new_physical_pct_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_functional_pct_override <> @new_functional_pct_override
          or
          ( @old_functional_pct_override is null and @new_functional_pct_override is not null ) 
          or
          ( @old_functional_pct_override is not null and @new_functional_pct_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'functional_pct_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1989, convert(varchar(255), @old_functional_pct_override), convert(varchar(255), @new_functional_pct_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_economic_cmnt <> @new_economic_cmnt
          or
          ( @old_economic_cmnt is null and @new_economic_cmnt is not null ) 
          or
          ( @old_economic_cmnt is not null and @new_economic_cmnt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'economic_cmnt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1412, convert(varchar(255), @old_economic_cmnt), convert(varchar(255), @new_economic_cmnt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_physical_cmnt <> @new_physical_cmnt
          or
          ( @old_physical_cmnt is null and @new_physical_cmnt is not null ) 
          or
          ( @old_physical_cmnt is not null and @new_physical_cmnt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'physical_cmnt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3740, convert(varchar(255), @old_physical_cmnt), convert(varchar(255), @new_physical_cmnt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_functional_cmnt <> @new_functional_cmnt
          or
          ( @old_functional_cmnt is null and @new_functional_cmnt is not null ) 
          or
          ( @old_functional_cmnt is not null and @new_functional_cmnt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'functional_cmnt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1987, convert(varchar(255), @old_functional_cmnt), convert(varchar(255), @new_functional_cmnt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_percent_complete <> @new_percent_complete
          or
          ( @old_percent_complete is null and @new_percent_complete is not null ) 
          or
          ( @old_percent_complete is not null and @new_percent_complete is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'percent_complete' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3633, convert(varchar(255), @old_percent_complete), convert(varchar(255), @new_percent_complete), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_percent_complete_override <> @new_percent_complete_override
          or
          ( @old_percent_complete_override is null and @new_percent_complete_override is not null ) 
          or
          ( @old_percent_complete_override is not null and @new_percent_complete_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'percent_complete_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3635, convert(varchar(255), @old_percent_complete_override), convert(varchar(255), @new_percent_complete_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_percent_complete_cmnt <> @new_percent_complete_cmnt
          or
          ( @old_percent_complete_cmnt is null and @new_percent_complete_cmnt is not null ) 
          or
          ( @old_percent_complete_cmnt is not null and @new_percent_complete_cmnt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'percent_complete_cmnt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3634, convert(varchar(255), @old_percent_complete_cmnt), convert(varchar(255), @new_percent_complete_cmnt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_new_value_flag <> @new_new_value_flag
          or
          ( @old_new_value_flag is null and @new_new_value_flag is not null ) 
          or
          ( @old_new_value_flag is not null and @new_new_value_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'new_value_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3249, convert(varchar(255), @old_new_value_flag), convert(varchar(255), @new_new_value_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_new_value <> @new_new_value
          or
          ( @old_new_value is null and @new_new_value is not null ) 
          or
          ( @old_new_value is not null and @new_new_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'new_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3248, convert(varchar(255), @old_new_value), convert(varchar(255), @new_new_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_new_value_override <> @new_new_value_override
          or
          ( @old_new_value_override is null and @new_new_value_override is not null ) 
          or
          ( @old_new_value_override is not null and @new_new_value_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'new_value_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3250, convert(varchar(255), @old_new_value_override), convert(varchar(255), @new_new_value_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_sketch_cmds <> @new_sketch_cmds
          or
          ( @old_sketch_cmds is null and @new_sketch_cmds is not null ) 
          or
          ( @old_sketch_cmds is not null and @new_sketch_cmds is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'sketch_cmds' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4754, convert(varchar(255), @old_sketch_cmds), convert(varchar(255), @new_sketch_cmds), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_use_up_for_pct_base <> @new_use_up_for_pct_base
          or
          ( @old_use_up_for_pct_base is null and @new_use_up_for_pct_base is not null ) 
          or
          ( @old_use_up_for_pct_base is not null and @new_use_up_for_pct_base is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'use_up_for_pct_base' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 5456, convert(varchar(255), @old_use_up_for_pct_base), convert(varchar(255), @new_use_up_for_pct_base), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'ref_id1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4327, convert(varchar(255), @old_ref_id1), convert(varchar(255), @new_ref_id1), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_reserved1 <> @new_reserved1
          or
          ( @old_reserved1 is null and @new_reserved1 is not null ) 
          or
          ( @old_reserved1 is not null and @new_reserved1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'reserved1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4406, convert(varchar(255), @old_reserved1), convert(varchar(255), @new_reserved1), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_can_close_sketch <> @new_can_close_sketch
          or
          ( @old_can_close_sketch is null and @new_can_close_sketch is not null ) 
          or
          ( @old_can_close_sketch is not null and @new_can_close_sketch is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'can_close_sketch' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 608, convert(varchar(255), @old_can_close_sketch), convert(varchar(255), @new_can_close_sketch), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_dep_pct <> @new_dep_pct
          or
          ( @old_dep_pct is null and @new_dep_pct is not null ) 
          or
          ( @old_dep_pct is not null and @new_dep_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'dep_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1307, convert(varchar(255), @old_dep_pct), convert(varchar(255), @new_dep_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_add_factor <> @new_add_factor
          or
          ( @old_add_factor is null and @new_add_factor is not null ) 
          or
          ( @old_add_factor is not null and @new_add_factor is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'add_factor' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 64, convert(varchar(255), @old_add_factor), convert(varchar(255), @new_add_factor), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_add_factor_override <> @new_add_factor_override
          or
          ( @old_add_factor_override is null and @new_add_factor_override is not null ) 
          or
          ( @old_add_factor_override is not null and @new_add_factor_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'add_factor_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 65, convert(varchar(255), @old_add_factor_override), convert(varchar(255), @new_add_factor_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_size_adj_pct <> @new_size_adj_pct
          or
          ( @old_size_adj_pct is null and @new_size_adj_pct is not null ) 
          or
          ( @old_size_adj_pct is not null and @new_size_adj_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'size_adj_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4750, convert(varchar(255), @old_size_adj_pct), convert(varchar(255), @new_size_adj_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_dep_pct_override <> @new_dep_pct_override
          or
          ( @old_dep_pct_override is null and @new_dep_pct_override is not null ) 
          or
          ( @old_dep_pct_override is not null and @new_dep_pct_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'dep_pct_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 1308, convert(varchar(255), @old_dep_pct_override), convert(varchar(255), @new_dep_pct_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_size_adj_pct_override <> @new_size_adj_pct_override
          or
          ( @old_size_adj_pct_override is null and @new_size_adj_pct_override is not null ) 
          or
          ( @old_size_adj_pct_override is not null and @new_size_adj_pct_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'size_adj_pct_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 4751, convert(varchar(255), @old_size_adj_pct_override), convert(varchar(255), @new_size_adj_pct_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
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
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'imprv_det_sub_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 6106, convert(varchar(255), @old_imprv_det_sub_class_cd), convert(varchar(255), @new_imprv_det_sub_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_num_units <> @new_num_units
          or
          ( @old_num_units is null and @new_num_units is not null ) 
          or
          ( @old_num_units is not null and @new_num_units is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'num_units' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 3371, convert(varchar(255), @old_num_units), convert(varchar(255), @new_num_units), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_num_stories <> @new_num_stories
          or
          ( @old_num_stories is null and @new_num_stories is not null ) 
          or
          ( @old_num_stories is not null and @new_num_stories is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'num_stories' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9193, convert(varchar(255), @old_num_stories), convert(varchar(255), @new_num_stories), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_stories_multiplier <> @new_stories_multiplier
          or
          ( @old_stories_multiplier is null and @new_stories_multiplier is not null ) 
          or
          ( @old_stories_multiplier is not null and @new_stories_multiplier is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'stories_multiplier' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9230, convert(varchar(255), @old_stories_multiplier), convert(varchar(255), @new_stories_multiplier), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_lease_class <> @new_lease_class
          or
          ( @old_lease_class is null and @new_lease_class is not null ) 
          or
          ( @old_lease_class is not null and @new_lease_class is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'lease_class' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9406, convert(varchar(255), @old_lease_class), convert(varchar(255), @new_lease_class), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_actual_year_built_override <> @new_actual_year_built_override
          or
          ( @old_actual_year_built_override is null and @new_actual_year_built_override is not null ) 
          or
          ( @old_actual_year_built_override is not null and @new_actual_year_built_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'actual_year_built_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9380, convert(varchar(255), @old_actual_year_built_override), convert(varchar(255), @new_actual_year_built_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_flat_value_comment <> @new_flat_value_comment
          or
          ( @old_flat_value_comment is null and @new_flat_value_comment is not null ) 
          or
          ( @old_flat_value_comment is not null and @new_flat_value_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'flat_value_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9399, convert(varchar(255), @old_flat_value_comment), convert(varchar(255), @new_flat_value_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_flat_value_user_id <> @new_flat_value_user_id
          or
          ( @old_flat_value_user_id is null and @new_flat_value_user_id is not null ) 
          or
          ( @old_flat_value_user_id is not null and @new_flat_value_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'flat_value_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9402, convert(varchar(255), @old_flat_value_user_id), convert(varchar(255), @new_flat_value_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_flat_value_date <> @new_flat_value_date
          or
          ( @old_flat_value_date is null and @new_flat_value_date is not null ) 
          or
          ( @old_flat_value_date is not null and @new_flat_value_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'flat_value_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9400, convert(varchar(255), @old_flat_value_date), convert(varchar(255), @new_flat_value_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_depreciated_replacement_cost_new <> @new_depreciated_replacement_cost_new
          or
          ( @old_depreciated_replacement_cost_new is null and @new_depreciated_replacement_cost_new is not null ) 
          or
          ( @old_depreciated_replacement_cost_new is not null and @new_depreciated_replacement_cost_new is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'depreciated_replacement_cost_new' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9387, convert(varchar(255), @old_depreciated_replacement_cost_new), convert(varchar(255), @new_depreciated_replacement_cost_new), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_floor_number <> @new_floor_number
          or
          ( @old_floor_number is null and @new_floor_number is not null ) 
          or
          ( @old_floor_number is not null and @new_floor_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'floor_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9403, convert(varchar(255), @old_floor_number), convert(varchar(255), @new_floor_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_load_factor <> @new_load_factor
          or
          ( @old_load_factor is null and @new_load_factor is not null ) 
          or
          ( @old_load_factor is not null and @new_load_factor is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'load_factor' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9407, convert(varchar(255), @old_load_factor), convert(varchar(255), @new_load_factor), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_actual_age <> @new_actual_age
          or
          ( @old_actual_age is null and @new_actual_age is not null ) 
          or
          ( @old_actual_age is not null and @new_actual_age is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'actual_age' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9378, convert(varchar(255), @old_actual_age), convert(varchar(255), @new_actual_age), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_net_rentable_area <> @new_net_rentable_area
          or
          ( @old_net_rentable_area is null and @new_net_rentable_area is not null ) 
          or
          ( @old_net_rentable_area is not null and @new_net_rentable_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'net_rentable_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9409, convert(varchar(255), @old_net_rentable_area), convert(varchar(255), @new_net_rentable_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     if (
          @old_building_id <> @new_building_id
          or
          ( @old_building_id is null and @new_building_id is not null ) 
          or
          ( @old_building_id is not null and @new_building_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail' and
                    chg_log_columns = 'building_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 324, 9383, convert(varchar(255), @old_building_id), convert(varchar(255), @new_building_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_imprv_id, @old_imprv_det_id, @old_sup_num, @old_sale_id, @old_imprv_det_class_cd, @old_imprv_det_meth_cd, @old_imprv_det_type_cd, @old_seq_num, @old_imprv_det_val, @old_imprv_det_val_source, @old_imprv_det_desc, @old_imprv_det_area, @old_imprv_det_area_type, @old_condition_cd, @old_cubic_area, @old_calc_area, @old_sketch_area, @old_override_area, @old_override_cubic_area, @old_override_perimeter, @old_perimeter, @old_length, @old_width, @old_height, @old_unit_price, @old_yr_new, @old_yr_built, @old_depreciation_yr, @old_depreciation_yr_override, @old_imprv_det_orig_val, @old_imprv_det_orig_up, @old_effective_tax_yr, @old_imprv_det_adj_factor, @old_imprv_det_adj_amt, @old_imprv_det_calc_val, @old_imprv_det_adj_val, @old_imprv_det_flat_val, @old_economic_pct, @old_physical_pct, @old_physical_pct_source, @old_functional_pct, @old_economic_pct_override, @old_physical_pct_override, @old_functional_pct_override, @old_economic_cmnt, @old_physical_cmnt, @old_functional_cmnt, @old_percent_complete, @old_percent_complete_override, @old_percent_complete_cmnt, @old_new_value_flag, @old_new_value, @old_new_value_override, @old_sketch_cmds, @old_use_up_for_pct_base, @old_ref_id1, @old_reserved1, @old_can_close_sketch, @old_dep_pct, @old_add_factor, @old_add_factor_override, @old_size_adj_pct, @old_dep_pct_override, @old_size_adj_pct_override, @old_imprv_det_sub_class_cd, @old_num_units, @old_num_stories, @old_stories_multiplier, @old_lease_class, @old_actual_year_built_override, @old_flat_value_comment, @old_flat_value_user_id, @old_flat_value_date, @old_depreciated_replacement_cost_new, @old_floor_number, @old_load_factor, @old_actual_age, @old_net_rentable_area, @old_building_id, @new_prop_id, @new_prop_val_yr, @new_imprv_id, @new_imprv_det_id, @new_sup_num, @new_sale_id, @new_imprv_det_class_cd, @new_imprv_det_meth_cd, @new_imprv_det_type_cd, @new_seq_num, @new_imprv_det_val, @new_imprv_det_val_source, @new_imprv_det_desc, @new_imprv_det_area, @new_imprv_det_area_type, @new_condition_cd, @new_cubic_area, @new_calc_area, @new_sketch_area, @new_override_area, @new_override_cubic_area, @new_override_perimeter, @new_perimeter, @new_length, @new_width, @new_height, @new_unit_price, @new_yr_new, @new_yr_built, @new_depreciation_yr, @new_depreciation_yr_override, @new_imprv_det_orig_val, @new_imprv_det_orig_up, @new_effective_tax_yr, @new_imprv_det_adj_factor, @new_imprv_det_adj_amt, @new_imprv_det_calc_val, @new_imprv_det_adj_val, @new_imprv_det_flat_val, @new_economic_pct, @new_physical_pct, @new_physical_pct_source, @new_functional_pct, @new_economic_pct_override, @new_physical_pct_override, @new_functional_pct_override, @new_economic_cmnt, @new_physical_cmnt, @new_functional_cmnt, @new_percent_complete, @new_percent_complete_override, @new_percent_complete_cmnt, @new_new_value_flag, @new_new_value, @new_new_value_override, @new_sketch_cmds, @new_use_up_for_pct_base, @new_ref_id1, @new_reserved1, @new_can_close_sketch, @new_dep_pct, @new_add_factor, @new_add_factor_override, @new_size_adj_pct, @new_dep_pct_override, @new_size_adj_pct_override, @new_imprv_det_sub_class_cd, @new_num_units, @new_num_stories, @new_stories_multiplier, @new_lease_class, @new_actual_year_built_override, @new_flat_value_comment, @new_flat_value_user_id, @new_flat_value_date, @new_depreciated_replacement_cost_new, @new_floor_number, @new_load_factor, @new_actual_age, @new_net_rentable_area, @new_building_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_imprv_detail_insert_ChangeLog
on imprv_detail
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
 
declare @prop_id int
declare @prop_val_yr numeric(4,0)
declare @imprv_id int
declare @imprv_det_id int
declare @sup_num int
declare @sale_id int
declare @imprv_det_class_cd char(10)
declare @imprv_det_meth_cd char(5)
declare @imprv_det_type_cd char(10)
declare @seq_num int
declare @imprv_det_val numeric(18,0)
declare @imprv_det_val_source char(1)
declare @imprv_det_desc varchar(30)
declare @imprv_det_area numeric(18,1)
declare @imprv_det_area_type char(1)
declare @condition_cd char(5)
declare @cubic_area numeric(18,1)
declare @calc_area numeric(18,1)
declare @sketch_area numeric(18,1)
declare @override_area char(1)
declare @override_cubic_area char(1)
declare @override_perimeter char(1)
declare @perimeter numeric(18,1)
declare @length numeric(18,1)
declare @width numeric(18,1)
declare @height numeric(18,1)
declare @unit_price numeric(14,2)
declare @yr_new numeric(4,0)
declare @yr_built numeric(4,0)
declare @depreciation_yr numeric(4,0)
declare @depreciation_yr_override char(1)
declare @imprv_det_orig_val numeric(14,0)
declare @imprv_det_orig_up numeric(14,2)
declare @effective_tax_yr numeric(4,0)
declare @imprv_det_adj_factor numeric(8,6)
declare @imprv_det_adj_amt numeric(14,0)
declare @imprv_det_calc_val numeric(14,0)
declare @imprv_det_adj_val numeric(14,0)
declare @imprv_det_flat_val numeric(14,0)
declare @economic_pct numeric(5,2)
declare @physical_pct numeric(5,2)
declare @physical_pct_source char(1)
declare @functional_pct numeric(5,2)
declare @economic_pct_override char(1)
declare @physical_pct_override char(1)
declare @functional_pct_override char(1)
declare @economic_cmnt varchar(255)
declare @physical_cmnt varchar(255)
declare @functional_cmnt varchar(255)
declare @percent_complete numeric(5,2)
declare @percent_complete_override char(1)
declare @percent_complete_cmnt varchar(255)
declare @new_value_flag char(1)
declare @new_value numeric(14,0)
declare @new_value_override char(1)
declare @sketch_cmds varchar(1800)
declare @use_up_for_pct_base char(1)
declare @ref_id1 varchar(50)
declare @reserved1 numeric(14,0)
declare @can_close_sketch char(1)
declare @dep_pct numeric(5,2)
declare @add_factor numeric(5,2)
declare @add_factor_override char(1)
declare @size_adj_pct numeric(5,2)
declare @dep_pct_override char(1)
declare @size_adj_pct_override char(1)
declare @imprv_det_sub_class_cd varchar(10)
declare @num_units int
declare @num_stories int
declare @stories_multiplier bit
declare @lease_class varchar(10)
declare @actual_year_built_override bit
declare @flat_value_comment varchar(50)
declare @flat_value_user_id int
declare @flat_value_date datetime
declare @depreciated_replacement_cost_new numeric(14,0)
declare @floor_number numeric(4,0)
declare @load_factor numeric(3,0)
declare @actual_age numeric(4,0)
declare @net_rentable_area numeric(18,0)
declare @building_id int
 
declare curRows cursor
for
     select prop_id, case prop_val_yr when 0 then @tvar_lFutureYear else prop_val_yr end, imprv_id, imprv_det_id, sup_num, sale_id, imprv_det_class_cd, imprv_det_meth_cd, imprv_det_type_cd, seq_num, imprv_det_val, imprv_det_val_source, imprv_det_desc, imprv_det_area, imprv_det_area_type, condition_cd, cubic_area, calc_area, sketch_area, override_area, override_cubic_area, override_perimeter, perimeter, length, width, height, unit_price, yr_new, yr_built, depreciation_yr, depreciation_yr_override, imprv_det_orig_val, imprv_det_orig_up, effective_tax_yr, imprv_det_adj_factor, imprv_det_adj_amt, imprv_det_calc_val, imprv_det_adj_val, imprv_det_flat_val, economic_pct, physical_pct, physical_pct_source, functional_pct, economic_pct_override, physical_pct_override, functional_pct_override, economic_cmnt, physical_cmnt, functional_cmnt, percent_complete, percent_complete_override, percent_complete_cmnt, new_value_flag, new_value, new_value_override, sketch_cmds, use_up_for_pct_base, ref_id1, reserved1, can_close_sketch, dep_pct, add_factor, add_factor_override, size_adj_pct, dep_pct_override, size_adj_pct_override, imprv_det_sub_class_cd, num_units, num_stories, stories_multiplier, lease_class, actual_year_built_override, flat_value_comment, flat_value_user_id, flat_value_date, depreciated_replacement_cost_new, floor_number, load_factor, actual_age, net_rentable_area, building_id from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @imprv_id, @imprv_det_id, @sup_num, @sale_id, @imprv_det_class_cd, @imprv_det_meth_cd, @imprv_det_type_cd, @seq_num, @imprv_det_val, @imprv_det_val_source, @imprv_det_desc, @imprv_det_area, @imprv_det_area_type, @condition_cd, @cubic_area, @calc_area, @sketch_area, @override_area, @override_cubic_area, @override_perimeter, @perimeter, @length, @width, @height, @unit_price, @yr_new, @yr_built, @depreciation_yr, @depreciation_yr_override, @imprv_det_orig_val, @imprv_det_orig_up, @effective_tax_yr, @imprv_det_adj_factor, @imprv_det_adj_amt, @imprv_det_calc_val, @imprv_det_adj_val, @imprv_det_flat_val, @economic_pct, @physical_pct, @physical_pct_source, @functional_pct, @economic_pct_override, @physical_pct_override, @functional_pct_override, @economic_cmnt, @physical_cmnt, @functional_cmnt, @percent_complete, @percent_complete_override, @percent_complete_cmnt, @new_value_flag, @new_value, @new_value_override, @sketch_cmds, @use_up_for_pct_base, @ref_id1, @reserved1, @can_close_sketch, @dep_pct, @add_factor, @add_factor_override, @size_adj_pct, @dep_pct_override, @size_adj_pct_override, @imprv_det_sub_class_cd, @num_units, @num_stories, @stories_multiplier, @lease_class, @actual_year_built_override, @flat_value_comment, @flat_value_user_id, @flat_value_date, @depreciated_replacement_cost_new, @floor_number, @load_factor, @actual_age, @net_rentable_area, @building_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = id.imprv_det_class_cd + '-' + id.imprv_det_meth_cd + '-' + id.imprv_det_type_cd
     from imprv_detail as id with(nolock)
     where id.prop_id = @prop_id
     and id.prop_val_yr = @prop_val_yr
     and id.sup_num = @sup_num
     and id.imprv_id = @imprv_id
     and id.imprv_det_id = @imprv_det_id
     and id.sale_id = @sale_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2275, null, convert(varchar(255), @imprv_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2256, null, convert(varchar(255), @imprv_det_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'sale_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4485, null, convert(varchar(255), @sale_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2252, null, convert(varchar(255), @imprv_det_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_meth_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2257, null, convert(varchar(255), @imprv_det_meth_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2263, null, convert(varchar(255), @imprv_det_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'seq_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4700, null, convert(varchar(255), @seq_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2264, null, convert(varchar(255), @imprv_det_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_val_source' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2265, null, convert(varchar(255), @imprv_det_val_source), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2254, null, convert(varchar(255), @imprv_det_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2249, null, convert(varchar(255), @imprv_det_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_area_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2250, null, convert(varchar(255), @imprv_det_area_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'condition_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 844, null, convert(varchar(255), @condition_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'cubic_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 931, null, convert(varchar(255), @cubic_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'calc_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 603, null, convert(varchar(255), @calc_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'sketch_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4753, null, convert(varchar(255), @sketch_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'override_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3457, null, convert(varchar(255), @override_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'override_cubic_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3458, null, convert(varchar(255), @override_cubic_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'override_perimeter' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3465, null, convert(varchar(255), @override_perimeter), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'perimeter' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3637, null, convert(varchar(255), @perimeter), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'length' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2784, null, convert(varchar(255), @length), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'width' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 5537, null, convert(varchar(255), @width), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'height' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2057, null, convert(varchar(255), @height), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'unit_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 5416, null, convert(varchar(255), @unit_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'yr_new' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 5559, null, convert(varchar(255), @yr_new), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'yr_built' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 5558, null, convert(varchar(255), @yr_built), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'depreciation_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1314, null, convert(varchar(255), @depreciation_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'depreciation_yr_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1315, null, convert(varchar(255), @depreciation_yr_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_orig_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2260, null, convert(varchar(255), @imprv_det_orig_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_orig_up' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2259, null, convert(varchar(255), @imprv_det_orig_up), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'effective_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1431, null, convert(varchar(255), @effective_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_adj_factor' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2241, null, convert(varchar(255), @imprv_det_adj_factor), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_adj_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2238, null, convert(varchar(255), @imprv_det_adj_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_calc_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2251, null, convert(varchar(255), @imprv_det_calc_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_adj_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2248, null, convert(varchar(255), @imprv_det_adj_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_flat_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 2255, null, convert(varchar(255), @imprv_det_flat_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'economic_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1413, null, convert(varchar(255), @economic_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'physical_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3741, null, convert(varchar(255), @physical_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'physical_pct_source' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3743, null, convert(varchar(255), @physical_pct_source), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'functional_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1988, null, convert(varchar(255), @functional_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'economic_pct_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1414, null, convert(varchar(255), @economic_pct_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'physical_pct_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3742, null, convert(varchar(255), @physical_pct_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'functional_pct_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1989, null, convert(varchar(255), @functional_pct_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'economic_cmnt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1412, null, convert(varchar(255), @economic_cmnt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'physical_cmnt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3740, null, convert(varchar(255), @physical_cmnt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'functional_cmnt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1987, null, convert(varchar(255), @functional_cmnt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'percent_complete' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3633, null, convert(varchar(255), @percent_complete), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'percent_complete_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3635, null, convert(varchar(255), @percent_complete_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'percent_complete_cmnt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3634, null, convert(varchar(255), @percent_complete_cmnt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'new_value_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3249, null, convert(varchar(255), @new_value_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'new_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3248, null, convert(varchar(255), @new_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'new_value_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3250, null, convert(varchar(255), @new_value_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'sketch_cmds' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4754, null, convert(varchar(255), @sketch_cmds), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'use_up_for_pct_base' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 5456, null, convert(varchar(255), @use_up_for_pct_base), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'ref_id1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4327, null, convert(varchar(255), @ref_id1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'reserved1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4406, null, convert(varchar(255), @reserved1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'can_close_sketch' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 608, null, convert(varchar(255), @can_close_sketch), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'dep_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1307, null, convert(varchar(255), @dep_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'add_factor' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 64, null, convert(varchar(255), @add_factor), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'add_factor_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 65, null, convert(varchar(255), @add_factor_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'size_adj_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4750, null, convert(varchar(255), @size_adj_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'dep_pct_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 1308, null, convert(varchar(255), @dep_pct_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'size_adj_pct_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 4751, null, convert(varchar(255), @size_adj_pct_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'imprv_det_sub_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 6106, null, convert(varchar(255), @imprv_det_sub_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'num_units' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 3371, null, convert(varchar(255), @num_units), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'num_stories' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9193, null, convert(varchar(255), @num_stories), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'stories_multiplier' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9230, null, convert(varchar(255), @stories_multiplier), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'lease_class' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9406, null, convert(varchar(255), @lease_class), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'actual_year_built_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9380, null, convert(varchar(255), @actual_year_built_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'flat_value_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9399, null, convert(varchar(255), @flat_value_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'flat_value_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9402, null, convert(varchar(255), @flat_value_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'flat_value_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9400, null, convert(varchar(255), @flat_value_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'depreciated_replacement_cost_new' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9387, null, convert(varchar(255), @depreciated_replacement_cost_new), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'floor_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9403, null, convert(varchar(255), @floor_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'load_factor' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9407, null, convert(varchar(255), @load_factor), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'actual_age' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9378, null, convert(varchar(255), @actual_age), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'net_rentable_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9409, null, convert(varchar(255), @net_rentable_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail' and
               chg_log_columns = 'building_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 324, 9383, null, convert(varchar(255), @building_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     end
 
     fetch next from curRows into @prop_id, @prop_val_yr, @imprv_id, @imprv_det_id, @sup_num, @sale_id, @imprv_det_class_cd, @imprv_det_meth_cd, @imprv_det_type_cd, @seq_num, @imprv_det_val, @imprv_det_val_source, @imprv_det_desc, @imprv_det_area, @imprv_det_area_type, @condition_cd, @cubic_area, @calc_area, @sketch_area, @override_area, @override_cubic_area, @override_perimeter, @perimeter, @length, @width, @height, @unit_price, @yr_new, @yr_built, @depreciation_yr, @depreciation_yr_override, @imprv_det_orig_val, @imprv_det_orig_up, @effective_tax_yr, @imprv_det_adj_factor, @imprv_det_adj_amt, @imprv_det_calc_val, @imprv_det_adj_val, @imprv_det_flat_val, @economic_pct, @physical_pct, @physical_pct_source, @functional_pct, @economic_pct_override, @physical_pct_override, @functional_pct_override, @economic_cmnt, @physical_cmnt, @functional_cmnt, @percent_complete, @percent_complete_override, @percent_complete_cmnt, @new_value_flag, @new_value, @new_value_override, @sketch_cmds, @use_up_for_pct_base, @ref_id1, @reserved1, @can_close_sketch, @dep_pct, @add_factor, @add_factor_override, @size_adj_pct, @dep_pct_override, @size_adj_pct_override, @imprv_det_sub_class_cd, @num_units, @num_stories, @stories_multiplier, @lease_class, @actual_year_built_override, @flat_value_comment, @flat_value_user_id, @flat_value_date, @depreciated_replacement_cost_new, @floor_number, @load_factor, @actual_age, @net_rentable_area, @building_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_imprv_detail_delete_ChangeLog
on imprv_detail
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
          chg_log_tables = 'imprv_detail' and
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
declare @imprv_id int
declare @imprv_det_id int
declare @sup_num int
declare @sale_id int
 
declare curRows cursor
for
     select prop_id, case prop_val_yr when 0 then @tvar_lFutureYear else prop_val_yr end, imprv_id, imprv_det_id, sup_num, sale_id from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @imprv_id, @imprv_det_id, @sup_num, @sale_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = id.imprv_det_class_cd + '-' + id.imprv_det_meth_cd + '-' + id.imprv_det_type_cd
     from imprv_detail as id with(nolock)
     where id.prop_id = @prop_id
     and id.prop_val_yr = @prop_val_yr
     and id.sup_num = @sup_num
     and id.imprv_id = @imprv_id
     and id.imprv_det_id = @imprv_det_id
     and id.sale_id = @sale_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 324, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
 
     fetch next from curRows into @prop_id, @prop_val_yr, @imprv_id, @imprv_det_id, @sup_num, @sale_id
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The pacs userId of the user who validated the error', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_detail', @level2type = N'COLUMN', @level2name = N'recalc_error_validate_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The date and time the user validated the error', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_detail', @level2type = N'COLUMN', @level2name = N'recalc_error_validate_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag to indicate the user has validated the recalc error', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_detail', @level2type = N'COLUMN', @level2name = N'recalc_error_validate_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Marshall & Swift Building JSON', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_detail', @level2type = N'COLUMN', @level2name = N'ms_building_json';


GO

