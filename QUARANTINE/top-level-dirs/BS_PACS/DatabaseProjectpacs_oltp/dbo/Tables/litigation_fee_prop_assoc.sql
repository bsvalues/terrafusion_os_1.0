CREATE TABLE [dbo].[litigation_fee_prop_assoc] (
    [litigation_fee_id] INT NOT NULL,
    [fee_id]            INT NOT NULL,
    [litigation_id]     INT NOT NULL,
    [prop_id]           INT NOT NULL,
    CONSTRAINT [CPK_litigation_fee_prop_assoc] PRIMARY KEY CLUSTERED ([litigation_fee_id] ASC, [fee_id] ASC),
    CONSTRAINT [CFK_litigation_fee_prop_assoc_fee] FOREIGN KEY ([fee_id]) REFERENCES [dbo].[fee] ([fee_id]),
    CONSTRAINT [CFK_litigation_fee_prop_assoc_litigation] FOREIGN KEY ([litigation_id]) REFERENCES [dbo].[litigation] ([litigation_id]),
    CONSTRAINT [CFK_litigation_fee_prop_assoc_litigation_fee] FOREIGN KEY ([litigation_fee_id]) REFERENCES [dbo].[litigation_fee] ([litigation_fee_id])
);


GO

