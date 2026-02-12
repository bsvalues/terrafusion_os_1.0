CREATE TABLE [dbo].[curr_use_rollback_config] (
    [year]         NUMERIC (4)  NOT NULL,
    [update_by_id] INT          NULL,
    [update_date]  DATETIME     NULL,
    [fee_type_cd]  VARCHAR (10) NOT NULL,
    CONSTRAINT [PK__curr_use_rollbac__672C9E71] PRIMARY KEY CLUSTERED ([year] ASC) WITH (FILLFACTOR = 100)
);


GO

