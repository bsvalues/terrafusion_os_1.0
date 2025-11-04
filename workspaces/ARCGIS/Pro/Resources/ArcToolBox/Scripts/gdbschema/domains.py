def discover_values(
    path: str,
    field: str,
    unique: bool,
    key_field: str | None = None,
    key_value: int | None = None,
) -> list:
    """Discovers values in field to be used in a coded-value/range domain.

    Args:
        path: The catalog path to the table.
        field: The name of the field to find values.
        unique: Find unique values (True) or min/max (False).
        key_field: If specified, filter the table by this field.
        key_value: If specified, filter the table by this value.

    Returns
        list: The sorted values from the field.

    """
    import arcpy

    if unique:
        clauses = [("DISTINCT", None)]
    else:
        clauses = [(None, f"ORDER BY {field} {sort}") for sort in ("ASC", "DESC")]

    rows = []
    null = f"{field} IS NOT NULL"
    for clause in clauses:
        with arcpy.da.SearchCursor(
            path,
            field,
            where_clause=f"{key_field} = {key_value} AND {null}" if (key_field and key_value is not None) else null,
            sql_clause=clause,
        ) as cursor:
            if unique:
                rows = sorted(r for r, in cursor)
            else:
                try:
                    rows.append(next(cursor)[0])  # Only need the first for min (ASC) or max (DESC).
                except StopIteration:
                    continue
        del cursor

    return rows
