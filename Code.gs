const HEADERS = [
  "NOME DA EQUIPE/USUARIO",
  "RESPOSTA SELECIONADA 1",
  "RESPOSTA SELECIONADA 2",
  "RESPOSTA SELECIONADA 3",
  "RESPOSTA SELECIONADA 4",
  "RESPOSTA SELECIONADA 5",
  "RESPOSTA SELECIONADA 6",
  "PODIO",
  "PONTUACAO",
  "ACERTOS",
  "DATA/HORA",
  "ID DA TENTATIVA",
  "REVISAO"
];

const CORRECT_ANSWERS = ["B", "A", "B", "B", "A", "B"];
const MAX_PLAYER_NAME_LENGTH = 32;
const MAX_ATTEMPT_ID_LENGTH = 80;
const SPREADSHEET_ID = "1o0PjO0bbXMbp9g3mMMAyClDownFPflgpiJFcF8gu9dM";

function setup() {
  const sheet = getResponseSheet_();
  ensureHeaders_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  sheet.autoResizeColumns(1, HEADERS.length);
  return "Planilha preparada para receber os resultados do quiz.";
}

function doPost(event) {
  try {
    if (!event || !event.parameter || !event.parameter.payload) {
      throw new Error("O campo payload não foi enviado.");
    }

    const payload = JSON.parse(event.parameter.payload);
    const attempt = validateAttempt_(payload);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getResponseSheet_();
      ensureHeaders_(sheet);
      const existingRow = findAttemptRow_(sheet, attempt.id);
      const existingRevision = existingRow
        ? Number(sheet.getRange(existingRow, 13).getValue()) || 0
        : 0;
      if (existingRow && attempt.revision <= existingRevision) {
        return jsonResponse_({ ok: true, stale: true, row: existingRow, revision: existingRevision });
      }

      const correctCount = attempt.answers.reduce(
        (total, answer, index) =>
          total + (answer && answer.choice === CORRECT_ANSWERS[index] ? 1 : 0),
        0
      );
      const score = correctCount * 1000;
      const rowNumber = existingRow || sheet.getLastRow() + 1;
      const complete = attempt.answers.every((answer) => answer !== null);
      const row = [
        safeCellText_(attempt.name),
        ...attempt.answers.map((answer) => answer
          ? safeCellText_(`${answer.choice} — ${answer.text}`)
          : ""
        ),
        "",
        score,
        correctCount,
        new Date(),
        attempt.id,
        attempt.revision
      ];

      sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
      sheet.getRange(rowNumber, 11).setNumberFormat("yyyy-mm-dd hh:mm:ss");

      const previousRows = complete && rowNumber > 2
        ? sheet.getRange(2, 1, rowNumber - 2, HEADERS.length).getValues()
        : [];
      const rank = complete
        ? 1 + previousRows.filter((previous) =>
          previous[0] &&
          previous.slice(1, 7).every(Boolean) &&
          Number.isFinite(Number(previous[8])) &&
          Number(previous[8]) > score
        ).length
        : 0;
      const podium = rank === 1
        ? "🥇 1º LUGAR"
        : rank === 2
          ? "🥈 2º LUGAR"
          : rank === 3
            ? "🥉 3º LUGAR"
            : "";

      sheet.getRange(rowNumber, 8).setValue(podium);
      return jsonResponse_({
        ok: true,
        score: score,
        correct: correctCount,
        rank: rank,
        revision: attempt.revision,
        complete: complete
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message });
  }
}

function doGet(event) {
  try {
    const sheet = getResponseSheet_();
    ensureHeaders_(sheet);
    const lastRow = sheet.getLastRow();
    const rows = lastRow < 2
      ? []
      : sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const leaderboard = rows
        .filter((row) => row[0] && Number.isFinite(Number(row[8])))
        .filter((row) => row.slice(1, 7).every(Boolean))
        .map((row) => ({
          name: String(row[0]),
          score: Number(row[8]),
          correct: Number(row[9]),
          playedAt: row[10] instanceof Date ? row[10].toISOString() : String(row[10])
        }))
        .sort((first, second) =>
          second.score - first.score ||
          second.correct - first.correct ||
          first.playedAt.localeCompare(second.playedAt)
        )
        .slice(0, 10);

    const attemptId = event && event.parameter ? event.parameter.attemptId : "";
    const attemptRow = attemptId ? findAttemptRow_(sheet, attemptId) : 0;
    const attemptInfo = attemptRow
      ? {
        saved: true,
        revision: Number(sheet.getRange(attemptRow, 13).getValue()) || 0,
        complete: sheet.getRange(attemptRow, 2, 1, 6).getValues()[0].every(Boolean)
      }
      : { saved: false, revision: 0, complete: false };
    const result = { ok: true, leaderboard: leaderboard, attempt: attemptInfo };
    const callback = event && event.parameter ? event.parameter.callback : "";
    if (callback) {
      if (!/^[A-Za-z_$][\w$]{0,100}$/.test(callback)) {
        throw new Error("Nome de callback inválido.");
      }
      const safeJson = JSON.stringify(result).replace(/</g, "\\u003c");
      return ContentService.createTextOutput(`${callback}(${safeJson});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonResponse_(result);
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message });
  }
}

function validateAttempt_(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Os dados da partida são inválidos.");
  }

  const name = String(payload.name || "").trim();
  const id = String(payload.id || "").trim();
  if (!name || name.length > MAX_PLAYER_NAME_LENGTH) {
    throw new Error("Informe um nome com até 32 caracteres.");
  }
  if (!id || id.length > MAX_ATTEMPT_ID_LENGTH) {
    throw new Error("O identificador da partida é inválido.");
  }
  if (!Array.isArray(payload.answers) || payload.answers.length !== CORRECT_ANSWERS.length) {
    throw new Error("A partida deve conter seis posições de resposta.");
  }
  if (payload.answers.some((answer) =>
    answer !== null &&
    (!answer ||
      typeof answer !== "object" ||
      !["A", "B", "C"].includes(answer.choice) ||
      typeof answer.text !== "string" ||
      answer.text.length > 800)
  )) {
    throw new Error("Uma ou mais alternativas são inválidas.");
  }
  if (!payload.answers.some((answer) => answer !== null)) {
    throw new Error("Selecione pelo menos uma resposta antes de salvar.");
  }
  const revision = Number(payload.revision);
  if (!Number.isInteger(revision) || revision < 1 || revision > CORRECT_ANSWERS.length) {
    throw new Error("A revisão da partida é inválida.");
  }

  return { name: name, id: id, answers: payload.answers, revision: revision };
}

function getResponseSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets()[0];
  if (!sheet) {
    throw new Error("A planilha informada não contém nenhuma aba.");
  }
  return sheet;
}

function ensureHeaders_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  const current = headerRange.getValues()[0];
  const isBlank = current.every((value) => value === "");

  if (isBlank) {
    headerRange.setValues([HEADERS]);
    return;
  }

  const normalizedCurrent = current.map(normalizeHeader_);
  const normalizedExpected = HEADERS.map(normalizeHeader_);
  for (let column = 0; column < 8; column += 1) {
    const compactCurrent = normalizedCurrent[column].replace(/[^A-Z0-9]/g, "");
    const isResponseHeader = column >= 1 && column <= 6 &&
      compactCurrent.startsWith("RESPOSTASELECIO") &&
      compactCurrent.endsWith(String(column));
    if (normalizedCurrent[column] !== normalizedExpected[column] && !isResponseHeader) {
      throw new Error(
        `Cabeçalho inesperado na coluna ${column + 1}. ` +
        `Esperado: ${HEADERS[column]}. Não alterei os dados da planilha.`
      );
    }
    if (isResponseHeader && normalizedCurrent[column] !== normalizedExpected[column]) {
      sheet.getRange(1, column + 1).setValue(HEADERS[column]);
    }
  }

  for (let column = 8; column < HEADERS.length; column += 1) {
    if (!current[column]) {
      sheet.getRange(1, column + 1).setValue(HEADERS[column]);
    } else if (normalizedCurrent[column] !== normalizedExpected[column]) {
      throw new Error(
        `A coluna ${column + 1} já está em uso. ` +
        `Esperado: ${HEADERS[column]}. Não alterei os dados da planilha.`
      );
    }
  }
}

function normalizeHeader_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function safeCellText_(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function findAttemptRow_(sheet, attemptId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const match = sheet.getRange(2, 12, lastRow - 1, 1)
    .createTextFinder(attemptId)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
