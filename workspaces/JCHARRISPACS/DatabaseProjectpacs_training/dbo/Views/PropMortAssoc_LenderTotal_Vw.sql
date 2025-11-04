

CREATE VIEW  PropMortAssoc_LenderTotal_Vw
AS
SELECT lenderNo, COUNT(lenderNo) AS Total
FROM PropMortAssoc_data
GROUP BY lenderNo

GO

