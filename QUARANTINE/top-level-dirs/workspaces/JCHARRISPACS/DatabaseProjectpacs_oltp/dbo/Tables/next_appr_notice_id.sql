CREATE TABLE [dbo].[next_appr_notice_id] (
    [notice_yr]      NUMERIC (4) NOT NULL,
    [next_notice_id] INT         NULL,
    CONSTRAINT [CPK_next_appr_notice_id] PRIMARY KEY CLUSTERED ([notice_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

