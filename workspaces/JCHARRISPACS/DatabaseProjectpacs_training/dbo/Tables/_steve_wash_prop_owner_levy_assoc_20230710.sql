CREATE TABLE [dbo].[_steve_wash_prop_owner_levy_assoc_20230710] (
    [year]            NUMERIC (4)  NOT NULL,
    [sup_num]         INT          NOT NULL,
    [prop_id]         INT          NOT NULL,
    [owner_id]        INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [tax_area_id]     INT          NOT NULL,
    [pending]         BIT          NOT NULL
);


GO

