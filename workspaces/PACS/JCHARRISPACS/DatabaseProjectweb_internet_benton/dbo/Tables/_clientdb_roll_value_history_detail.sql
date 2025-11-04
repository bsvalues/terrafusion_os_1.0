CREATE TABLE [dbo].[_clientdb_roll_value_history_detail] (
    [prop_id]         INT          NOT NULL,
    [prop_val_yr]     NUMERIC (4)  NOT NULL,
    [improvements]    NUMERIC (15) NULL,
    [land_market]     NUMERIC (19) NULL,
    [ag_valuation]    NUMERIC (17) NULL,
    [appraised_val]   NUMERIC (14) NOT NULL,
    [ten_percent_cap] NUMERIC (14) NULL,
    [assessed_val]    NUMERIC (15) NULL,
    [show_values]     VARCHAR (1)  NOT NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_roll_value_history_detail]
    ON [dbo].[_clientdb_roll_value_history_detail]([prop_val_yr] ASC, [prop_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IDX__clientdb_roll_value_history_detail_prop_val_yr]
    ON [dbo].[_clientdb_roll_value_history_detail]([prop_val_yr] ASC) WITH (FILLFACTOR = 90);


GO

