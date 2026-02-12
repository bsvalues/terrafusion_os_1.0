



CREATE VIEW dbo.VIT_SALES_VW
AS
SELECT pacs_user.pacs_user_name, vit_sales.vit_sales_id, 
    vit_sales.prop_id, vit_sales.year, vit_sales.month, 
    vit_sales.post_sales_date, vit_sales.filing_date, 
    vit_sales.total_sales, vit_sales.uptvf, vit_sales.uptv, 
    vit_sales.penalty, vit_sales.fines, vit_sales.amount_due, 
    vit_sales.override_penalty, vit_sales.override_amount_due, 
    vit_sales.comment, vit_sales.user_id, 
    vit_sales.num_units_sold, vit_sales.fleet_sales_amount, 
    vit_sales.dealer_sales_amount, 
    vit_sales.subsequent_sales_amount, 
    vit_sales.num_fleet_units, vit_sales.num_dealer_units, 
    vit_sales.num_subsequent_units, 
    vit_sales.net_inventory_sales_amount, 
    vit_sales.num_net_inventory_units
FROM pacs_user INNER JOIN
    vit_sales ON pacs_user.pacs_user_id = vit_sales.user_id

GO

