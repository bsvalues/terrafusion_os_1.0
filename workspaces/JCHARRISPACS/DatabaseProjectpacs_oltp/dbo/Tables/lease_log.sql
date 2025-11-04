CREATE TABLE [dbo].[lease_log] (
    [lease_chg_id] INT           IDENTITY (1, 1) NOT NULL,
    [lease_id]     VARCHAR (20)  NOT NULL,
    [lease_yr]     INT           NOT NULL,
    [chg_desc]     VARCHAR (255) NULL,
    [chg_dt]       DATETIME      NULL,
    [pacs_user_id] INT           NULL,
    CONSTRAINT [CPK_lease_log] PRIMARY KEY CLUSTERED ([lease_chg_id] ASC) WITH (FILLFACTOR = 90)
);


GO

