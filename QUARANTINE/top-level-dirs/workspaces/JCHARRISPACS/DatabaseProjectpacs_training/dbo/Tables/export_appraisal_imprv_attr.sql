CREATE TABLE [dbo].[export_appraisal_imprv_attr] (
    [prop_id]         INT          NOT NULL,
    [prop_val_yr]     NUMERIC (4)  NOT NULL,
    [sup_num]         INT          NOT NULL,
    [imprv_id]        INT          NOT NULL,
    [imprv_det_id]    INT          NOT NULL,
    [imprv_attr_id]   INT          NOT NULL,
    [imprv_attr_desc] VARCHAR (50) NULL,
    [imprv_attr_cd]   VARCHAR (75) NULL,
    [dataset_id]      INT          NOT NULL,
    [segment_number]  INT          NULL,
    [i_attr_val_id]   INT          CONSTRAINT [CDF_export_appraisal_imprv_attr_i_attr_val_id] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [cpk_export_appraisal_imprv_attr] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [imprv_id] ASC, [sup_num] ASC, [i_attr_val_id] ASC, [imprv_det_id] ASC, [imprv_attr_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Describe the purpose of this column', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'export_appraisal_imprv_attr', @level2type = N'COLUMN', @level2name = N'i_attr_val_id';


GO

