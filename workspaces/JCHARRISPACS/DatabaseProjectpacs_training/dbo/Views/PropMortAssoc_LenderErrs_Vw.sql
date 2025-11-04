

CREATE VIEW  PropMortAssoc_LenderErrs_Vw
AS
SELECT lenderNo, errMsg, COUNT(errMsg) AS ErrCount
FROM PropMortAssoc_Errors_Vw
GROUP BY lenderNo, errMsg

GO

