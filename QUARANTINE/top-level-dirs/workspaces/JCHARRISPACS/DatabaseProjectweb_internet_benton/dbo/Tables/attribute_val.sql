CREATE TABLE [dbo].[attribute_val] (
    [imprv_attr_id]     INT          NOT NULL,
    [imprv_attr_val_cd] VARCHAR (75) NOT NULL,
    [sys_flag]          CHAR (1)     NULL,
    [cach_flag]         CHAR (1)     NULL,
    CONSTRAINT [CPK_attribute_val] PRIMARY KEY CLUSTERED ([imprv_attr_id] ASC, [imprv_attr_val_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

