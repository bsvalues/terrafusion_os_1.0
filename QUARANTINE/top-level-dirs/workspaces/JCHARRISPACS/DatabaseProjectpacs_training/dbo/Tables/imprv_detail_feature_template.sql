CREATE TABLE [dbo].[imprv_detail_feature_template] (
    [imprv_detail_feature_template_id] INT       NOT NULL,
    [imprv_det_type_cd]                CHAR (10) NOT NULL,
    [imprv_det_meth_cd]                CHAR (5)  NOT NULL,
    CONSTRAINT [CPK_imprv_detail_feature_template] PRIMARY KEY CLUSTERED ([imprv_detail_feature_template_id] ASC),
    CONSTRAINT [CFK_imprv_detail_feature_template_imprv_det_meth] FOREIGN KEY ([imprv_det_meth_cd]) REFERENCES [dbo].[imprv_det_meth] ([imprv_det_meth_cd]),
    CONSTRAINT [CFK_imprv_detail_feature_template_imprv_det_type] FOREIGN KEY ([imprv_det_type_cd]) REFERENCES [dbo].[imprv_det_type] ([imprv_det_type_cd])
);


GO

