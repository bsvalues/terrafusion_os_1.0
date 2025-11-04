CREATE TABLE [dbo].[gis] (
    [location]           VARCHAR (255) NOT NULL,
    [color]              VARCHAR (15)  NULL,
    [color_constant]     VARCHAR (15)  NULL,
    [county_file]        CHAR (1)      NULL,
    [name]               VARCHAR (25)  NULL,
    [server]             VARCHAR (255) NULL,
    [db]                 VARCHAR (255) NULL,
    [userid]             VARCHAR (50)  NULL,
    [password]           VARCHAR (50)  NULL,
    [penpad_location]    VARCHAR (255) NULL,
    [transfer_to_penpad] BIT           CONSTRAINT [CDF_gis_transfer_to_penpad] DEFAULT ((0)) NOT NULL,
    [parcel_year]        NUMERIC (4)   NULL,
    [shape_schema]       VARCHAR (255) NULL,
    [version]            VARCHAR (255) NULL,
    [port]               INT           NULL,
    [type]               INT           CONSTRAINT [CDF_gis_type] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_gis] PRIMARY KEY CLUSTERED ([location] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'SDE Database Port.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'gis', @level2type = N'COLUMN', @level2name = N'port';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The year to which the parcel layer belongs.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'gis', @level2type = N'COLUMN', @level2name = N'parcel_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Layer Type.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'gis', @level2type = N'COLUMN', @level2name = N'type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The layer schema name.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'gis', @level2type = N'COLUMN', @level2name = N'shape_schema';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'SDE Database Version (typically SDE.Default).', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'gis', @level2type = N'COLUMN', @level2name = N'version';


GO

