CREATE TABLE [dbo].[land_update_table] (
    [prop_id_field]          INT             NOT NULL,
    [year_field]             NUMERIC (4)     NOT NULL,
    [land_id_field]          INT             NULL,
    [from_land_id_field]     INT             NULL,
    [acres]                  NUMERIC (18, 4) NULL,
    [market_unit_price]      NUMERIC (14, 2) NULL,
    [current_use_unit_price] NUMERIC (14, 2) NULL,
    [gis_land_detail_id]     INT             NULL,
    [set_ag_apply]           BIT             CONSTRAINT [CDF_land_update_table_set_ag_apply] DEFAULT ((0)) NOT NULL,
    [ag_apply]               CHAR (1)        NULL,
    [set_ag_use_cd]          BIT             CONSTRAINT [CDF_land_update_table_set_ag_use_cd] DEFAULT ((0)) NOT NULL,
    [ag_use_cd]              CHAR (5)        NULL,
    [set_application_number] BIT             CONSTRAINT [CDF_land_update_table_set_application_number] DEFAULT ((0)) NOT NULL,
    [application_number]     VARCHAR (16)    NULL,
    [change_land_type_cd]    BIT             CONSTRAINT [CDF_land_update_table_change_land_type_cd] DEFAULT ((0)) NOT NULL,
    [new_land_type_cd]       CHAR (10)       NULL
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'apply ag_apply or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_update_table', @level2type = N'COLUMN', @level2name = N'set_ag_apply';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'ag use cd', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_update_table', @level2type = N'COLUMN', @level2name = N'ag_use_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'new land type cd', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_update_table', @level2type = N'COLUMN', @level2name = N'new_land_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'apply application_number or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_update_table', @level2type = N'COLUMN', @level2name = N'set_application_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'ag apply', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_update_table', @level2type = N'COLUMN', @level2name = N'ag_apply';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'application number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_update_table', @level2type = N'COLUMN', @level2name = N'application_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'apply ag_use_cd or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_update_table', @level2type = N'COLUMN', @level2name = N'set_ag_use_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'apply new_land_type_cd or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_update_table', @level2type = N'COLUMN', @level2name = N'change_land_type_cd';


GO

