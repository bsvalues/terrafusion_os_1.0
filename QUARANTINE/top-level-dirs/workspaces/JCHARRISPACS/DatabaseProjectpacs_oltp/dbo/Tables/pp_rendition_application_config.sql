CREATE TABLE [dbo].[pp_rendition_application_config] (
    [year]                      NUMERIC (4)    NOT NULL,
    [instructions_main]         VARCHAR (8000) NULL,
    [instructions_supplies]     VARCHAR (8000) NULL,
    [instructions_commercial]   VARCHAR (8000) NULL,
    [instructions_farm]         VARCHAR (8000) NULL,
    [instructions_leased]       VARCHAR (8000) NULL,
    [instructions_penalty]      VARCHAR (8000) NULL,
    [farm_contact_info]         VARCHAR (8000) NULL,
    [instructions_improvements] VARCHAR (8000) NULL,
    [instructions_cost]         VARCHAR (8000) NULL,
    CONSTRAINT [CPK_pp_rendition_application_config] PRIMARY KEY CLUSTERED ([year] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Leasehold Improvements', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_application_config', @level2type = N'COLUMN', @level2name = N'instructions_improvements';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Aquisition Cost', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'pp_rendition_application_config', @level2type = N'COLUMN', @level2name = N'instructions_cost';


GO

