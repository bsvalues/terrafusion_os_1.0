

CREATE VIEW TaxserverAndMortgages_Vw
AS
SELECT DistinctTaxserversVw.taxserver_id, 
    DistinctTaxserversVw.taxserver_cd, 
    DistinctTaxserversVw.file_as_name AS TaxserverFileAsName, 
    TaxserverMortgagesVw.mortgage_co_id, 
    TaxserverMortgagesVw.file_as_name AS MortgageFileAsName
FROM DistinctTaxserversVw RIGHT OUTER JOIN
    TaxserverMortgagesVw ON 
    DistinctTaxserversVw.taxserver_id = TaxserverMortgagesVw.taxserver_id

GO

