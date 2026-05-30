from datetime import date, datetime, time, timedelta
from typing import Literal

from pydantic import BaseModel, Field, field_validator

BloodType = Literal["A", "B", "AB", "O", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

class UserCreate(BaseModel):
    name: str
    nickname: str
    gender: str
    birthday: date
    blood_type: BloodType
    phone: str
    email: str
    password: str
    weight: float | None = None
    location: str | None = None
    drugs_record: str | None = None

class UserUpdate(BaseModel):
    name: str | None = None
    nickname: str | None = None
    gender: str | None = None
    birthday: date | None = None
    blood_type: BloodType | None = None
    phone: str | None = None
    email: str | None = None
    password: str | None = None
    spent_points: int | None = None


class User(BaseModel):
    donor_id: int
    name: str
    nickname: str | None = None
    gender: str
    birthday: date
    blood_type: BloodType
    phone: str
    email: str
    last_date: date | None = None
    spent_points: int = 0


class HistoryLog(BaseModel):
    log_id: int
    donor_id: int
    weight: float | None = None
    location: str | None = None
    drugs_record: str | None = None
    hold_points: int = 0
    recorded_at: datetime


class HistoryLogCreate(BaseModel):
    donor_id: int
    weight: float | None = None
    location: str | None = None
    drugs_record: str | None = None
    hold_points: int = 0


class HistoryLogUpdate(BaseModel):
    weight: float | None = None
    location: str | None = None
    drugs_record: str | None = None
    hold_points: int | None = None


class DonationRecord(BaseModel):
    record_id: int
    donor_id: int
    donation_date: date
    address: str | None = None
    category: str | None = None

class DonationRecordCreate(BaseModel):
    donor_id: int
    donation_date: date
    address: str | None = None
    category: str | None = None

class DonationRecordUpdate(BaseModel):
    donor_id: int | None = None
    donation_date: date | None = None
    address: str | None = None
    category: str | None = None

class DonationSite(BaseModel):
    site_id: int
    loca_name: str
    address: str
    latitude: float | None = None
    longitude: float | None = None
    open_time: time | None = None
    close_time: time | None = None
    open_days: str | None = None
    hours_note: str | None = None
    category: str | None = None

    @field_validator("open_time", "close_time", mode="before")
    @classmethod
    def coerce_timedelta_to_time(cls, v):
        if isinstance(v, timedelta):
            total = int(v.total_seconds())
            h, rem = divmod(total, 3600)
            m, s = divmod(rem, 60)
            return time(h % 24, m, s)
        return v


class DonationSiteNearby(DonationSite):
    is_open: bool
    navigation_url: str
    distance_km: float | None = None


class Gift(BaseModel):
    gift_id: int
    gift_item: str
    needed_points: int


class GiftCreate(BaseModel):
    gift_item: str = Field(min_length=1, max_length=100)
    needed_points: int = Field(ge=0)


class GiftUpdate(BaseModel):
    gift_item: str = Field(min_length=1, max_length=100)
    needed_points: int = Field(ge=0)


class Transportation(BaseModel):
    trans_id: int
    site_id: int
    location_id: int
    trans_type: str


class Search(BaseModel):
    donor_id: int
    site_id: int
    gift_id: int


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    message: str
    user: User


class Admin(BaseModel):
    admin_id: int
    username: str
    display_name: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    message: str
    admin: Admin


class Donation(DonationRecord):
    pass


class Reward(Gift):
    pass


class DonorRanking(BaseModel):
    rank: int
    donor_id: int
    nickname: str
    cumulative_points: int
    current_points: int
