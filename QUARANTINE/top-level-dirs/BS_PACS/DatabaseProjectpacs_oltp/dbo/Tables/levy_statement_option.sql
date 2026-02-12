CREATE TABLE [dbo].[levy_statement_option] (
    [year]                  NUMERIC (4)   NOT NULL,
    [tax_district_id]       INT           NOT NULL,
    [levy_cd]               VARCHAR (10)  NOT NULL,
    [separate_levy_display] BIT           NULL,
    [levy_description]      VARCHAR (255) NULL,
    [levy_comment]          VARCHAR (255) NULL,
    CONSTRAINT [CPK_levy_statement_option] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_levy_statement_option_year_tax_district_id_levy_cd] FOREIGN KEY ([year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy] ([year], [tax_district_id], [levy_cd]) ON DELETE CASCADE
);


GO

