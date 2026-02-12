CREATE TABLE [dbo].[collections_owner_cv] (
    [acct_id]        INT          NOT NULL,
    [owner_no]       VARCHAR (20) NULL,
    [file_as_name]   VARCHAR (50) NULL,
    [addr_line1]     VARCHAR (30) NULL,
    [addr_line2]     VARCHAR (30) NULL,
    [addr_line3]     VARCHAR (30) NULL,
    [addr_city]      VARCHAR (30) NULL,
    [addr_st]        VARCHAR (30) NULL,
    [addr_zip]       VARCHAR (10) NULL,
    [source]         VARCHAR (30) NULL,
    [acct_create_dt] DATETIME     NULL,
    CONSTRAINT [CPK_collections_owner_cv] PRIMARY KEY NONCLUSTERED ([acct_id] ASC) WITH (FILLFACTOR = 90)
);


GO

