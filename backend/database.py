import os
from contextlib import contextmanager
from urllib.parse import urlparse

from dotenv import load_dotenv
import pymysql
from pymysql.cursors import DictCursor

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_database_url():
    return DATABASE_URL


def _parse_database_url():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")

    parsed = urlparse(DATABASE_URL)
    if parsed.scheme not in {"mysql", "mysql+pymysql"}:
        raise RuntimeError("DATABASE_URL must use mysql+pymysql://")

    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": parsed.username,
        "password": parsed.password,
        "database": parsed.path.lstrip("/"),
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
    }


@contextmanager
def get_connection():
    connection = pymysql.connect(**_parse_database_url())
    try:
        yield connection
    finally:
        connection.close()


def fetch_all(query, params=None):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()


def fetch_one(query, params=None):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
