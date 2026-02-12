

CREATE VIEW PropMortAssoc_PropIDMatches_Vw
AS
SELECT PropMortAssoc_PropID_Vw.lenderNo, 
    PropMortAssoc_PropID_Vw.loanID, 
    PropMortAssoc_PropID_Vw.propID, 
    PropMortAssoc_PropID_Vw.mortID, 
    TaxserverAndMortgages_Vw.taxserver_cd, 
    TaxserverAndMortgages_Vw.TaxserverFileAsName, 
    TaxserverAndMortgages_Vw.MortgageFileAsName
FROM PropMortAssoc_PropID_Vw INNER JOIN
    TaxserverAndMortgages_Vw ON 
    PropMortAssoc_PropID_Vw.mortID = TaxserverAndMortgages_Vw.mortgage_co_id
WHERE (PropMortAssoc_PropID_Vw.propID IS NOT NULL) AND 
    (PropMortAssoc_PropID_Vw.mortID IS NOT NULL)

GO

