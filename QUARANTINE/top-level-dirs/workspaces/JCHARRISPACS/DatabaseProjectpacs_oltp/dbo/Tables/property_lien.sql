CREATE TABLE [dbo].[property_lien] (
    [lien_id]              INT            NOT NULL,
    [lien_type_cd]         VARCHAR (20)   NOT NULL,
    [date_created]         DATETIME       CONSTRAINT [CDF_property_lien_date_created] DEFAULT (getdate()) NOT NULL,
    [effective_date]       DATETIME       NULL,
    [current_use_program]  VARCHAR (50)   NULL,
    [recorded_number]      VARCHAR (50)   NULL,
    [volume]               VARCHAR (20)   NULL,
    [page]                 VARCHAR (20)   NULL,
    [comment]              VARCHAR (255)  NULL,
    [year]                 NUMERIC (4)    CONSTRAINT [CDF_property_lien_year] DEFAULT ((0)) NOT NULL,
    [lien_document]        INT            NULL,
    [taxpayer_letter]      INT            NULL,
    [fee_type_cd]          VARCHAR (10)   NULL,
    [ag_legal_desc]        VARCHAR (MAX)  NULL,
    [dfl_legal_desc]       VARCHAR (MAX)  NULL,
    [os_timber_legal_desc] VARCHAR (MAX)  NULL,
    [acres]                NUMERIC (9, 5) NULL,
    [app_num]              VARCHAR (16)   NULL,
    CONSTRAINT [CPK_property_lien] PRIMARY KEY CLUSTERED ([lien_id] ASC),
    CONSTRAINT [CFK_property_lien_lien_type] FOREIGN KEY ([lien_type_cd]) REFERENCES [dbo].[lien_type] ([lien_type_code])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Year of a lien', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Number of acres', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'acres';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'OS Timber Legal Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'os_timber_legal_desc';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Fee type associated with a lien', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'fee_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'DFL Legal Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'dfl_legal_desc';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Taxpayer letter ID associated with a lien', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'taxpayer_letter';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Letter ID associated with a lien', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'lien_document';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'AG Legal Description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'ag_legal_desc';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Application number associated with a lien', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_lien', @level2type = N'COLUMN', @level2name = N'app_num';


GO

