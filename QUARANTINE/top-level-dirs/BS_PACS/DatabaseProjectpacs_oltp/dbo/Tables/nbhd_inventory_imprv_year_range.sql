CREATE TABLE [dbo].[nbhd_inventory_imprv_year_range] (
    [range_id]  INT NOT NULL,
    [min_value] INT NOT NULL,
    [max_value] INT NOT NULL,
    PRIMARY KEY CLUSTERED ([range_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Stratification settings for NBHD Inventory Year Range report', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'nbhd_inventory_imprv_year_range';


GO

