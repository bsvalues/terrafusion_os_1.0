CREATE TABLE [dbo].[mineral_owner_cv] (
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
    [new]            CHAR (1)     NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_acct_id]
    ON [dbo].[mineral_owner_cv]([acct_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE CLUSTERED INDEX [idx_owner_no_source]
    ON [dbo].[mineral_owner_cv]([owner_no] ASC, [source] ASC) WITH (FILLFACTOR = 90);


GO

