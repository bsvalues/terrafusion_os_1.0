CREATE TABLE [dbo].[penpad_change_log] (
    [run_id]        INT           NOT NULL,
    [change_dt]     DATETIME      NOT NULL,
    [dml_operation] INT           NOT NULL,
    [keys]          VARCHAR (512) NOT NULL,
    [prop_id]       INT           NULL,
    [table_name]    VARCHAR (255) NOT NULL,
    [field_name]    VARCHAR (255) NULL,
    [old_value]     VARCHAR (512) NULL,
    [new_value]     VARCHAR (512) NULL,
    [lChangeID]     INT           IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_penpad_change_log] PRIMARY KEY CLUSTERED ([lChangeID] ASC) WITH (FILLFACTOR = 100)
);


GO

