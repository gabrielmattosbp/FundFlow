from supabase import create_client, Client

from app.config import settings


class SupabaseClient:
    """Lazy proxy — creates the client on first attribute access."""

    _instance: Client | None = None

    def _get(self) -> Client:
        if self._instance is None:
            self._instance = create_client(
                settings.supabase_url,
                settings.supabase_service_key,
            )
        return self._instance

    def __getattr__(self, name: str):
        return getattr(self._get(), name)


supabase = SupabaseClient()
