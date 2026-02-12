CREATE TABLE [dbo].[reet_type_fee] (
    [reet_type_cd] VARCHAR (12) NOT NULL,
    [fee_type_cd]  VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_reet_type_fee] PRIMARY KEY CLUSTERED ([reet_type_cd] ASC, [fee_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

