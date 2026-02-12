CREATE TABLE [dbo].[mobile_manager_import] (
    [type]        VARCHAR (100) NOT NULL,
    [create_date] DATETIME      NOT NULL,
    [create_by]   INT           NOT NULL,
    [file_name]   VARCHAR (100) NULL,
    [comment]     VARCHAR (100) NULL,
    [run_id]      INT           NOT NULL,
    [target]      INT           DEFAULT ((0)) NOT NULL,
    [status]      VARCHAR (55)  DEFAULT ('Unknown') NOT NULL,
    [mode]        VARCHAR (10)  DEFAULT ('update') NOT NULL,
    PRIMARY KEY CLUSTERED ([run_id] ASC)
);


GO

