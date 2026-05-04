from fastapi import APIRouter

from mock_data import blood_inventory, donors
from schemas import BloodInventory, Donor

router = APIRouter()


@router.get("/donors", response_model=list[Donor])
def list_donors():
    return donors


@router.get("/blood-inventory", response_model=list[BloodInventory])
def list_blood_inventory():
    return blood_inventory
