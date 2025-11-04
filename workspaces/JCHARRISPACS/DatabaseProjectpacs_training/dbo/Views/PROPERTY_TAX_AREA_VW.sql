
CREATE VIEW [dbo].[PROPERTY_TAX_AREA_VW]
AS
SELECT property_tax_area.prop_id, property_tax_area.[year], 
property_tax_area.sup_num, tax_area.tax_area_number, 
tax_area.tax_area_description, tax_area.tax_area_state, tax_area.tax_area_id
    
FROM property_tax_area INNER JOIN
    tax_area ON 
    property_tax_area.tax_area_id = tax_area.tax_area_id

GO

