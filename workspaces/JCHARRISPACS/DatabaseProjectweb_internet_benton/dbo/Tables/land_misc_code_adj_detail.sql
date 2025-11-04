CREATE TABLE [dbo].[land_misc_code_adj_detail] (
    [sched_id]      INT           NOT NULL,
    [year]          NUMERIC (4)   NOT NULL,
    [element_type]  VARCHAR (15)  NOT NULL,
    [element_value] VARCHAR (255) NOT NULL,
    [misc_cd]       AS            (CONVERT([varchar](6),case when [element_type]='Code' then [element_value]  end,(0))),
    CONSTRAINT [CPK_land_misc_code_adj_detail] PRIMARY KEY CLUSTERED ([sched_id] ASC, [year] ASC, [element_type] ASC)
);


GO

