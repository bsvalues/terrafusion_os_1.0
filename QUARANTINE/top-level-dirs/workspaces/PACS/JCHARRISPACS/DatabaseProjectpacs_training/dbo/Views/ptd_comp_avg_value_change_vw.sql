

CREATE VIEW ptd_comp_avg_value_change_vw

AS

select
isnull(rtrim(arb_set_prev_value), '') AS arb_set_prev_value,
isnull(rtrim(prev_category), '') AS prev_category,
isnull(rtrim(curr_category), '') AS curr_category,
IsNull(rtrim(cast(prop_id AS varchar(50))), '') as prop_id,
IsNull(rtrim(cast(prev_market_value AS varchar(50))), '') as prev_market_value,
IsNull(rtrim(cast(curr_market_value AS varchar(50))), '') as curr_market_value,
IsNull(rtrim(cast(new_value AS varchar(50))), '') as new_value,
isnull(rtrim(prev_partial_comp), '') AS prev_partial_comp,
IsNull(rtrim(cast(sale_price as varchar(50))), '') as sale_price,
IsNull(rtrim(convert(varchar(50), sale_dt, 101)), '') as sale_dt,
isnull(rtrim(legal_desc), '') AS legal_desc,
isnull(rtrim(entity_cd), '')  AS entity_cd,
isnull(rtrim(deed_type), '')  AS deed_type,
isnull(rtrim(sale_type), '')  AS sale_type
from ptd_comp_avg_value_change

GO

