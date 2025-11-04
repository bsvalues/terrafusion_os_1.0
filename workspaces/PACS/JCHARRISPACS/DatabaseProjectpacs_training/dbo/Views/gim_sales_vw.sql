
CREATE VIEW dbo.gim_sales_vw AS

SELECT
chg_of_owner_id AS sale_id,
monthly_income,
annual_income,
adjusted_sl_price AS sale_price,
CONVERT(numeric(18, 2), adjusted_sl_price / monthly_income) AS grm,
CONVERT(numeric(18, 2), adjusted_sl_price / annual_income) AS gim, 
sl_dt AS sale_date

FROM dbo.sale
WHERE (monthly_income > 0) AND (annual_income > 0) AND (adjusted_sl_price > 0)

GO

