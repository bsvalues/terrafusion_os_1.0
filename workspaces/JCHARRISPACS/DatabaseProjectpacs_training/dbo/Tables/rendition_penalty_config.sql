CREATE TABLE [dbo].[rendition_penalty_config] (
    [year]            NUMERIC (4)     NOT NULL,
    [penalty_id]      INT             NOT NULL,
    [start_date]      DATETIME        NOT NULL,
    [end_date]        DATETIME        NOT NULL,
    [penalty_percent] NUMERIC (14, 2) NOT NULL,
    [max_penalty]     INT             CONSTRAINT [CDF_rendition_penalty_config_max_penalty] DEFAULT ((999999999)) NOT NULL,
    CONSTRAINT [CPK_rendition_penalty_config] PRIMARY KEY CLUSTERED ([year] ASC, [penalty_id] ASC),
    CONSTRAINT [CFK_rendition_penalty_config_year] FOREIGN KEY ([year]) REFERENCES [dbo].[rendition_late_filing_config] ([year])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Determines maximum allowed penalty applied', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'rendition_penalty_config', @level2type = N'COLUMN', @level2name = N'max_penalty';


GO

