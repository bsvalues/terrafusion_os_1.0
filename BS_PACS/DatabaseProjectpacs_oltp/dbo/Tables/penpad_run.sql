CREATE TABLE [dbo].[penpad_run] (
    [run_id]                    INT            NOT NULL,
    [status_cd]                 VARCHAR (2)    NULL,
    [pacs_user_id]              INT            NULL,
    [criteria_type]             VARCHAR (10)   NULL,
    [criteria]                  VARCHAR (2048) NULL,
    [check_in_date]             DATETIME       NULL,
    [check_out_date]            DATETIME       NULL,
    [prop_count]                INT            NULL,
    [penpad_name]               VARCHAR (50)   NULL,
    [recalc_flag]               CHAR (1)       NULL,
    [bNonPropertyDataCheckedIn] BIT            CONSTRAINT [CDF_penpad_run_bNonPropertyDataCheckedIn] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_penpad_run] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 90)
);


GO

