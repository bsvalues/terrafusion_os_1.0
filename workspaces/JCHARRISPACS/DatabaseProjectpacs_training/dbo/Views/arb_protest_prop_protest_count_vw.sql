
create view dbo.arb_protest_prop_protest_count_vw
with schemabinding
as

select prop_id, prop_val_yr, count_big(*) as protest_count
from dbo._arb_protest
group by prop_id, prop_val_yr

GO

CREATE UNIQUE CLUSTERED INDEX [idx_arb_protest_prop_protest_count_vw]
    ON [dbo].[arb_protest_prop_protest_count_vw]([prop_id] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 90);


GO

