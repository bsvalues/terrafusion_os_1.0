CREATE TABLE [dbo].[sales_ratio_report_query] (
    [pacs_user_id]     INT              NOT NULL,
    [type]             VARCHAR (50)     NOT NULL,
    [code_value]       VARCHAR (50)     NULL,
    [code_id]          INT              NULL,
    [begin_date]       VARCHAR (25)     NULL,
    [end_date]         VARCHAR (25)     NULL,
    [begin_value]      NUMERIC (18, 10) NULL,
    [end_value]        NUMERIC (18, 10) NULL,
    [begin_char_value] VARCHAR (50)     NULL,
    [end_char_value]   VARCHAR (50)     NULL,
    [lKey]             INT              IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_sales_ratio_report_query] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

