CREATE TABLE [dbo].[property_sketch] (
    [prop_id]     INT             NOT NULL,
    [prop_val_yr] NUMERIC (4)     NOT NULL,
    [sup_num]     INT             NOT NULL,
    [sketch]      VARBINARY (MAX) NOT NULL,
    CONSTRAINT [PK_property_sketch] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC),
    CONSTRAINT [FK_property_sketch_property_val] FOREIGN KEY ([prop_val_yr], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Stores sketches from the RapidSketch tool at a Property level (so they may be moved to Improvement Details later)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_sketch';


GO

