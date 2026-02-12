CREATE TABLE [dbo].[ptd_state_code] (
    [state_cd]          VARCHAR (2)  NOT NULL,
    [state_desc]        VARCHAR (50) NULL,
    [state_type_cd]     VARCHAR (2)  NULL,
    [state_report_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_ptd_state_code] PRIMARY KEY CLUSTERED ([state_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

