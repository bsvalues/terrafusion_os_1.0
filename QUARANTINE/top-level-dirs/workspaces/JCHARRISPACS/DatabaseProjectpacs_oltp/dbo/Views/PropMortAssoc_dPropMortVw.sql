

CREATE VIEW PropMortAssoc_dPropMortVw
AS
SELECT PropMortAssoc_data.parcelID, 
    PropMortAssoc_data.lenderNo, 
    PropMortAssoc_dPropMort.dPropID, 
    PropMortAssoc_dPropMort.dMortID, 
    PropMortAssoc_dPropMort.dLoanID, 
    PropMortAssoc_dPropMort.NumPropMort, 
    TaxserverAndMortgages_Vw.taxserver_cd, 
    TaxserverAndMortgages_Vw.TaxserverFileAsName, 
    TaxserverAndMortgages_Vw.MortgageFileAsName
FROM PropMortAssoc_dPropMort INNER JOIN
    PropMortAssoc_data ON 
    PropMortAssoc_dPropMort.dRec = PropMortAssoc_data.recNo INNER
     JOIN
    TaxserverAndMortgages_Vw ON 
    PropMortAssoc_dPropMort.dMortID = TaxserverAndMortgages_Vw.mortgage_co_id

GO

