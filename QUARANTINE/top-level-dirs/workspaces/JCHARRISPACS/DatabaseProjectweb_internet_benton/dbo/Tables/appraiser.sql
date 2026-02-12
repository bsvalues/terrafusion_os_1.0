CREATE TABLE [dbo].[appraiser] (
    [appraiser_id]        INT          NOT NULL,
    [appraiser_nm]        VARCHAR (40) NOT NULL,
    [appraiser_full_name] VARCHAR (75) NULL,
    [inactive]            VARCHAR (1)  NULL,
    [sys_flag]            BIT          NOT NULL,
    [pacs_user_id]        INT          NULL,
    CONSTRAINT [CPK_appraiser] PRIMARY KEY CLUSTERED ([appraiser_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_appraiser_nm]
    ON [dbo].[appraiser]([appraiser_nm] ASC) WITH (FILLFACTOR = 90);


GO

