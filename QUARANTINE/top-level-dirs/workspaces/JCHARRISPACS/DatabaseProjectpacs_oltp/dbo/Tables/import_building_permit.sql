CREATE TABLE [dbo].[import_building_permit] (
    [run_id]         INT           NOT NULL,
    [type]           VARCHAR (50)  NOT NULL,
    [status]         CHAR (1)      NOT NULL,
    [import_date]    DATETIME      NOT NULL,
    [import_user_id] INT           NOT NULL,
    [match_date]     DATETIME      NULL,
    [match_user_id]  INT           NULL,
    [num_records]    INT           NOT NULL,
    [num_matches]    INT           NULL,
    [num_errors]     INT           NOT NULL,
    [file_path]      VARCHAR (255) NOT NULL,
    [worksheet_type] VARCHAR (10)  NULL,
    CONSTRAINT [CPK_import_building_permit] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 100)
);


GO

