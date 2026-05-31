from fastapi import APIRouter, HTTPException, Query, status

from database import fetch_all, fetch_one, get_connection
from schemas import HistoryLog, HistoryLogCreate, HistoryLogUpdate, Question, SurveyAnswer

router = APIRouter(prefix="/health", tags=["health"])

QUESTION_DEFINITIONS = [
    (1, "Q1", "has_cold_or_infection", "近期是否有感冒、發燒、腹瀉或急性感染？", "健康狀況"),
    (2, "Q2", "had_dental_treatment", "7 天內是否曾接受拔牙或牙科治療？", "健康狀況"),
    (3, "Q3", "had_surgery_or_transfusion", "近期是否曾進行外科手術或接受輸血？", "健康狀況"),
    (4, "Q4", "taking_medication", "目前是否正在服藥？", "健康狀況"),
    (5, "Q5", "had_vaccine_or_injection", "過去 1 個月內是否曾接種疫苗或接受注射？", "健康狀況"),
    (6, "Q6", "pregnancy_or_postpartum", "女性是否懷孕中、產後或流產未滿 6 個月？", "健康狀況"),
    (7, "Q7", "unexplained_weight_loss", "是否近期有不明原因體重驟降？", "健康狀況"),
    (8, "Q8", "had_tattoo_piercing", "是否曾在近幾個月內刺青、紋眉或穿耳洞？", "健康狀況"),
    (9, "Q9", "traveled_epidemic_area", "過去一段時間是否曾出國至傳染病疫區（如瘧疾、茲卡病毒等）？", "旅遊史"),
    (10, "Q10", "contact_infectious_disease", "是否曾與傳染病患者密切接觸？", "傳染病風險"),
    (11, "Q11", "high_risk_behavior", "是否曾有危險性行為、吸毒等高風險行為？", "傳染病風險"),
    (12, "Q12", "understood_process_and_risk", "確認已了解捐血流程、用血安全及相關刑責。", "同意與簽名"),
    (13, "Q13", "consent_blood_donation", "同意無償捐血。", "同意與簽名"),
    (14, "Q14", "consent_medical_reuse", "若血液不適合輸給病人，是否同意供作國內外醫藥資源再利用？", "同意與簽名"),
]

QUESTION_FIELDS = [item[2] for item in QUESTION_DEFINITIONS]
QUESTION_ID_BY_FIELD = {item[2]: item[0] for item in QUESTION_DEFINITIONS}


def _ensure_user_exists(donor_id: int):
    user = fetch_one(
        "SELECT donor_id FROM `user` WHERE donor_id = %s",
        (donor_id,),
    )
    if not user:
        raise HTTPException(status_code=404, detail="找不到捐血者")


def _seed_questions(cursor):
    cursor.executemany(
        """
        INSERT INTO question (question_id, question_no, answer_key, question_text, question_category)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            question_no = VALUES(question_no),
            answer_key = VALUES(answer_key),
            question_text = VALUES(question_text),
            question_category = VALUES(question_category)
        """,
        QUESTION_DEFINITIONS,
    )


def _base_history_query(where_clause: str = "") -> str:
    return f"""
        SELECT
            log_id,
            donor_id,
            recorded_at
        FROM history_log
        {where_clause}
    """


def _hydrate_answers(logs: list[dict]) -> list[dict]:
    if not logs:
        return logs

    by_id = {row["log_id"]: row for row in logs}
    placeholders = ", ".join(["%s"] * len(by_id))
    answers = fetch_all(
        f"""
        SELECT
            sa.log_id,
            q.answer_key,
            sa.answer_value
        FROM survey_answer AS sa
        JOIN question AS q
            ON q.question_id = sa.question_id
        WHERE sa.log_id IN ({placeholders})
        """,
        tuple(by_id),
    )

    for row in answers:
        if row["answer_key"] in QUESTION_FIELDS:
            by_id[row["log_id"]][row["answer_key"]] = bool(row["answer_value"])

    for row in logs:
        for key in QUESTION_FIELDS:
            row.setdefault(key, False)

    return logs


def _select_history_log(where_clause="", params=None):
    rows = fetch_all(_base_history_query(where_clause), params)
    rows = _hydrate_answers(rows)
    return rows[0] if rows else None


def _answer_values(data: HistoryLogCreate | HistoryLogUpdate, *, partial: bool) -> dict[str, bool]:
    fields = data.model_dump(exclude_unset=partial)
    return {
        key: bool(fields[key])
        for key in QUESTION_FIELDS
        if key in fields
    }


