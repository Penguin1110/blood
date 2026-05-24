from fastapi import APIRouter, HTTPException

from database import fetch_all, fetch_one, get_connection
from schemas import User, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


# 查詢全部使用者
@router.get("", response_model=list[User])
def list_users():

    return fetch_all(
        """
        SELECT
            donor_id,
            name,
            gender,
            birthday,
            blood_type,
            phone,
            email,
            last_date,
            hold_points,
            location,
            weight,
            drugs_record
        FROM `user`
        """
    )


# 查詢單一使用者
@router.get("/{donor_id}", response_model=User)
def get_user(donor_id: int):

    user = fetch_one(
        """
        SELECT
            donor_id,
            name,
            gender,
            birthday,
            blood_type,
            phone,
            email,
            last_date,
            hold_points,
            location,
            weight,
            drugs_record
        FROM `user`
        WHERE donor_id = %s
        """,
        (donor_id,)
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="找不到使用者"
        )

    return user


# 新增使用者
@router.post("/")
def create_user(data: UserCreate):

    # 檢查 email 是否已存在
    existing_user = fetch_one(
        "SELECT * FROM `user` WHERE email = %s",
        (data.email,)
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email 已存在"
        )

    query = """
    INSERT INTO `user`
    (
        name,
        gender,
        birthday,
        blood_type,
        phone,
        email,
        location,
        weight,
        drugs_record
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                query,
                (
                    data.name,
                    data.gender,
                    data.birthday,
                    data.blood_type,
                    data.phone,
                    data.email,
                    data.location,
                    data.weight,
                    data.drugs_record
                )
            )

            connection.commit()

            return {
                "message": "使用者新增成功",
                "donor_id": cursor.lastrowid
            }


# 更新使用者
@router.put("/{donor_id}")
def update_user(donor_id: int, data: UserUpdate):

    fields = data.model_dump(exclude_unset=True)

    if not fields:
        raise HTTPException(
            status_code=400,
            detail="沒有提供更新資料"
        )

    # 動態組合 SQL
    set_clause = ", ".join(
        f"{key} = %s" for key in fields
    )

    values = list(fields.values())
    values.append(donor_id)

    query = f"""
    UPDATE `user`
    SET {set_clause}
    WHERE donor_id = %s
    """

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(query, values)

            connection.commit()

            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="找不到使用者"
                )

            return {
                "message": "更新成功"
            }


# 刪除使用者
@router.delete("/{donor_id}")
def delete_user(donor_id: int):

    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                "DELETE FROM `user` WHERE donor_id = %s",
                (donor_id,)
            )

            connection.commit()

            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="找不到使用者"
                )

            return {
                "message": "刪除成功"
            }
