

CREATE VIEW PropMortAssoc_LenderGeoID_Vw
AS
SELECT PropMortAssoc_LenderTotal_Vw.lenderNo, 
    PropMortAssoc_LenderTotal_Vw.Total, 
    PropMortAssoc_LenderMatchesGeoID_Vw.Matches, 
    PropMortAssoc_LenderErrs_Vw.ErrCount, 
    PropMortAssoc_LenderErrs_Vw.errMsg, 
    TaxserverAndMortgages_Vw.taxserver_cd, 
    TaxserverAndMortgages_Vw.TaxserverFileAsName, 
    TaxserverAndMortgages_Vw.MortgageFileAsName
FROM TaxserverAndMortgages_Vw INNER JOIN
    mortgage_co ON 
    TaxserverAndMortgages_Vw.mortgage_co_id = mortgage_co.mortgage_co_id
     RIGHT OUTER JOIN
    PropMortAssoc_LenderTotal_Vw LEFT OUTER JOIN
    PropMortAssoc_LenderMatchesGeoID_Vw ON 
    PropMortAssoc_LenderTotal_Vw.lenderNo = PropMortAssoc_LenderMatchesGeoID_Vw.lenderNo
     LEFT OUTER JOIN
    PropMortAssoc_LenderErrs_Vw ON 
    PropMortAssoc_LenderTotal_Vw.lenderNo = PropMortAssoc_LenderErrs_Vw.lenderNo
     ON 
    mortgage_co.lender_num = PropMortAssoc_LenderTotal_Vw.lenderNo

GO

