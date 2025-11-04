CREATE TABLE [dbo].[reet_type_code] (
    [reet_type_cd]   VARCHAR (12) NOT NULL,
    [reet_type_desc] VARCHAR (50) NOT NULL,
    [taxable]        BIT          NOT NULL,
    [mobile_home]    BIT          NOT NULL,
    CONSTRAINT [CPK_reet_type_code] PRIMARY KEY CLUSTERED ([reet_type_cd] ASC)
);


GO

