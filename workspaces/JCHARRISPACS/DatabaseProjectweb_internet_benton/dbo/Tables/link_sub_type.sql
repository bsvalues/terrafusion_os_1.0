CREATE TABLE [dbo].[link_sub_type] (
    [link_sub_type_cd]       VARCHAR (5)  NOT NULL,
    [link_sub_type_desc]     VARCHAR (20) NOT NULL,
    [link_type_cd]           VARCHAR (5)  NOT NULL,
    [tax_comparison]         BIT          NULL,
    [state_assessed_utility] BIT          NULL,
    [annexation]             BIT          NULL,
    [u500]                   BIT          NULL,
    [mobile_home]            BIT          NULL,
    [personal_property]      BIT          NOT NULL,
    [use_in_link_summary]    BIT          NULL,
    CONSTRAINT [CPK_link_sub_type] PRIMARY KEY CLUSTERED ([link_sub_type_cd] ASC, [link_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

