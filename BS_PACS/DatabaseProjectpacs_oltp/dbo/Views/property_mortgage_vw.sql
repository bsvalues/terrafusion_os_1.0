
create view property_mortgage_vw
as

select acct_id, file_as_name, prop_id From mortgage_assoc, account
where mortgage_assoc.mortgage_co_id = account.acct_id

GO

