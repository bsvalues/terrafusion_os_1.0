

CREATE VIEW PropMortAssoc_GeoID_Vw AS
   SELECT PropMortAssoc_data.recNo,PropMortAssoc_data.parcelID, 
          PropMortAssoc_data.lenderNo, PropMortAssoc_data.loanID, 
          property.prop_id AS propID, mortgage_co.mortgage_co_id AS mortID
   FROM PropMortAssoc_data 
        LEFT OUTER JOIN property ON 
    	   ltrim(rtrim(PropMortAssoc_data.parcelID)) = ltrim(rtrim(property.geo_id)) 
        LEFT OUTER JOIN mortgage_co ON 
    	   PropMortAssoc_data.lenderNo = mortgage_co.lender_num

GO

