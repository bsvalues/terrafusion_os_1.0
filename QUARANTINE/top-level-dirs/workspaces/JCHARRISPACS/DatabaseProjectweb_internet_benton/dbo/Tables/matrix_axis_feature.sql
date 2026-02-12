CREATE TABLE [dbo].[matrix_axis_feature] (
    [lYear]        NUMERIC (4)  NOT NULL,
    [szAxisCd]     VARCHAR (20) NOT NULL,
    [lAttributeID] INT          NOT NULL,
    CONSTRAINT [CPK_matrix_axis_feature] PRIMARY KEY CLUSTERED ([lYear] ASC, [szAxisCd] ASC) WITH (FILLFACTOR = 100)
);


GO

