CREATE TABLE [dbo].[trans_group_type] (
    [trans_group_type_cd]   VARCHAR (10) NOT NULL,
    [trans_group_type_desc] VARCHAR (50) NULL,
    [core_object_type_cd]   VARCHAR (20) NULL,
    [allow_variance]        BIT          NOT NULL,
    CONSTRAINT [PK__trans_group_type__0ED07B77] PRIMARY KEY CLUSTERED ([trans_group_type_cd] ASC)
);


GO

