


CREATE VIEW dbo.PropertyMortgageAssocVw
AS
SELECT mortgage_assoc.prop_id, 
    mortgage_assoc.mortgage_co_id, 
    mortgage_assoc.mortgage_acct_id, 
    TaxserverMortgagesVw.file_as_name AS MortgageFileAsName, 
    DistinctTaxserversVw.taxserver_cd, 
    DistinctTaxserversVw.file_as_name AS TaxserverFileAsName
FROM mortgage_assoc INNER JOIN
    TaxserverMortgagesVw ON 
    mortgage_assoc.mortgage_co_id = TaxserverMortgagesVw.mortgage_co_id
     LEFT OUTER JOIN
    DistinctTaxserversVw ON 
    TaxserverMortgagesVw.taxserver_id = DistinctTaxserversVw.taxserver_id

GO

