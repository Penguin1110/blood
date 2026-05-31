from datetime import date, datetime, time, timedelta
from typing import Literal

from pydantic import BaseModel, Field, field_validator

BloodType = Literal["A", "B", "AB", "O", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

class UserCreate(BaseModel):
    name: str
    nickname: str
    id_number: str
    gender: str
    birthday: date
    blood_type: BloodType
    phone: str
    email: str
    password: str

class UserUpdate(BaseModel):
    name: str | None = None
    nickname: str | None = None
    id_number: str | None = None
    gender: str | None = None
    birthday: date | None = None
    blood_type: BloodType | None = None
    phone: str | None = None
    email: str | None = None
    password: str | None = None


class User(BaseModel):
    donor_id: int
    name: str
    nickname: str | None = None
    id_number: str | None = None
    gender: str
    birthday: date
    blood_type: BloodType
    phone: str
    email: str
    last_date: date | None = None
    last_category: str | None = None


class HistoryLog(BaseModel):
    log_id: int
    donor_id: int
    has_cold_or_infection: bool = False
    had_dental_treatment: bool = False
    had_surgery_or_transfusion: bool = False
    taking_medication: bool = False
    had_vaccine_or_injection: bool = False
    pregnancy_or_postpartum: bool = False
    unexplained_weight_loss: bool = False
    had_tattoo_piercing: bool = False
    traveled_epidemic_area: bool = False
    contact_infectious_disease: bool = False
    high_risk_behavior: bool = False
    understood_process_and_risk: bool = False
    consent_blood_donation: bool = False
    consent_medical_reuse: bool = False
    recorded_at: datetime


class HistoryLogCreate(BaseModel):
    donor_id: int
    has_cold_or_infection: bool = False
    had_dental_treatment: bool = False
    had_surgery_or_transfusion: bool = False
    taking_medication: bool = False
    had_vaccine_or_injection: bool = False
    pregnancy_or_postpartum: bool = False
    unexplained_weight_loss: bool = False
    had_tattoo_piercing: bool = False
    traveled_epidemic_area: bool = False
    contact_infectious_disease: bool = False
    high_risk_behavior: bool = False
    understood_process_and_risk: bool = False
    consent_blood_donation: bool = False
    consent_medical_reuse: bool = False


class HistoryLogUpdate(BaseModel):
    has_cold_or_infection: bool | None = None
    had_dental_treatment: bool | None = None
    had_surgery_or_transfusion: bool | None = None
    taking_medication: bool | None = None
    had_vaccine_or_injection: bool | None = None
    pregnancy_or_postpartum: bool | None = None
    unexplained_weight_loss: bool | None = None
    had_tattoo_piercing: bool | None = None
    traveled_epidemic_area: bool | None = None
    contact_infectious_disease: bool | None = None
    high_risk_behavior: bool | None = None
    understood_process_and_risk: bool | None = None
    consent_blood_donation: bool | None = None
    consent_medical_reuse: bool | None = None


class Question(BaseModel):
    question_id: int
    question_no: str
    question_text: str
    question_category: str
    answer_key: str


class SurveyAnswer(BaseModel):
    answer_id: int
    log_id: int
    question_id: int
    answer_value: bool


class DonationRecord(BaseModel):
    record_id: int
    donor_id: int
    donation_date: date
    address: str | None = None
    category: str | None = None
    donor_weight: float | None = None
    created_by: int | None = None

class DonationRecordCreate(BaseModel):
    donor_id: int
    donation_date: date
    address: str | None = None
    category: str | None = None
    donor_weight: float | None = None

class DonationRecordUpdate(BaseModel):
    donor_id: int | None = None
    donation_date: date | None = None
    address: str | None = None
    category: str | None = None
    donor_weight: float | None = None

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


class SiteGift(BaseModel):
    site_gift_id: int
    site_id: int
    gift_id: int
    gift_item: str
    needed_points: int
    quantity: int


class SiteGiftUpsert(BaseModel):
    quantity: int = Field(ge=0)


class GiftCreate(BaseModel):
    gift_item: str = Field(min_length=1, max_length=100)
    needed_points: int = Field(ge=0)


class GiftUpdate(BaseModel):
    gift_item: str = Field(min_length=1, max_length=100)
    needed_points: int = Field(ge=0)


class Transportation(BaseModel):
    trans_id: int
    site_id: int
    trans_type: str
    description: str
    sort_order: int = 0


class PointSummary(BaseModel):
    donor_id: int
    cumulative_points: int
    current_points: int


class PointTransaction(BaseModel):
    transaction_id: int
    donor_id: int
    source_type: str
    source_id: int | None = None
    points_delta: int
    description: str | None = None
    created_at: datetime


class RedemptionRecord(BaseModel):
    redemption_id: int
    donor_id: int
    gift_id: int
    site_id: int | None = None
    points_spent: int
    redeemed_at: datetime


class RedemptionCreate(BaseModel):
    donor_id: int
    gift_id: int
    site_id: int | None = None


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
