CREATE TABLE [dbo].[property_income_characteristic] (
    [year]                     NUMERIC (4)    NOT NULL,
    [sup_num]                  INT            NOT NULL,
    [prop_id]                  INT            NOT NULL,
    [pic_id]                   INT            NOT NULL,
    [type]                     INT            NOT NULL,
    [owner_occupied]           BIT            NOT NULL,
    [survey_date]              DATETIME       NULL,
    [situs]                    VARCHAR (150)  NULL,
    [contact_name]             VARCHAR (70)   NULL,
    [contact_phone]            VARCHAR (20)   NULL,
    [vacancy_rate]             NUMERIC (5, 2) NULL,
    [num_rooms]                NUMERIC (4)    NULL,
    [potential_gross_income]   NUMERIC (14)   NULL,
    [actual_gross_income]      NUMERIC (14)   NULL,
    [misc_income]              NUMERIC (14)   NULL,
    [comment]                  VARCHAR (500)  NULL,
    [unusual_income]           NUMERIC (14)   NULL,
    [unusual_expense]          NUMERIC (14)   NULL,
    [unusual_expense_reason]   VARCHAR (500)  NULL,
    [other_issues]             VARCHAR (500)  NULL,
    [total_num_units]          INT            NULL,
    [total_num_units_override] BIT            NOT NULL,
    [property_name]            VARCHAR (50)   NULL,
    [is_active]                BIT            NULL,
    CONSTRAINT [CPK_property_income_characteristic] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [pic_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_income_characteristic_year_sup_num_prop_id] FOREIGN KEY ([year], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

