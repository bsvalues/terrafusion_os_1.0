CREATE TABLE [dbo].[tnt_export] (
    [tnt_export_id]   INT           IDENTITY (1, 1) NOT NULL,
    [exported_yr]     INT           NOT NULL,
    [prev_yr_sup_num] INT           NOT NULL,
    [pacs_user_id]    INT           NOT NULL,
    [entities]        VARCHAR (500) NOT NULL,
    [run_date_time]   DATETIME      NOT NULL,
    CONSTRAINT [CPK_tnt_export] PRIMARY KEY CLUSTERED ([tnt_export_id] ASC) WITH (FILLFACTOR = 90)
);


GO

