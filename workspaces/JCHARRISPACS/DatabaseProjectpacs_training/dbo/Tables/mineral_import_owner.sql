CREATE TABLE [dbo].[mineral_import_owner] (
    [run_id]          INT          NOT NULL,
    [acct_id]         INT          NOT NULL,
    [owner_no]        VARCHAR (20) NULL,
    [file_as_name]    VARCHAR (50) NULL,
    [addr_line1]      VARCHAR (30) NULL,
    [addr_line2]      VARCHAR (30) NULL,
    [addr_line3]      VARCHAR (30) NULL,
    [addr_city]       VARCHAR (30) NULL,
    [addr_st]         VARCHAR (30) NULL,
    [addr_zip]        VARCHAR (10) NULL,
    [source]          VARCHAR (30) NULL,
    [acct_create_dt]  DATETIME     NULL,
    [new]             CHAR (1)     NULL,
    [appr_company_id] INT          NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_owner_no]
    ON [dbo].[mineral_import_owner]([owner_no] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_owner]([run_id] ASC);


GO

