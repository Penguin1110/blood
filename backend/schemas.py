from datetime import date, datetime, time

from pydantic import BaseModel


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
    weight: float
    location: str
    drugs_record: str | None = None
    hold_points: int = 0
    recorded_at: datetime


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
