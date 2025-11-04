CREATE TABLE [dbo].[user_property_special_assessment] (
    [year]                      NUMERIC (4) NOT NULL,
    [sup_num]                   INT         NOT NULL,
    [prop_id]                   INT         NOT NULL,
    [agency_id]                 INT         NOT NULL,
    [nwa_forestparcel_count]    INT         NULL,
    [nwa_nonforestparcel_count] INT         NULL,
    [nwa_forestacres_sum]       INT         NULL,
    [nwa_nonforestacres_sum]    INT         NULL,
    PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [agency_id] ASC)
);


GO

