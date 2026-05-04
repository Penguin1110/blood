from pydantic import BaseModel


class Donor(BaseModel):
    id: int
    name: str
    blood_type: str
    last_donation_date: str


class BloodInventory(BaseModel):
    blood_type: str
    units: int
