CREATE TABLE [dbo].[prop_linked_owner] (
    [prop_val_yr]  NUMERIC (4)   NOT NULL,
    [sup_num]      INT           NOT NULL,
    [prop_id]      INT           NOT NULL,
    [owner_id]     INT           NOT NULL,
    [owner_desc]   VARCHAR (100) NULL,
    [link_type_cd] VARCHAR (10)  NULL,
    CONSTRAINT [CPK_prop_linked_owner] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC),
    CONSTRAINT [CFK_prop_linked_owner_link_type_cd] FOREIGN KEY ([link_type_cd]) REFERENCES [dbo].[owner_link_type_code] ([linked_cd])
);


GO

