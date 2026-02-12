CREATE TABLE [dbo].[land_sched_soil_detail] (
    [ls_id]          INT             NOT NULL,
    [ls_year]        NUMERIC (4)     NOT NULL,
    [land_soil_code] CHAR (10)       NOT NULL,
    [calculate_rate] BIT             NOT NULL,
    [rental_rate]    NUMERIC (18, 4) NOT NULL,
    [cap_rate]       NUMERIC (18, 4) NOT NULL,
    [rate_per_acre]  NUMERIC (6, 2)  NOT NULL,
    CONSTRAINT [CPK_land_sched_soil_detail] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [land_soil_code] ASC) WITH (FILLFACTOR = 90)
);


GO

