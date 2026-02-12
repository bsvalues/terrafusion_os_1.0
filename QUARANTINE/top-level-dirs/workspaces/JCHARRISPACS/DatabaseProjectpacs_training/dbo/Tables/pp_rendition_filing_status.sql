CREATE TABLE [dbo].[pp_rendition_filing_status] (
    [code]        VARCHAR (25)  NOT NULL,
    [description] VARCHAR (100) NULL,
    [is_complete] BIT           DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_pp_rendition_filing_status] PRIMARY KEY CLUSTERED ([code] ASC)
);


GO

