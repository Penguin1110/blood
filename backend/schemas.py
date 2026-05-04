from pydantic import BaseModel


class Donor(BaseModel):
    id: int
    name: str
    blood_type: str
    last_donation_date: str


class BloodInventory(BaseModel):
    blood_type: str
    units: int


class User(BaseModel):
    id: int
    name: str
    email: str
    blood_type: str


class Donation(BaseModel):
    id: int
    user_id: int
    site_id: int
    donation_date: str
    blood_type: str
    volume_ml: int


class DonationSite(BaseModel):
    id: int
    name: str
    address: str
    city: str


class Reward(BaseModel):
    id: int
    user_id: int
    points: int
    description: str
