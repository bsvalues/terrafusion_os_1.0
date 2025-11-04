CREATE TABLE [dbo].[wash_prop_owner_levy_assoc] (
    [year]            NUMERIC (4)  NOT NULL,
    [sup_num]         INT          NOT NULL,
    [prop_id]         INT          NOT NULL,
    [owner_id]        INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [tax_area_id]     INT          NOT NULL,
    [pending]         BIT          CONSTRAINT [CDF_wash_prop_owner_levy_assoc_pending] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wash_prop_owner_levy_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [levy_cd] ASC, [tax_district_id] ASC, [tax_area_id] ASC)
);


GO

