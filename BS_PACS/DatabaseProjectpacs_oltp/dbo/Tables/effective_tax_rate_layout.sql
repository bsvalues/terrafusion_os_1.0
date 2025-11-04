CREATE TABLE [dbo].[effective_tax_rate_layout] (
    [tax_yr]         DECIMAL (5)    NOT NULL,
    [worksheet_num]  VARCHAR (10)   NOT NULL,
    [form_name]      VARCHAR (100)  NULL,
    [heading]        VARCHAR (500)  NULL,
    [description]    VARCHAR (1000) NULL,
    [field_name]     VARCHAR (50)   NULL,
    [formula]        VARCHAR (100)  NULL,
    [school_formula] VARCHAR (100)  NULL,
    CONSTRAINT [CPK_effective_tax_rate_layout] PRIMARY KEY CLUSTERED ([tax_yr] ASC, [worksheet_num] ASC) WITH (FILLFACTOR = 100)
);


GO

