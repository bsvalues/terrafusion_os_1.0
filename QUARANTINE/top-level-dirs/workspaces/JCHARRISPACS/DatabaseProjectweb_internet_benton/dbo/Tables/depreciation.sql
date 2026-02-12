CREATE TABLE [dbo].[depreciation] (
    [type_cd]      CHAR (10)    NOT NULL,
    [deprec_cd]    CHAR (10)    NOT NULL,
    [year]         NUMERIC (4)  NOT NULL,
    [prop_type_cd] CHAR (5)     NOT NULL,
    [description]  VARCHAR (50) NULL,
    [pp_type_cd]   AS           (case when [prop_type_cd]='P' then [type_cd]  end),
    [dor_schedule] VARCHAR (25) NULL,
    CONSTRAINT [CPK_depreciation] PRIMARY KEY CLUSTERED ([type_cd] ASC, [deprec_cd] ASC, [year] ASC, [prop_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_type_cd]
    ON [dbo].[depreciation]([prop_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

