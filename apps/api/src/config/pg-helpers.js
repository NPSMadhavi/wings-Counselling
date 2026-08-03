/** PostgreSQL error codes */
export const PG_ERRORS = {
  DUPLICATE_COLUMN: "42701",
  UNIQUE_VIOLATION: "23505",
  DUPLICATE_TABLE: "42P07",
  FK_VIOLATION: "23503",
};

/** Convert MySQL-style ? placeholders to PostgreSQL $1, $2, ... */
export function toPgPlaceholders(sql, params = []) {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: params };
}

/** Build SET clause from object for UPDATE statements */
export function buildSetClause(data, startIndex = 1) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const clause = keys.map((key, i) => `${key} = $${startIndex + i}`).join(", ");
  return { clause, values, nextIndex: startIndex + keys.length };
}

/**
 * Parse query — handles mysql2-only `SET ?` syntax and INSERT RETURNING id.
 */
export function prepareQuery(sql, params = []) {
  let text = sql.trim();
  let values = [...params];
  const isModification = /^(INSERT|UPDATE|DELETE)\s+/i.test(text);
  const isInsert = /^INSERT\s+/i.test(text);
  const hasSetPlaceholder = /\bSET\s+\?/i.test(text);

  if (hasSetPlaceholder) {
    const setData = params[0];
    const tailParams = params.slice(1);
    const { clause, values: setValues, nextIndex } = buildSetClause(setData, 1);
    text = text.replace(/\bSET\s+\?/i, `SET ${clause}`);
    values = [...setValues, ...tailParams];
    let idx = nextIndex - 1;
    text = text.replace(/\?/g, () => `$${++idx}`);
  } else {
    ({ text, values } = toPgPlaceholders(text, values));
  }

  if (isInsert && !/\bRETURNING\b/i.test(text)) {
    text += " RETURNING id";
  }

  return { text, values, isModification };
}

/** Map pg query result to mysql2-compatible tuple */
export function formatQueryResult(pgResult, isModification) {
  if (isModification) {
    const header = {
      insertId: pgResult.rows[0]?.id ?? null,
      affectedRows: pgResult.rowCount ?? 0,
    };
    return [header, pgResult.fields ?? []];
  }
  return [pgResult.rows, pgResult.fields ?? []];
}

export function isDuplicateColumnError(err) {
  return err?.code === PG_ERRORS.DUPLICATE_COLUMN;
}

export function isUniqueViolation(err) {
  return err?.code === PG_ERRORS.UNIQUE_VIOLATION;
}

export function isDuplicateTableError(err) {
  return err?.code === PG_ERRORS.DUPLICATE_TABLE;
}

export function isFkViolation(err) {
  return err?.code === PG_ERRORS.FK_VIOLATION;
}
