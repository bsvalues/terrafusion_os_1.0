from datetime import datetime

from indoorsdatapy.common.time_util import TimeContext
from pandas import read_sql, to_datetime
from sqlalchemy import create_engine


def validate(date_text):
    try:
        datetime.datetime.strptime(date_text, "%Y-%m-%d %H:%M:%S.%f")
        return True
    except:
        return False


def convert_dates(df, epoch=datetime(1970, 1, 1)):
    convert = df.select_dtypes(
        include=["datetime64[ns]", "datetime64[ns, UTC]"])
    for column in convert.columns:
        df[column] = df[column].apply(to_datetime).map(
            lambda dt: (dt.replace(tzinfo=None) - epoch).total_seconds())
    return df


def convert_dates_sqlite(df):
    column = ('recording_date', 'start_date', 'end_date', 'creation_date',
              'start_time', 'end_time', 'creation_time')
    for dtyp in column:
        if dtyp in df.columns:
            df[dtyp] = to_datetime(df[dtyp], infer_datetime_format=True)
    return df


def sql2df(db_url, tables=None, queries=None):
    """Create data transfer object using SQL statements.

    :param db_url: database url to fetch data from
    :param tables: list of tables to fetch data from
    :param queries: dictionary of SQL queries to execute
    :return: dict of pandas df
    """

    sql = True if 'sqlite' in db_url else False
    engine = create_engine(db_url)
    tables = tables or engine.table_names()
    queries = queries or {table: None for table in tables}
    mapping = dict()
    for table, query in queries.items():
        with TimeContext(table):
            if sql:
                mapping[table] = convert_dates(
                    convert_dates_sqlite(read_sql(query or table, engine)))
            else:
                mapping[table] = convert_dates(read_sql(query or table, engine))

    return mapping


def dto2sql(access, db_url):
    """Insert data transfer object into SQL database.

    :param dto: data transfer object to insert
    :param db_url: url of database to insert data into
    """
    engine = create_engine(db_url)
    for key, frame in access.items():
        frame.to_sql(key, engine, index=False, if_exists="replace")
