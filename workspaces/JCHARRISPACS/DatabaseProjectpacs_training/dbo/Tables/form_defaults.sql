CREATE TABLE [dbo].[form_defaults] (
    [type]                      VARCHAR (30) NOT NULL,
    [ts_mailto_addr_adjustment] INT          NULL,
    [ts_stub_location]          INT          NULL,
    CONSTRAINT [CPK_form_defaults] PRIMARY KEY CLUSTERED ([type] ASC) WITH (FILLFACTOR = 100)
);


GO

