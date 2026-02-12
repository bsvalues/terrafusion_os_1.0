CREATE TABLE [dbo].[user_property_val] (
    [prop_id]               INT             NOT NULL,
    [prop_val_yr]           NUMERIC (4)     NOT NULL,
    [sup_num]               INT             NOT NULL,
    [is_primary]            BIT             NULL,
    [sum_acres]             DECIMAL (18, 4) NULL,
    [benefit_acres]         DECIMAL (18, 4) NULL,
    [benefit_acre_sum]      NUMERIC (18, 4) NULL,
    [nwa_type]              VARCHAR (3)     NULL,
    [nwa_acres]             INT             NULL,
    [nwa_supplemental]      NUMERIC (18, 4) NULL,
    [nwa_aggregate_pid]     INT             NULL,
    [displaytext_exemption] VARCHAR (50)    NULL,
    [displaytext_massadj]   VARCHAR (50)    NULL,
    [crid_acres]            NUMERIC (18)    NULL,
    [weed_acres]            NUMERIC (18)    NULL,
    [drain_acres]           DECIMAL (18, 4) NULL,
    CONSTRAINT [CPK_user_property_val] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_user_property_val_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

