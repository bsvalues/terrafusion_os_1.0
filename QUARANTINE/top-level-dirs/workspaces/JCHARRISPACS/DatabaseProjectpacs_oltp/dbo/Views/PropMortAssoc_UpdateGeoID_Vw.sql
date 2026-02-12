

CREATE VIEW dbo.PropMortAssoc_UpdateGeoID_Vw
AS
SELECT PropMortAssoc_GeoID_Vw.propID, 
    PropMortAssoc_GeoID_Vw.mortID, 
    PropMortAssoc_GeoID_Vw.lenderNo, 
    PropMortAssoc_GeoID_Vw.parcelID AS geoID, 
    PropertyMortgageAssocVw.mortgage_acct_id, 
    PropertyMortgageAssocVw.MortgageFileAsName, 
    PropertyMortgageAssocVw.taxserver_cd, 
    PropertyMortgageAssocVw.TaxserverFileAsName
FROM PropertyMortgageAssocVw INNER JOIN
    PropMortAssoc_GeoID_Vw ON 
    PropertyMortgageAssocVw.prop_id = PropMortAssoc_GeoID_Vw.propID
     AND 
    PropertyMortgageAssocVw.mortgage_co_id = PropMortAssoc_GeoID_Vw.mortID
     AND 
    PropertyMortgageAssocVw.mortgage_acct_id = PropMortAssoc_GeoID_Vw.loanID
WHERE (PropMortAssoc_GeoID_Vw.propID IS NOT NULL) AND 
    (PropMortAssoc_GeoID_Vw.mortID IS NOT NULL)

GO

