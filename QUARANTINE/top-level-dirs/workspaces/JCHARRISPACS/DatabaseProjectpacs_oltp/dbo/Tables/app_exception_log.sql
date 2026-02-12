CREATE TABLE [dbo].[app_exception_log] (
    [id]                          INT             IDENTITY (1, 1) NOT NULL,
    [date_exception]              DATETIME        NOT NULL,
    [machine_name]                VARCHAR (23)    NOT NULL,
    [app_login_id]                INT             NOT NULL,
    [dll_class_method]            VARCHAR (255)   NULL,
    [transaction_id]              BIGINT          NULL,
    [transaction_input_params]    VARBINARY (MAX) NULL,
    [exception_data]              VARBINARY (MAX) NOT NULL,
    [exception_text1]             VARCHAR (MAX)   NOT NULL,
    [exception_text2]             VARCHAR (MAX)   NOT NULL,
    [exception_text3]             VARCHAR (MAX)   NOT NULL,
    [exception_text4]             VARCHAR (MAX)   NOT NULL,
    [exception_callstack]         VARCHAR (MAX)   NOT NULL,
    [app_state]                   VARCHAR (MAX)   NULL,
    [exception_type]              VARCHAR (MAX)   NULL,
    [app_name]                    VARCHAR (MAX)   NULL,
    [server_local_date_exception] DATETIME        NOT NULL,
    [client_app_version]          VARCHAR (MAX)   NULL,
    CONSTRAINT [CPK_app_exception_log] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO

