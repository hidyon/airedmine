from services.redmine_connector import RedmineConnector, create_connector

_connector: RedmineConnector | None = None


def get_connector() -> RedmineConnector:
    global _connector
    if _connector is None:
        _connector = create_connector()
    return _connector
