

CREATE VIEW dbo.PropMortAssoc_UpdatePropID_Vw
AS
SELECT PropMortAssoc_PropID_Vw.propID, 
    PropMortAssoc_PropID_Vw.mortID, 
    PropMortAssoc_PropID_Vw.lenderNo, 
    PropMortAssoc_PropID_Vw.loanID, 
    PropertyMortgageAssocVw.MortgageFileAsName, 
    PropertyMortgageAssocVw.taxserver_cd, 
    PropertyMortgageAssocVw.TaxserverFileAsName
FROM PropertyMortgageAssocVw INNER JOIN
    PropMortAssoc_PropID_Vw ON 
    PropertyMortgageAssocVw.prop_id = PropMortAssoc_PropID_Vw.propID
     AND 
    PropertyMortgageAssocVw.mortgage_co_id = PropMortAssoc_PropID_Vw.mortID
     AND 
    PropertyMortgageAssocVw.mortgage_acct_id = PropMortAssoc_PropID_Vw.loanID
WHERE (PropMortAssoc_PropID_Vw.propID IS NOT NULL) AND 
    (PropMortAssoc_PropID_Vw.mortID IS NOT NULL)

GO

