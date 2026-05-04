donors = [
    {
        "id": 1,
        "name": "Alice Chen",
        "blood_type": "A+",
        "last_donation_date": "2026-04-12",
    },
    {
        "id": 2,
        "name": "Brian Lin",
        "blood_type": "O-",
        "last_donation_date": "2026-03-28",
    },
]

blood_inventory = [
    {"blood_type": "A+", "units": 18},
    {"blood_type": "A-", "units": 6},
    {"blood_type": "B+", "units": 14},
    {"blood_type": "B-", "units": 4},
    {"blood_type": "AB+", "units": 7},
    {"blood_type": "AB-", "units": 2},
    {"blood_type": "O+", "units": 22},
    {"blood_type": "O-", "units": 5},
]

users = [
    {
        "id": 1,
        "name": "Alice Chen",
        "email": "alice@example.com",
        "blood_type": "A+",
    },
    {
        "id": 2,
        "name": "Brian Lin",
        "email": "brian@example.com",
        "blood_type": "O-",
    },
]

donations = [
    {
        "id": 1,
        "user_id": 1,
        "site_id": 1,
        "donation_date": "2026-04-12",
        "blood_type": "A+",
        "volume_ml": 500,
    },
    {
        "id": 2,
        "user_id": 2,
        "site_id": 2,
        "donation_date": "2026-03-28",
        "blood_type": "O-",
        "volume_ml": 450,
    },
]

sites = [
    {
        "id": 1,
        "name": "Taipei Blood Donation Center",
        "address": "No. 1, Zhongxiao E. Rd.",
        "city": "Taipei",
    },
    {
        "id": 2,
        "name": "Taichung Blood Donation Station",
        "address": "No. 20, Taiwan Blvd.",
        "city": "Taichung",
    },
]

rewards = [
    {
        "id": 1,
        "user_id": 1,
        "points": 120,
        "description": "Coffee voucher",
    },
    {
        "id": 2,
        "user_id": 2,
        "points": 90,
        "description": "Health check discount",
    },
]
