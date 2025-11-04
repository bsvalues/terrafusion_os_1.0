

CREATE VIEW PropMortAssoc_GeoIDMatches_Vw
AS
SELECT PropMortAssoc_GeoID_Vw.parcelID AS GeoID, 
    PropMortAssoc_GeoID_Vw.lenderNo, 
    PropMortAssoc_GeoID_Vw.loanID, 
    PropMortAssoc_GeoID_Vw.propID, 
    PropMortAssoc_GeoID_Vw.mortID, 
    TaxserverAndMortgages_Vw.taxserver_cd, 
    TaxserverAndMortgages_Vw.TaxserverFileAsName, 
    TaxserverAndMortgages_Vw.MortgageFileAsName
FROM PropMortAssoc_GeoID_Vw INNER JOIN
    TaxserverAndMortgages_Vw ON 
    PropMortAssoc_GeoID_Vw.mortID = TaxserverAndMortgages_Vw.mortgage_co_id
WHERE (PropMortAssoc_GeoID_Vw.propID IS NOT NULL) AND 
    (PropMortAssoc_GeoID_Vw.mortID IS NOT NULL)

GO

