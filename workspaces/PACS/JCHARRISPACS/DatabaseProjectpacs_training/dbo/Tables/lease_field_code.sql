CREATE TABLE [dbo].[lease_field_code] (
    [field_id] VARCHAR (20) NOT NULL,
    [field_nm] VARCHAR (50) NOT NULL,
    [sys_flag] VARCHAR (1)  NULL,
    CONSTRAINT [CPK_lease_field_code] PRIMARY KEY CLUSTERED ([field_id] ASC) WITH (FILLFACTOR = 90)
);


GO

