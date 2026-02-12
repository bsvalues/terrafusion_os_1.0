

CREATE VIEW PropMortAssoc_Errors_Vw
AS
SELECT PropMortAssoc_ErrMsgs.errMsg, 
    PropMortAssoc_errors.datRec,
    PropMortAssoc_data.parcelID,
    PropMortAssoc_data.lenderNo, 
    PropMortAssoc_data.loanID
FROM PropMortAssoc_errors INNER JOIN
    PropMortAssoc_data ON 
    PropMortAssoc_errors.datRec = PropMortAssoc_data.recNo INNER
     JOIN
    PropMortAssoc_ErrMsgs ON 
    PropMortAssoc_errors.errType = PropMortAssoc_ErrMsgs.errCode

GO

