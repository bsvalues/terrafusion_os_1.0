CREATE TABLE [dbo].[cc_fee] (
    [cc_type]           VARCHAR (5)     NOT NULL,
    [cc_fee_max]        NUMERIC (14, 2) NOT NULL,
    [cc_fee_percentage] NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_cc_fee] PRIMARY KEY CLUSTERED ([cc_type] ASC, [cc_fee_max] ASC) WITH (FILLFACTOR = 100)
);


GO

