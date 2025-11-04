CREATE TABLE [dbo].[refund_levy_config_mapped_levy] (
    [refund_levy_config_id] INT          NOT NULL,
    [tax_district_id]       INT          NOT NULL,
    [primary_levy_cd]       VARCHAR (10) NOT NULL,
    [levy_cd_linked]        VARCHAR (10) NOT NULL,
    [tax_district_desc]     VARCHAR (50) NOT NULL,
    [primary_levy_desc]     VARCHAR (50) NOT NULL,
    [linked_levy_desc]      VARCHAR (50) NOT NULL,
    CONSTRAINT [PK_refund_levy_config_mapped_levy] PRIMARY KEY CLUSTERED ([refund_levy_config_id] ASC, [tax_district_id] ASC, [primary_levy_cd] ASC, [levy_cd_linked] ASC),
    CONSTRAINT [FK_refund_levy_config_id2] FOREIGN KEY ([refund_levy_config_id]) REFERENCES [dbo].[refund_levy_config] ([refund_levy_config_id]) ON DELETE CASCADE
);


GO

