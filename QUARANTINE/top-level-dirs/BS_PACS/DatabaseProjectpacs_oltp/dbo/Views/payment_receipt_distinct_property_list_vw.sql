create view [dbo].[payment_receipt_distinct_property_list_vw]
as 
select distinct payment_id, prop_id From payment_receipt_property_list_vw

GO

