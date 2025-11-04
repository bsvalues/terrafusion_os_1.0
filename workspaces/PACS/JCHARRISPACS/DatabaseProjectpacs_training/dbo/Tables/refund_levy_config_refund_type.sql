CREATE TABLE [dbo].[refund_levy_config_refund_type] (
    [refund_levy_config_id] INT          NOT NULL,
    [refund_type_cd]        VARCHAR (20) NOT NULL,
    [refund_reason]         VARCHAR (50) NULL,
    CONSTRAINT [PK_refund_levy_config_refund_types] PRIMARY KEY CLUSTERED ([refund_levy_config_id] ASC, [refund_type_cd] ASC),
    CONSTRAINT [FK_refund_levy_config_id] FOREIGN KEY ([refund_levy_config_id]) REFERENCES [dbo].[refund_levy_config] ([refund_levy_config_id]) ON DELETE CASCADE
);


GO

