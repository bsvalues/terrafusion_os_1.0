CREATE TABLE [dbo].[client_machine_config] (
    [machine_name]       VARCHAR (23)  NOT NULL,
    [sql_named_instance] VARCHAR (127) NOT NULL,
    CONSTRAINT [CPK_client_machine_config] PRIMARY KEY CLUSTERED ([machine_name] ASC) WITH (FILLFACTOR = 100)
);


GO

