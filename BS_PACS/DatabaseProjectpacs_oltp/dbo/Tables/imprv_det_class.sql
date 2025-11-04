CREATE TABLE [dbo].[imprv_det_class] (
    [imprv_det_class_cd]       CHAR (10)    NOT NULL,
    [imprv_det_cls_desc]       VARCHAR (50) NULL,
    [sys_flag]                 VARCHAR (1)  NULL,
    [is_permanent_crop_detail] BIT          CONSTRAINT [CDF_imprv_det_class_permanent_crop_detail] DEFAULT ((0)) NOT NULL,
    [rc_type]                  CHAR (1)     NULL,
    CONSTRAINT [CPK_imprv_det_class] PRIMARY KEY CLUSTERED ([imprv_det_class_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_imprv_det_class_delete_insert_update_MemTable
on imprv_det_class
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
where szTableName = 'imprv_det_class'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential/Commercial type indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_det_class', @level2type = N'COLUMN', @level2name = N'rc_type';


GO

