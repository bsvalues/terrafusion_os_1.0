CREATE TABLE [dbo].[imprv_detail_feature_template_detail] (
    [imprv_detail_feature_template_detail_id] INT             NOT NULL,
    [imprv_detail_feature_template_id]        INT             NOT NULL,
    [imprv_attr_id]                           INT             NOT NULL,
    [imprv_attr_val_cd]                       VARCHAR (75)    NOT NULL,
    [imprv_attr_unit]                         NUMERIC (10, 2) NULL,
    [feature_order]                           INT             DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_imprv_detail_feature_template_detail] PRIMARY KEY CLUSTERED ([imprv_detail_feature_template_detail_id] ASC),
    CONSTRAINT [CFK_imprv_detail_feature_template_detail_attribute] FOREIGN KEY ([imprv_attr_id]) REFERENCES [dbo].[attribute] ([imprv_attr_id]),
    CONSTRAINT [CFK_imprv_detail_feature_template_detail_attribute_val] FOREIGN KEY ([imprv_attr_id], [imprv_attr_val_cd]) REFERENCES [dbo].[attribute_val] ([imprv_attr_id], [imprv_attr_val_cd]),
    CONSTRAINT [CFK_imprv_detail_feature_template_detail_imprv_detail_feature_template] FOREIGN KEY ([imprv_detail_feature_template_id]) REFERENCES [dbo].[imprv_detail_feature_template] ([imprv_detail_feature_template_id]) ON DELETE CASCADE
);


GO

