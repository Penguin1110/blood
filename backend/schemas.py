from datetime import date, datetime, time

from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    name: str
    gender: str
    birthday: date
    blood_type: str
    phone: str
    email: str
    password: str
    weight: float | None = None
    location: str | None = None
    drugs_record: str | None = None

class UserUpdate(BaseModel):
    name: str | None = None
    gender: str | None = None
    birthday: date | None = None
    blood_type: str | None = None
    phone: str | None = None
    email: str | None = None
    password: str | None = None

    
class User(BaseModel):
    donor_id: int
    name: str
    gender: str
    birthday: date
    blood_type: str
    phone: str
    email: str
    last_date: date | None = None


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
    address: str
    category: str


class DonationSite(BaseModel):
    site_id: int
    loca_name: str
    address: str
    open_time: time
    category: str


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


class Donation(DonationRecord):
    pass


class Reward(Gift):
    pass
