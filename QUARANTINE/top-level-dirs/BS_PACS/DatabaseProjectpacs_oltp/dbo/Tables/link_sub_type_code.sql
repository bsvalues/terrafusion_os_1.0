CREATE TABLE [dbo].[link_sub_type_code] (
    [link_sub_type_cd]   VARCHAR (5)  NOT NULL,
    [link_type_cd]       VARCHAR (5)  NOT NULL,
    [link_sub_type_desc] VARCHAR (20) NOT NULL,
    [tax_comparison]     BIT          NOT NULL,
    [annexation]         BIT          NOT NULL,
    [u500]               BIT          NOT NULL,
    [mobile_home]        BIT          NOT NULL,
    CONSTRAINT [CPK_link_sub_type_code] PRIMARY KEY CLUSTERED ([link_sub_type_cd] ASC, [link_type_cd] ASC)
);


GO

