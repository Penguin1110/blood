from fastapi import APIRouter, HTTPException, Query

from database import fetch_all, fetch_one, get_connection
from routers.auth import hash_password
from schemas import User, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


# 查詢全部使用者
@router.get("", response_model=list[User])
def list_users(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return fetch_all(
        """
        SELECT
            donor_id,
            name,
            nickname,
            gender,
            birthday,
            blood_type,
            phone,
            email,
            last_date,
            spent_points
        FROM `user`
        ORDER BY donor_id
        LIMIT %s OFFSET %s
        """,
        (limit, offset),
    )


# 查詢單一使用者
@router.get("/{donor_id}", response_model=User)
def get_user(donor_id: int):
    user = fetch_one(
        """
        SELECT
            donor_id,
            name,
            nickname,
            gender,
            birthday,
            blood_type,
            phone,
            email,
            last_date,
            spent_points
        FROM `user`
        WHERE donor_id = %s
        """,
        (donor_id,)
    )

    if not user:
        raise HTTPException(status_code=404, detail="找不到使用者")

    return user


# 新增使用者
@router.post("/")
def create_user(data: UserCreate):
    existing_user = fetch_one(
        "SELECT * FROM `user` WHERE email = %s",
        (data.email,)
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="Email 已存在")

    with get_connection() as connection:
        with connection.cursor() as cursor:
            try:
                cursor.execute(
                    """
                    INSERT INTO `user`
                    (
                        name,
                        nickname,
                        gender,
                        birthday,
                        blood_type,
                        phone,
                        email,
                        password_hash
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        data.name,
                        data.nickname,
                        data.gender,
                        data.birthday,
                        data.blood_type,
                        data.phone,
                        data.email,
                        hash_password(data.password)
                    )
                )

                new_donor_id = cursor.lastrowid

                cursor.execute(
                    """
                    INSERT INTO history_log
                    (
                        donor_id,
                        weight,
                        location,
                        drugs_record
                    )
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        new_donor_id,
                        data.weight,
                        data.location,
                        data.drugs_record
                    )
                )

                connection.commit()

                return {
                    "message": "使用者新增成功",
                    "donor_id": new_donor_id
                }

            except Exception:
                connection.rollback()
                raise HTTPException(status_code=500, detail="使用者新增失敗，請稍後再試")


# 更新使用者基本資料
@router.put("/{donor_id}")
def update_user(donor_id: int, data: UserUpdate):
    user = fetch_one(
        "SELECT * FROM `user` WHERE donor_id = %s",
        (donor_id,)
    )

    if not user:
        raise HTTPException(status_code=404, detail="找不到使用者")

    ALLOWED_FIELDS = {"name", "nickname", "gender", "birthday", "blood_type", "phone", "email", "password_hash", "spent_points"}

    fields = data.model_dump(exclude_unset=True)

    if not fields:
        raise HTTPException(status_code=400, detail="沒有提供更新資料")

    if "password" in fields:
        fields["password_hash"] = hash_password(fields.pop("password"))

    invalid = set(fields) - ALLOWED_FIELDS
    if invalid:
        raise HTTPException(status_code=400, detail=f"不允許的欄位：{invalid}")

    set_clause = ", ".join(f"`{key}` = %s" for key in fields)

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
                raise HTTPException(status_code=404, detail="找不到使用者")

            return {
                "message": "刪除成功"
            }
