CREATE TABLE [dbo].[matrix_label] (
    [matrix_yr]   NUMERIC (4)  NOT NULL,
    [label_cd]    VARCHAR (20) NOT NULL,
    [label_desc]  VARCHAR (50) NULL,
    [matrix_type] VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_matrix_label] PRIMARY KEY CLUSTERED ([matrix_yr] ASC, [label_cd] ASC, [matrix_type] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_matrix_label_label_cd] CHECK ([label_cd]='BR' OR [label_cd]='AF' OR [label_cd]='DEPR' OR [label_cd]='FEATURE_UC' OR [label_cd]='LAND_INF' OR [label_cd]='MOD' OR [label_cd]='MOD_W_F_UNIT' OR [label_cd]='UC')
);


GO

