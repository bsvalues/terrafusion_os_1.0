


CREATE VIEW dbo.MortgageTaxserverVw
AS
SELECT mortgage_co.mortgage_co_id, 
    DistinctTaxserversVw.taxserver_cd, 
    DistinctTaxserversVw.file_as_name AS TaxserverFileAsName
FROM DistinctTaxserversVw INNER JOIN
    mortgage_co ON 
    DistinctTaxserversVw.taxserver_id = mortgage_co.taxserver_id

GO

