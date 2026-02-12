

CREATE VIEW PropMortAssoc_LenderPropID_Vw
AS
SELECT PropMortAssoc_LenderTotal_Vw.lenderNo, 
    PropMortAssoc_LenderTotal_Vw.Total, 
    PropMortAssoc_LenderErrs_Vw.ErrCount, 
    PropMortAssoc_LenderErrs_Vw.errMsg, 
    PropMortAssoc_LenderMatchesPropID_Vw.Matches, 
    TaxserverAndMortgages_Vw.taxserver_cd, 
    TaxserverAndMortgages_Vw.TaxserverFileAsName, 
    TaxserverAndMortgages_Vw.MortgageFileAsName
FROM PropMortAssoc_LenderErrs_Vw RIGHT OUTER JOIN
    PropMortAssoc_LenderMatchesPropID_Vw RIGHT OUTER JOIN
    PropMortAssoc_LenderTotal_Vw ON 
    PropMortAssoc_LenderMatchesPropID_Vw.lenderNo = PropMortAssoc_LenderTotal_Vw.lenderNo
     ON 
    PropMortAssoc_LenderErrs_Vw.lenderNo = PropMortAssoc_LenderTotal_Vw.lenderNo
     LEFT OUTER JOIN
    TaxserverAndMortgages_Vw INNER JOIN
    mortgage_co ON 
    TaxserverAndMortgages_Vw.mortgage_co_id = mortgage_co.mortgage_co_id
     ON 
    PropMortAssoc_LenderTotal_Vw.lenderNo = mortgage_co.lender_num

GO

