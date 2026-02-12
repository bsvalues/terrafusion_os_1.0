CREATE TABLE [dbo].[oa_changes] (
    [oa_id]             INT         IDENTITY (1, 1) NOT NULL,
    [acct_id]           INT         NULL,
    [acct_type]         VARCHAR (1) NOT NULL,
    [change_type]       VARCHAR (1) NOT NULL,
    [prop_id]           INT         NULL,
    [owner_tax_yr]      INT         NULL,
    [sup_num]           INT         NULL,
    [update_dt]         DATETIME    NULL,
    [address_update_dt] DATETIME    NULL,
    CONSTRAINT [CPK_oa_changes] PRIMARY KEY CLUSTERED ([oa_id] ASC) WITH (FILLFACTOR = 100)
);


GO

