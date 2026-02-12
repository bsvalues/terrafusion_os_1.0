CREATE TABLE [dbo].[land_sched_current_use] (
    [ls_id]         INT             NOT NULL,
    [ls_year]       NUMERIC (4)     NOT NULL,
    [soil_type_cd]  VARCHAR (10)    NOT NULL,
    [calculate]     BIT             NOT NULL,
    [rental_rate]   NUMERIC (10, 2) NULL,
    [cap_rate]      NUMERIC (10, 2) NULL,
    [rate_per_acre] NUMERIC (10, 2) NULL,
    CONSTRAINT [CPK_land_sched_current_use] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [soil_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CUQ_land_sched_current_use_ls_year_soil_type_cd] UNIQUE NONCLUSTERED ([ls_year] ASC, [soil_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

