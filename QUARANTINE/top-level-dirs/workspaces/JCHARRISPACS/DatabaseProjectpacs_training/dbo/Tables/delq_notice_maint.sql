CREATE TABLE [dbo].[delq_notice_maint] (
    [comment]     VARCHAR (500) NULL,
    [real_yr]     NUMERIC (4)   NULL,
    [mobile_yr]   NUMERIC (4)   NULL,
    [mineral_yr]  NUMERIC (4)   NULL,
    [personal_yr] NUMERIC (4)   NULL,
    [auto_yr]     NUMERIC (4)   NULL,
    [lKey]        INT           IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_delq_notice_maint] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

