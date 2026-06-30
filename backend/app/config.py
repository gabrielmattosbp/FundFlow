from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24h

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # SMTP (email)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_tls: bool = True
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@fundflow.app"

    # Public URL (for reset links)
    app_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
