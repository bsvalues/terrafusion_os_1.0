CREATE TABLE [dbo].[change_log_display_config] (
    [chg_log_tables]  VARCHAR (50) NOT NULL,
    [chg_log_columns] VARCHAR (50) NOT NULL,
    [lookup_table]    VARCHAR (50) NOT NULL,
    [key_field]       VARCHAR (50) NOT NULL,
    [display_field]   VARCHAR (50) NOT NULL,
    CONSTRAINT [cpk_change_log_display_config] PRIMARY KEY CLUSTERED ([chg_log_tables] ASC, [chg_log_columns] ASC)
);


GO

