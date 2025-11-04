CREATE TABLE [dbo].[imprv_det_type] (
    [imprv_det_type_cd]             CHAR (10)    NOT NULL,
    [imprv_det_typ_desc]            VARCHAR (50) NULL,
    [main_area]                     CHAR (1)     NULL,
    [sys_flag]                      CHAR (1)     NULL,
    [comp_sales_main_area_flag]     CHAR (1)     CONSTRAINT [CDF_imprv_det_type_comp_sales_main_area_flag] DEFAULT ('F') NOT NULL,
    [comp_sales_the_main_area_flag] CHAR (1)     CONSTRAINT [CDF_imprv_det_type_comp_sales_the_main_area_flag] DEFAULT ('F') NOT NULL,
    [bUseBaseMAMethod]              BIT          CONSTRAINT [CDF_imprv_det_type_bUseBaseMAMethod] DEFAULT (0) NOT NULL,
    [bUseBaseMAClass]               BIT          CONSTRAINT [CDF_imprv_det_type_bUseBaseMAClass] DEFAULT (0) NOT NULL,
    [bUseBaseMASubclass]            BIT          CONSTRAINT [CDF_imprv_det_type_bUseBaseMASubclass] DEFAULT (0) NOT NULL,
    [sketch_area_fill_color]        INT          NULL,
    [is_permanent_crop_detail]      BIT          CONSTRAINT [CDF_imprv_det_type_is_permanent_crop_detail] DEFAULT ((0)) NOT NULL,
    [is_irrigation_detail]          BIT          CONSTRAINT [CDF_imprv_det_type_is_irrigation_detail] DEFAULT ((0)) NOT NULL,
    [is_mchy_n_equip]               BIT          CONSTRAINT [CDF_imprv_det_type_is_mchy_n_equip] DEFAULT ((0)) NULL,
    [rc_type]                       CHAR (1)     NULL,
    [bPool]                         BIT          CONSTRAINT [CDF_imprv_det_type_bPool] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_imprv_det_type] PRIMARY KEY CLUSTERED ([imprv_det_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_comp_sales_main_area_flag]
    ON [dbo].[imprv_det_type]([comp_sales_main_area_flag] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_imprv_det_type_delete_insert_update_MemTable
on imprv_det_type
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
where szTableName = 'imprv_det_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential/Commercial type indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_det_type', @level2type = N'COLUMN', @level2name = N'rc_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies whether this detail is a pool or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_det_type', @level2type = N'COLUMN', @level2name = N'bPool';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies whether the improvement detail is a machinery and equipment detail', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_det_type', @level2type = N'COLUMN', @level2name = N'is_mchy_n_equip';


GO

