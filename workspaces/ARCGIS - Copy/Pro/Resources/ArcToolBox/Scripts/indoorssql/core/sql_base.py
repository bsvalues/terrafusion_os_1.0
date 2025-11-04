import inspect
import os
from logging import getLogger

from sqlalchemy import create_engine
from sqlalchemy import func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.sql import text

logger = getLogger(__name__)


class SqlException(Exception):
    """Sql error"""


class SqlExporter(object):

    def __init__(self, db_url):
        """
        Base class for selecting data from database
        :param db_url: str
            connection string of sql db
        """
        self._engine = create_engine(db_url)
        Session = sessionmaker(bind=self._engine)
        self._conn = self._engine.connect()
        self.session = Session()

    def _run_sql(self, query, params=None):
        sql = text(query)
        if params is None:
            return self._conn.execute(sql)
        return self._conn.execute(sql, params)

    def __del__(self):
        self._conn.close()


class SqlBase(object):

    def __init__(self, db_path, sql_base):
        """
        Base class of inserting data to sql database
        :param db_path:
        :param sql_base:
        """
        if os.path.exists(db_path):
            os.remove(db_path)
        engine = create_engine(url=db_path, poolclass=NullPool)
        logger.info('Creating sql engine...')
        sql_base.metadata.create_all(engine)
        sql_base.metadata.bind = engine
        Session = sessionmaker(bind=engine)
        logger.info('Creating session...')
        self.session = Session()
        self.conn = engine.connect()

    def run(self, exclude=None):
        """
        All child methods with prefix "add_" are executed.
        :param exclude:
        :return:
        """
        exclude = exclude or []
        f = inspect.getmembers(self, predicate=inspect.ismethod)
        for fname, fnc in f:
            if fname.startswith('add_'):
                if fname.replace('add_', '') in exclude:
                    continue
                logger.info('Constructing sql table < %s >' % fname)
                fnc()

        self.session.close()

    def commit(self):
        self.session.commit()

    def _run_sql(self, query, params=None):
        sql = text(query)
        if params is None:
            return self.conn.execute(sql)
        return self.conn.execute(sql, params)

    def get_last_id(self, table_column_obj):
        _id = self.session.query(func.max(table_column_obj)).scalar()
        return _id if _id else 0

    def __del__(self):
        self.conn.close()
