CREATE TABLE [dbo].[monthly_as_of_recap_params] (
    [pacs_user_id]    INT          NOT NULL,
    [entity_id]       INT          NOT NULL,
    [begin_date]      DATETIME     NULL,
    [end_date]        DATETIME     NULL,
    [fiscal_end_date] DATETIME     NULL,
    [fiscal_year]     VARCHAR (10) NULL,
    CONSTRAINT [CPK_monthly_as_of_recap_params] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

