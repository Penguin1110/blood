from datetime import datetime, time, timedelta
from math import cos, radians, asin, sin, sqrt
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Query

from database import fetch_all
from schemas import DonationSite, DonationSiteNearby

router = APIRouter(prefix="/sites", tags=["sites"])


def haversine_distance_km(
    user_latitude: float,
    user_longitude: float,
    site_latitude: float,
    site_longitude: float,
) -> float:
    """
    使用 Haversine Formula 計算兩個經緯度座標之間的球面距離。
    回傳單位：公里。
    """
    earth_radius_km = 6371.0

    lat1 = radians(user_latitude)
    lon1 = radians(user_longitude)
    lat2 = radians(site_latitude)
    lon2 = radians(site_longitude)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
    )
    c = 2 * asin(sqrt(a))

    return earth_radius_km * c


def parse_open_days(open_days: str | None) -> set[int] | None:
    """
    open_days 格式：
    - None 或空字串：代表每天開放
    - '1,2,3,4,5'：代表週一到週五
    Python datetime.isoweekday():
    - 1 = Monday
    - 7 = Sunday
    """
    if not open_days:
        return None

    days = set()

    for item in open_days.split(","):
        item = item.strip()
        if not item:
            continue

        try:
            day = int(item)
        except ValueError:
            continue

        if 1 <= day <= 7:
            days.add(day)

    return days if days else None


def check_is_open(
    open_time: time | None,
    close_time: time | None,
    open_days: str | None,
    now: datetime | None = None,
) -> bool:
    """
    判斷據點目前是否開放。

    規則：
    1. 沒有 open_time 或 close_time，無法判斷，視為未開放。
    2. open_days 為 NULL，代表每天開放。
    3. 支援跨日營業，例如 22:00 - 02:00。
    """
    if open_time is None or close_time is None:
        return False

    current_time = now or datetime.now()
    current_weekday = current_time.isoweekday()
    current_clock = current_time.time()

    available_days = parse_open_days(open_days)

    if available_days is not None and current_weekday not in available_days:
        return False

    if open_time <= close_time:
        return open_time <= current_clock <= close_time

    return current_clock >= open_time or current_clock <= close_time


def build_navigation_url(address: str) -> str:
    """
    產生 Google Maps 搜尋連結。
    前端可直接讓使用者點擊導航。
    """
    encoded_address = quote(address)
    return f"https://www.google.com/maps/search/?api=1&query={encoded_address}"


def _to_time(v) -> time | None:
    if v is None:
        return None
    if isinstance(v, timedelta):
        total = int(v.total_seconds())
        h, rem = divmod(total, 3600)
        m, s = divmod(rem, 60)
        return time(h % 24, m, s)
    return v


def site_row_to_response(row: dict, distance_km: float | None = None) -> dict:
    open_time = _to_time(row.get("open_time"))
    close_time = _to_time(row.get("close_time"))

    is_open = check_is_open(
        open_time,
        close_time,
        row.get("open_days"),
    )

    result = {
        "site_id": row["site_id"],
        "loca_name": row["loca_name"],
        "address": row["address"],
        "open_time": open_time,
        "close_time": close_time,
        "open_days": row.get("open_days"),
        "category": row.get("category"),
        "latitude": float(row["latitude"]) if row.get("latitude") is not None else None,
        "longitude": float(row["longitude"]) if row.get("longitude") is not None else None,
        "is_open": is_open,
        "navigation_url": build_navigation_url(row["address"]),
    }

    if distance_km is not None:
        result["distance_km"] = round(distance_km, 2)
    else:
        result["distance_km"] = None

    return result


@router.get("", response_model=list[DonationSite])
def list_sites():
    """
    讀取所有捐血站與捐血車資料。
    """
    return fetch_all(
        """
        SELECT
            site_id,
            loca_name,
            address,
            latitude,
            longitude,
            open_time,
            close_time,
            open_days,
            category
        FROM donation_site
        ORDER BY site_id
        """
    )


@router.get("/open", response_model=list[DonationSiteNearby])
def list_open_sites():
    """
    查詢目前開放中的捐血據點。
    """
    rows = fetch_all(
        """
        SELECT
            site_id,
            loca_name,
            address,
            latitude,
            longitude,
            open_time,
            close_time,
            open_days,
            category
        FROM donation_site
        ORDER BY site_id
        """
    )

    results = []

    for row in rows:
        site = site_row_to_response(row)
        if site["is_open"]:
            results.append(site)

    return results


@router.get("/nearby", response_model=list[DonationSiteNearby])
def search_nearby_sites(
    latitude: float = Query(..., ge=-90, le=90, description="使用者目前緯度"),
    longitude: float = Query(..., ge=-180, le=180, description="使用者目前經度"),
    radius_km: float = Query(5.0, gt=0, le=100, description="搜尋半徑，單位公里"),
    open_only: bool = Query(False, description="是否只顯示目前開放中的據點"),
    category: str | None = Query(None, description="捐血站或捐血車"),
):
    """
    根據使用者定位查詢附近捐血據點。

    Example:
    /sites/nearby?latitude=25.033964&longitude=121.564468&radius_km=5&open_only=true
    """
    # Bounding box pre-filter: 1° latitude ≈ 111.32 km
    lat_delta = radius_km / 111.32
    lon_delta = radius_km / (111.32 * cos(radians(latitude)))
    lat_min, lat_max = latitude - lat_delta, latitude + lat_delta
    lon_min, lon_max = longitude - lon_delta, longitude + lon_delta

    conditions = [
        "latitude BETWEEN %s AND %s",
        "longitude BETWEEN %s AND %s",
    ]
    params: list = [lat_min, lat_max, lon_min, lon_max]

    if category:
        conditions.append("category = %s")
        params.append(category)

    where_clause = "WHERE " + " AND ".join(conditions)

    rows = fetch_all(
        f"""
        SELECT
            site_id,
            loca_name,
            address,
            latitude,
            longitude,
            open_time,
            close_time,
            open_days,
            category
        FROM donation_site
        {where_clause}
        """,
        tuple(params),
    )

    results = []

    for row in rows:
        if row.get("latitude") is None or row.get("longitude") is None:
            continue

        distance_km = haversine_distance_km(
            latitude,
            longitude,
            float(row["latitude"]),
            float(row["longitude"]),
        )

        if distance_km > radius_km:
            continue

        site = site_row_to_response(row, distance_km=distance_km)

        if open_only and not site["is_open"]:
            continue

        results.append(site)

    results.sort(key=lambda item: item["distance_km"])

    if not results:
        raise HTTPException(
            status_code=404,
            detail="找不到符合條件的捐血據點",
        )

    return results
