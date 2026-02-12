CREATE TABLE [dbo].[user_property] (
    [prop_id]               INT             NOT NULL,
    [pldd_acreage_assessed] NUMERIC (18, 4) NULL,
    CONSTRAINT [CPK_user_property] PRIMARY KEY CLUSTERED ([prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_user_property_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

