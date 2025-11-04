CREATE TABLE [dbo].[integrity_check_history] (
    [batch_id]      INT           IDENTITY (1, 1) NOT NULL,
    [process_cd]    VARCHAR (10)  NOT NULL,
    [check_type]    INT           NULL,
    [range_type]    VARCHAR (10)  NOT NULL,
    [check_dt]      DATETIME      NOT NULL,
    [year]          VARCHAR (100) NOT NULL,
    [sup_num]       INT           NOT NULL,
    [pacs_user_id]  INT           NOT NULL,
    [description]   VARCHAR (100) NULL,
    [expiration_dt] DATETIME      NOT NULL,
    [ic_ref_id]     INT           NULL,
    [entities]      VARCHAR (255) NOT NULL,
    [options]       VARCHAR (50)  NOT NULL,
    [deleted]       BIT           NULL,
    CONSTRAINT [CPK_integrity_check_history] PRIMARY KEY CLUSTERED ([batch_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_integrity_check_history_process_cd] FOREIGN KEY ([process_cd]) REFERENCES [dbo].[integrity_process_cd] ([process_cd])
);


GO

