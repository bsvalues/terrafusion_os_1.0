CREATE TABLE [dbo].[property_reet_mobile_home_imprv] (
    [reet_id]          INT             NOT NULL,
    [year]             NUMERIC (4)     NOT NULL,
    [sup_num]          INT             NOT NULL,
    [prop_id]          INT             NOT NULL,
    [imprv_id]         INT             NOT NULL,
    [mh_make]          VARCHAR (100)   NULL,
    [mh_model]         VARCHAR (100)   NULL,
    [mh_serial_number] VARCHAR (100)   NULL,
    [mh_year]          NUMERIC (4)     NULL,
    [length]           NUMERIC (18, 1) NULL,
    [width]            NUMERIC (18, 1) NULL,
    [included_in_sale] BIT             NULL,
    [value]            NUMERIC (14)    NULL,
    CONSTRAINT [CPK_property_reet_mobile_home_imprv] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [reet_id] ASC, [imprv_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_reet_mobile_home_imprv_year_sup_num_prop_id_reet_id] FOREIGN KEY ([year], [sup_num], [prop_id], [reet_id]) REFERENCES [dbo].[property_reet_assoc] ([year], [sup_num], [prop_id], [reet_id]) ON DELETE CASCADE
);


GO

