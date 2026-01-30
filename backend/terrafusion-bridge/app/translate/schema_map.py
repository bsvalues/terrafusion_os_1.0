
class PacsSchema:
    """
    The 'Likely Truth' Schema for WA State Assessment Systems (ProVal Standard).
    Edit this file only when live connection reveals different column names.
    """
    
    # 1. IDENTITY TABLE (The Parcel)
    TABLE_REAL_PROP = "real_prop"        # Standard table name
    COL_PARCEL_ID   = "parcel_no"        # The human-readable PIN (e.g. 1-2345-600)
    COL_PROP_ID     = "prop_id"          # The internal SQL primary key
    COL_SITUS       = "situs_display"    # The physical address
    COL_LEGAL       = "legal_desc"       # The legal text
    COL_NBHD        = "nbhd_code"        # Neighborhood code

    # 2. VALUATION TABLE (The Money)
    TABLE_VALUATION = "value_hist"       # Standard valuation history
    COL_TAX_YEAR    = "tax_year"
    COL_LAND_VAL    = "mkt_land"
    COL_IMP_VAL     = "mkt_imp"
    COL_TOTAL_VAL   = "mkt_total"

    # 3. TAXATION TABLE (The Levy)
    TABLE_TAX       = "tax_receiv"       # Tax receivable/levy
    COL_TAX_AMT     = "tax_total"
    COL_LEVY_CODE   = "levy_code"

# PARAMETERIZED QUERIES (SQL Injection Safe)
SQL_GET_PARCEL = f"""
    SELECT TOP 1 
        {PacsSchema.COL_PARCEL_ID}, 
        {PacsSchema.COL_PROP_ID}, 
        {PacsSchema.COL_SITUS}, 
        {PacsSchema.COL_LEGAL},
        {PacsSchema.COL_NBHD}
    FROM {PacsSchema.TABLE_REAL_PROP} 
    WHERE {PacsSchema.COL_PARCEL_ID} = ?
"""

SQL_GET_VALUATION = f"""
    SELECT TOP 1
        {PacsSchema.COL_LAND_VAL},
        {PacsSchema.COL_IMP_VAL},
        {PacsSchema.COL_TOTAL_VAL}
    FROM {PacsSchema.TABLE_VALUATION}
    WHERE {PacsSchema.COL_PROP_ID} = ? 
    AND {PacsSchema.COL_TAX_YEAR} = ?
"""
