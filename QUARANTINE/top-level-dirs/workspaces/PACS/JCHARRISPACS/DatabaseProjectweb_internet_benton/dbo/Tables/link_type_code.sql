CREATE TABLE [dbo].[link_type_code] (
    [prop_link_type_cd]   VARCHAR (5)  NOT NULL,
    [prop_link_type_desc] VARCHAR (20) NOT NULL,
    [notify_when_present] BIT          NULL,
    CONSTRAINT [CPK_link_type_code] PRIMARY KEY CLUSTERED ([prop_link_type_cd] ASC)
);


GO

