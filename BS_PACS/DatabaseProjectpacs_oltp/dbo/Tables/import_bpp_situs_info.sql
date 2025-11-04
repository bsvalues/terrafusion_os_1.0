CREATE TABLE [dbo].[import_bpp_situs_info] (
    [run_id]              INT          NOT NULL,
    [sid]                 INT          IDENTITY (1, 1) NOT NULL,
    [prop_id]             INT          NOT NULL,
    [situs_number]        VARCHAR (15) NULL,
    [situs_street_prefix] VARCHAR (10) NULL,
    [situs_street]        VARCHAR (50) NULL,
    [situs_street_suffix] VARCHAR (10) NULL,
    [situs_unit]          VARCHAR (5)  NULL,
    [situs_city]          VARCHAR (30) NULL,
    [situs_state]         VARCHAR (2)  NULL,
    [situs_zip]           VARCHAR (10) NULL,
    [building_num]        VARCHAR (15) NULL,
    [sub_num]             VARCHAR (15) NULL,
    [primary_situs]       CHAR (1)     NULL,
    CONSTRAINT [CPK_import_bpp_situs_info] PRIMARY KEY CLUSTERED ([run_id] ASC, [sid] ASC),
    CONSTRAINT [CFK_import_bpp_situs_info_import_bpp] FOREIGN KEY ([run_id]) REFERENCES [dbo].[import_bpp] ([run_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Situs Street', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'situs_street';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Situs City', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'situs_city';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Building Number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'building_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import BPP Situs Informatoin table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Sub Num', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'sub_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Situs Number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'situs_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Situs Street Suffix', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'situs_street_suffix';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Situs State', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'situs_state';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Situs Zip', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'situs_zip';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Primary Situs Indicator (Y = Yes, N = No)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'primary_situs';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Situs Info ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'sid';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Situs Street Prefix', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'situs_street_prefix';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Situs Unit', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_situs_info', @level2type = N'COLUMN', @level2name = N'situs_unit';


GO

