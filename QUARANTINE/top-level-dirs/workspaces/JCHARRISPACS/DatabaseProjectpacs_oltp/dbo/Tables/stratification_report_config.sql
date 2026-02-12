CREATE TABLE [dbo].[stratification_report_config] (
    [config]      VARCHAR (32)  NOT NULL,
    [state_cd]    VARCHAR (5)   NOT NULL,
    [range]       INT           NOT NULL,
    [entity_lidt] VARCHAR (255) NULL,
    [begin_dt]    DATETIME      NULL,
    [end_dt]      DATETIME      NULL,
    CONSTRAINT [CPK_stratification_report_config] PRIMARY KEY CLUSTERED ([config] ASC, [state_cd] ASC, [range] ASC) WITH (FILLFACTOR = 100)
);


GO

