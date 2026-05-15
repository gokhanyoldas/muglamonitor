#!/usr/bin/env python3
"""
Muğla Monitör — Günlük Tarihsel Snapshot Scripti (Madde 5)
Çalışma zamanı: Her gün 22:00 Istanbul (via SureThing cron task)

Toplanan metrikler:
- Hava: sıcaklık, nem, rüzgar, UV
- Sosyal medya: günlük post sayısı, duygu dağılımı
- Ekonomi: işsizlik oranı (statik/haftalık güncelleme)
- Çevre: AQI, PM2.5, PM10
"""

import os
import json
import httpx
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wivooargsmcwbiokpklu.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

ISTANBUL = ZoneInfo("Europe/Istanbul")
TODAY = datetime.now(ISTANBUL).date()

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}


def upsert_snapshots(rows: list[dict]) -> None:
    """Upsert rows into historical_snapshots (idempotent)."""
    if not rows:
        return
    res = httpx.post(
        f"{SUPABASE_URL}/rest/v1/historical_snapshots",
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=rows,
        timeout=15,
    )
    if res.status_code not in (200, 201):
        print(f"[WARN] upsert failed: {res.status_code} {res.text[:200]}")
    else:
        print(f"[OK]   upserted {len(rows)} rows for {TODAY}")


def snapshot_weather() -> list[dict]:
    """Fetch current weather from data-scrape edge function."""
    try:
        res = httpx.get(
            f"{SUPABASE_URL}/functions/v1/data-scrape?type=weather",
            headers={"apikey": SUPABASE_SERVICE_KEY},
            timeout=20,
        )
        d = res.json()
        rows = []
        for key, unit in [
            ("temperature", "°C"),
            ("windspeed", "km/h"),
            ("humidity", "%"),
            ("uv_index", ""),
            ("sea_temp", "°C"),
        ]:
            val = d.get(key)
            if val is not None:
                rows.append({
                    "snapshot_date": str(TODAY),
                    "category": "weather",
                    "metric_key": key,
                    "value_num": float(val),
                    "unit": unit,
                    "source": "open-meteo",
                })
        condition = d.get("condition")
        if condition:
            rows.append({
                "snapshot_date": str(TODAY),
                "category": "weather",
                "metric_key": "condition",
                "value_text": condition,
                "source": "open-meteo",
            })
        return rows
    except Exception as e:
        print(f"[WARN] weather snapshot failed: {e}")
        return []


def snapshot_air_quality() -> list[dict]:
    """Fetch current AQI from data-scrape edge function."""
    try:
        res = httpx.get(
            f"{SUPABASE_URL}/functions/v1/data-scrape?type=air_quality",
            headers={"apikey": SUPABASE_SERVICE_KEY},
            timeout=20,
        )
        d = res.json()
        rows = []
        for key, unit in [("aqi", ""), ("pm25", "μg/m³"), ("pm10", "μg/m³"), ("no2", "μg/m³")]:
            val = d.get(key)
            if val is not None:
                rows.append({
                    "snapshot_date": str(TODAY),
                    "category": "environment",
                    "metric_key": key,
                    "value_num": float(val),
                    "unit": unit,
                    "source": "open-meteo-aq",
                })
        return rows
    except Exception as e:
        print(f"[WARN] air quality snapshot failed: {e}")
        return []


def snapshot_social() -> list[dict]:
    """Aggregate today's social posts from social_posts table."""
    try:
        today_str = str(TODAY)
        res = httpx.get(
            f"{SUPABASE_URL}/rest/v1/social_posts"
            f"?select=sentiment&published_at=gte.{today_str}T00:00:00Z",
            headers=HEADERS,
            timeout=15,
        )
        posts = res.json() if res.status_code == 200 else []
        total = len(posts)
        pos = sum(1 for p in posts if p.get("sentiment") == "positive")
        neg = sum(1 for p in posts if p.get("sentiment") == "negative")
        neu = sum(1 for p in posts if p.get("sentiment") == "neutral")
        rows = [
            {"snapshot_date": today_str, "category": "social", "metric_key": "post_count", "value_num": total, "unit": "adet", "source": "db"},
            {"snapshot_date": today_str, "category": "social", "metric_key": "post_positive", "value_num": pos, "unit": "adet", "source": "db"},
            {"snapshot_date": today_str, "category": "social", "metric_key": "post_negative", "value_num": neg, "unit": "adet", "source": "db"},
            {"snapshot_date": today_str, "category": "social", "metric_key": "post_neutral",  "value_num": neu, "unit": "adet", "source": "db"},
        ]
        if total > 0:
            rows.append({
                "snapshot_date": today_str, "category": "social",
                "metric_key": "positive_ratio",
                "value_num": round(pos / total * 100, 1),
                "unit": "%", "source": "db",
            })
        return rows
    except Exception as e:
        print(f"[WARN] social snapshot failed: {e}")
        return []


def snapshot_economy() -> list[dict]:
    """Fetch economy data from data-scrape edge function."""
    try:
        res = httpx.get(
            f"{SUPABASE_URL}/functions/v1/data-scrape?type=economy",
            headers={"apikey": SUPABASE_SERVICE_KEY},
            timeout=20,
        )
        d = res.json()
        rows = []
        for key, unit in [
            ("unemployment_rate", "%"),
            ("new_companies", "adet"),
            ("usd_try", "₺"),
            ("eur_try", "₺"),
        ]:
            val = d.get(key)
            if val is not None:
                rows.append({
                    "snapshot_date": str(TODAY),
                    "category": "economy",
                    "metric_key": key,
                    "value_num": float(val),
                    "unit": unit,
                    "source": "data-scrape",
                })
        return rows
    except Exception as e:
        print(f"[WARN] economy snapshot failed: {e}")
        return []


def main():
    print(f"[START] Günlük snapshot — {TODAY} ({datetime.now(ISTANBUL).strftime('%H:%M')} Istanbul)")

    all_rows: list[dict] = []
    all_rows.extend(snapshot_weather())
    all_rows.extend(snapshot_air_quality())
    all_rows.extend(snapshot_social())
    all_rows.extend(snapshot_economy())

    print(f"[INFO]  Toplam {len(all_rows)} metrik toplandı")
    upsert_snapshots(all_rows)

    print("[DONE]  Snapshot tamamlandı")


if __name__ == "__main__":
    main()
