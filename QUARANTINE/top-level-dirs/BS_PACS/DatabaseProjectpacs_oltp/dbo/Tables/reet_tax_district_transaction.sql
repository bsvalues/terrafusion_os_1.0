CREATE TABLE [dbo].[reet_tax_district_transaction] (
    [reet_id]         INT NOT NULL,
    [reet_rate_id]    INT NOT NULL,
    [trans_group_id]  INT NOT NULL,
    [tax_district_id] INT CONSTRAINT [CDF_reet_tax_district_transaction_tax_district_id] DEFAULT ((0)) NOT NULL,
    [tax_area_id]     INT NULL,
    CONSTRAINT [CPK_reet_tax_district_transaction] PRIMARY KEY CLUSTERED ([reet_id] ASC, [reet_rate_id] ASC, [trans_group_id] ASC),
    CONSTRAINT [CFK_reet_tax_district_transaction_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id]),
    CONSTRAINT [CFK_reet_tax_district_transaction_reet_rate_id] FOREIGN KEY ([reet_rate_id]) REFERENCES [dbo].[reet_rate] ([reet_rate_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'stored tax_area_id of property associated to the reet', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_tax_district_transaction', @level2type = N'COLUMN', @level2name = N'tax_area_id';


GO