def _write_survey_answers(cursor, log_id: int, values: dict[str, bool]):
    if not values:
        return

    rows = [
        (log_id, QUESTION_ID_BY_FIELD[key], value)
        for key, value in values.items()
    ]
    cursor.executemany(
        """
        INSERT INTO survey_answer (log_id, question_id, answer_value)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
            answer_value = VALUES(answer_value)
        """,
        rows,
    )


@router.get("/status")
def health_check():
    return {"status": "ok"}


@router.get("/questions", response_model=list[Question])
def list_questions():
    return fetch_all(
        """
        SELECT
            question_id,
            question_no,
            question_text,
            question_category,
            answer_key
        FROM question
        ORDER BY question_id
        """
    )


@router.get("", response_model=list[HistoryLog])
def list_health_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    rows = fetch_all(
        _base_history_query("ORDER BY recorded_at DESC, log_id DESC LIMIT %s OFFSET %s"),
        (limit, offset),
    )
    return _hydrate_answers(rows)


@router.get("/donor/{donor_id}", response_model=list[HistoryLog])
def list_health_logs_by_donor(
    donor_id: int,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    _ensure_user_exists(donor_id)
    rows = fetch_all(
        _base_history_query("WHERE donor_id = %s ORDER BY recorded_at DESC, log_id DESC LIMIT %s OFFSET %s"),
        (donor_id, limit, offset),
    )
    return _hydrate_answers(rows)


@router.get("/{log_id}/answers", response_model=list[SurveyAnswer])
def list_survey_answers(log_id: int):
    log = fetch_one("SELECT log_id FROM history_log WHERE log_id = %s", (log_id,))
    if not log:
        raise HTTPException(status_code=404, detail="找不到健康紀錄")

    return fetch_all(
        """
        SELECT
            answer_id,
            log_id,
            question_id,
            answer_value
        FROM survey_answer
        WHERE log_id = %s
        ORDER BY question_id
        """,
        (log_id,),
    )


@router.get("/{log_id}", response_model=HistoryLog)
def get_health_log(log_id: int):
    log = _select_history_log("WHERE log_id = %s", (log_id,))
    if not log:
        raise HTTPException(status_code=404, detail="找不到健康紀錄")
    return log


@router.post("", response_model=HistoryLog, status_code=status.HTTP_201_CREATED)
def create_health_log(data: HistoryLogCreate):
    _ensure_user_exists(data.donor_id)
    values = _answer_values(data, partial=False)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            _seed_questions(cursor)
            cursor.execute(
                """
                INSERT INTO history_log
                (
                    donor_id
                )
                VALUES (%s)
                """,
                (
                    data.donor_id,
                ),
            )
            new_log_id = cursor.lastrowid
            _write_survey_answers(cursor, new_log_id, values)
            connection.commit()

    return _select_history_log("WHERE log_id = %s", (new_log_id,))


@router.put("/{log_id}", response_model=HistoryLog)
def update_health_log(log_id: int, data: HistoryLogUpdate):
    log = _select_history_log("WHERE log_id = %s", (log_id,))
    if not log:
        raise HTTPException(status_code=404, detail="找不到健康紀錄")

    allowed_fields = {
        *QUESTION_FIELDS,
    }
    fields = data.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=400, detail="沒有提供更新資料")

    invalid = set(fields) - allowed_fields
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid fields: {invalid}")

    scalar_fields = {key: value for key, value in fields.items() if key not in QUESTION_FIELDS}
    answer_fields = _answer_values(data, partial=True)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            _seed_questions(cursor)
            if scalar_fields:
                set_clause = ", ".join(f"`{key}` = %s" for key in scalar_fields)
                values = list(scalar_fields.values())
                values.append(log_id)
                cursor.execute(
                    f"""
                    UPDATE history_log
                    SET {set_clause}
                    WHERE log_id = %s
                    """,
                    values,
                )

            _write_survey_answers(cursor, log_id, answer_fields)
            connection.commit()

    return _select_history_log("WHERE log_id = %s", (log_id,))


@router.delete("/{log_id}")
def delete_health_log(log_id: int):
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM history_log WHERE log_id = %s",
                (log_id,),
            )
            connection.commit()

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="找不到健康紀錄")

    return {"message": "健康紀錄刪除成功"}
