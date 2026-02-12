
create view dbo.arb_protest_protest_by_count_vw
with schemabinding
as

select prop_val_yr, case_id, count_big(*) as protest_by_count
from dbo._arb_protest_protest_by_assoc
group by prop_val_yr, case_id

GO

CREATE UNIQUE CLUSTERED INDEX [idx_arb_protest_protest_by_count_vw]
    ON [dbo].[arb_protest_protest_by_count_vw]([prop_val_yr] ASC, [case_id] ASC) WITH (FILLFACTOR = 90);


GO

