CREATE TABLE [dbo].[attribute] (
    [imprv_attr_id]      INT          NOT NULL,
    [imprv_attr_desc]    VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    [cCompSalesAdjust]   CHAR (1)     NOT NULL,
    [bModifierFactor]    BIT          NOT NULL,
    [bStoriesMultiplier] BIT          NULL,
    [web_export]         BIT          NOT NULL,
    [rc_type]            CHAR (1)     NULL,
    [inactive_flag]      BIT          NULL,
    CONSTRAINT [CPK_attribute] PRIMARY KEY CLUSTERED ([imprv_attr_id] ASC) WITH (FILLFACTOR = 90)
);


GO

