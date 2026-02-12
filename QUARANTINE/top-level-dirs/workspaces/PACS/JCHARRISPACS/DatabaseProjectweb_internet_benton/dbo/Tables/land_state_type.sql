CREATE TABLE [dbo].[land_state_type] (
    [land_state_type_code] VARCHAR (10) NOT NULL,
    [land_state_type_desc] VARCHAR (50) NULL,
    [land_state_type_ind]  VARCHAR (5)  NULL,
    CONSTRAINT [CPK_land_state_type] PRIMARY KEY CLUSTERED ([land_state_type_code] ASC) WITH (FILLFACTOR = 100)
);


GO

