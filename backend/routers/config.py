from typing import Annotated
from fastapi import APIRouter, Depends
from services.redmine_connector import RedmineConnector
from dependencies import get_connector

router = APIRouter()
ConnectorDep = Annotated[RedmineConnector, Depends(get_connector)]

_SETUP_STEPS = [
    ".env に REDMINE_BASE_URL を設定する",
    ".env に REDMINE_API_KEY を設定する",
    "Redmine の管理画面で REST API を有効にする",
    "Redmine の個人設定から API キーを取得する",
]


@router.get("/api/config")
async def get_config(connector: ConnectorDep) -> dict:
    connected = connector.is_connected
    return {
        "connected": connected,
        "mode": connector.mode,
        "base_url": connector.base_url,
        "missing": connector.missing,
        "diagnostics": _diagnostics(connected),
        "setup": _SETUP_STEPS,
    }


def _diagnostics(connected: bool) -> dict:
    if not connected:
        return {
            "category": "missing_config",
            "message": "Redmine 接続に必要な環境変数が不足しています。",
            "next_actions": [
                ".env に REDMINE_API_KEY を設定する",
                "Redmine で REST API を有効にする",
                "app service を再起動する",
            ],
        }
    return {
        "category": "ready",
        "message": "Redmine 接続設定は読み込まれています。",
        "next_actions": ["チケットが取得できない場合は API キー権限と REST API 有効化を確認する"],
    }
