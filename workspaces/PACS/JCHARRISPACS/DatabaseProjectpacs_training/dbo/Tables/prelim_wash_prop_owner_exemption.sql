CREATE TABLE [dbo].[prelim_wash_prop_owner_exemption] (
    [year]               NUMERIC (4)  NOT NULL,
    [sup_num]            INT          NOT NULL,
    [prop_id]            INT          NOT NULL,
    [owner_id]           INT          NOT NULL,
    [exmpt_type_cd]      VARCHAR (10) NOT NULL,
    [exempt_value]       NUMERIC (14) NOT NULL,
    [exempt_sub_type_cd] VARCHAR (10) NULL,
    [exempt_qualify_cd]  VARCHAR (10) NULL,
    CONSTRAINT [CPK_prelim_wash_prop_owner_exemption] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC)
);


GO

