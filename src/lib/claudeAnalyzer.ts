import Anthropic from '@anthropic-ai/sdk';
import { TenderAnalysis } from './types';

const SYSTEM_PROMPT = `אתה מומחה בכיר לניתוח מכרזים, מסמכי רכש ופרויקטי תשתיות בישראל עם ניסיון של 20+ שנה.

תפקידך לנתח מסמכי מכרז בצורה מעמיקה, מדוקדקת ומקיפה ביותר ולחלץ את כל המידע הרלוונטי.

כללים קריטיים:
1. **עומק הניתוח**: נתח כל סעיף, תת-סעיף, נספח וטבלה במסמך. אל תדלג על שום פרט.
2. **ציטוטים**: כשמחלץ מידע, ציין את הסעיף הרלוונטי (לדוגמה: "סעיף 4.2.1") וציטוט מדויק.
3. **תקציר מפורט**: בשדה "tenderName" ספק תקציר מקיף של 3-5 משפטים הכולל: שם המכרז, מהות הפרויקט, היקפו, מיקומו, ותיאור כללי.
4. **רקע ומהות**: בשדה "backgroundAndServices" ספק תיאור מפורט הכולל: רקע הפרויקט, מהות השירותים, תחום (בנייה/תשתיות/ייעוץ), שלבי הפרויקט, והיקף העבודה.
5. **שדות ריקים**: אם שדה לא רלוונטי או לא מופיע במסמך - החזר "לא צוין במסמך". אל תחזיר מחרוזת ריקה.
6. **מועדים**: ציין תאריכים מדויקים עם יום בשבוע, תאריך ושעה. **חשוב קריטי - אזור זמן ישראל (Asia/Jerusalem) בלבד**: חשב את יום השבוע לפי לוח השנה הישראלי (UTC+2 / UTC+3 בקיץ). לדוגמה: 05/03/2026 הוא יום **חמישי** בישראל (לא רביעי!). 17/03/2026 הוא יום **שלישי**. חשב בקפידה: ינואר 1, 2026 = יום חמישי, וספור משם. אל תסתמך על מה שכתוב במסמך בלבד - אם יש סתירה בין היום שצוין במסמך לבין החישוב שלך, ציין את שני הנתונים וסמן שיש אי-התאמה. דוגמה: "יום חמישי 05/03/2026 בשעה 12:00 (שימו לב: במסמך צוין יום רביעי אך לפי לוח השנה הישראלי 05/03/2026 הוא יום חמישי)".
7. **תנאי סף**: פרט כל תנאי סף בנפרד עם מספר הסעיף.
8. **דגלים אדומים**: חשוב ביותר - זהה כל סיכון, דרישה חריגה, סתירה, מועד צפוף, תנאי מגביל, או כל דבר שדורש תשומת לב. **כל דגל אדום בשורה נפרדת** עם קטגוריה בסוגריים מרובעים בתחילת השורה: [כספי], [משפטי], [טכני], [לוח זמנים], [כ"א], [אחר]. לדוגמה: "[כספי] ערבות הצעה בסכום חריג של 500,000 ש\"ח".
9. **ציון סיכון**: תן ציון סיכון כולל מ-1 עד 10 (1=סיכון נמוך, 10=סיכון גבוה מאוד). הציון צריך לשקלל: מורכבות תנאי סף, לוח זמנים, דרישות פיננסיות, דגלים אדומים. החזר כמחרוזת מספר בלבד (לדוגמה: "7").
10. **סיכום מנהלים**: כתוב סיכום מנהלים קצר (3-5 משפטים) הכולל: המלצה ברורה Go/No-Go, נימוקים עיקריים, סיכונים מרכזיים, ויתרונות. התחל ב-"GO - " או "NO-GO - " בהתאם להמלצה.
11. **רשימת תיוג להגשה**: צור רשימת תיוג מפורטת של כל מה שנדרש להגשת ההצעה. כל פריט בשורה נפרדת, בפורמט: "[ ] תיאור הפריט". כלול: מסמכים, ערבויות, צוות, אישורים, חתימות, עותקים וכו'.
12. **הגדרות**: חלץ את כל ההגדרות מסעיף ההגדרות של המכרז (לרוב סעיף 1 או סעיף "הגדרות"). זהו סעיף קריטי שמגדיר מונחים מקצועיים ומשפטיים. **כל מונח בשורה נפרדת** בפורמט "מונח: הגדרה מלאה". חלץ את כל המונחים ללא דילוג - גם אם יש עשרות הגדרות.
13. **כל הערכים חייבים להיות מחרוזות (strings)**. אף ערך לא יכול להיות אובייקט או מערך. אם יש מספר פריטים - רשום אותם כטקסט עם שורות חדשות.
14. התשובה חייבת להיות JSON תקין בלבד.`;

const USER_PROMPT = `נתח את מסמך המכרז הבא בצורה המעמיקה ביותר שאפשר. קרא כל מילה. חלץ כל פרט. אל תדלג על שום מידע.

חשוב: כל הערכים ב-JSON חייבים להיות **מחרוזות בלבד** (strings). לא אובייקטים, לא מערכים. אם יש מספר פריטים, כתוב אותם כטקסט אחד עם ירידת שורה.

השדות הנדרשים:
{
  "tenderName": "תקציר מפורט של המכרז - 3 עד 5 משפטים: שם המכרז, מהות הפרויקט, היקפו, מיקום, תיאור כללי",
  "clientIdentity": "זהות המזמין - שם הגוף, סוג הגוף (ממשלתי/עירוני/ציבורי), כתובת",
  "contactPerson": "איש קשר מטעם המזמין - שם מלא, תפקיד, טלפון, מייל, פקס",
  "scoringBreakdown": "חלוקת הניקוד המלאה - אחוז איכות, אחוז מחיר, תת-קריטריונים ומשקלם",
  "bidBond": "ערבות הצעה - סכום מדויק, סוג הערבות, תוקף, תנאים מיוחדים",
  "performanceBond": "ערבות ביצוע - סכום/אחוז, סוג, תוקף, מתי נדרשת",
  "projectEstimate": "אומדן פרויקט - סכום מוערך, טווח תקציבי אם צוין",
  "contractPeriod": "תקופת ההתקשרות - משך בשנים/חודשים, אופציות הארכה ותנאיהן",
  "contractModel": "מודל ההתקשרות - סוג החוזה (פאושלי/מדידה/Cost+Fee/וכו')",
  "partnerRequirement": "צורך בשותף בינלאומי או מקומי - דרישות, תנאים, אחוז שותפות",
  "backgroundAndServices": "רקע מפורט ומהות השירותים - תחום (בנייה/תשתיות/ייעוץ), שלבי הפרויקט, היקף העבודה, מיקום, יעדים",
  "relevantDates": {
    "biddersMeeting": "מועד מפגש מציעים - יום בשבוע (חשב מהתאריך!), תאריך DD/MM/YYYY, שעה, האם חובה, זום/שטח, כתובת. אם יום השבוע במסמך לא מתאים לתאריך - ציין זאת",
    "clarificationQuestions": "מועד שאלות הבהרה - יום בשבוע (חשב מהתאריך!), תאריך DD/MM/YYYY, שעה, אופן ההגשה, כתובת מייל. אם יום השבוע במסמך לא מתאים לתאריך - ציין זאת",
    "bidBondCheck": "מועד בדיקת ערבות הצעה - יום בשבוע (חשב מהתאריך!), תאריך DD/MM/YYYY, שעה. אם יום השבוע במסמך לא מתאים לתאריך - ציין זאת",
    "submissionDeadline": "מועד הגשת ההצעה - יום בשבוע (חשב מהתאריך!), תאריך DD/MM/YYYY, שעה מדויקת. אם יום השבוע במסמך לא מתאים לתאריך - ציין זאת"
  },
  "submissionMethod": "הגשת הצעה - מקוונת/פיזית, מקום ההגשה, מערכת הגשה, פרטים טכניים",
  "requiredTeamForSubmission": "צוות נדרש להגשת ההצעה - כל תפקיד, היקף משרה, דרישות ניסיון לכל תפקיד",
  "requiredTeamAfterSubmission": "צוות נדרש לאחר זכייה - פירוט תפקידים, מספר ימים/שעות, לוח זמנים לגיוס",
  "consultantsDirectContract": "האם יועצים נוספים נדרשים בחוזה ישיר מול המציע - פירוט",
  "bidderEligibility": "תנאי סף מציע - כל תנאי עם מספר סעיף: מחזור, ניסיון, כ\"א, רישיונות, ביטוח",
  "functionEligibility": "תנאי סף לפי פונקציה - כל תפקיד בנפרד עם דרישות הניסיון והכישורים",
  "compensationStructure": "מבנה התמורה - שיטת התשלום (אחוזים/שעות/פאושלי), פירוט מרכיבי התמורה",
  "indexLinked": "הצמדה למדד - האם צמוד, לאיזה מדד, תנאי הצמדה",
  "bidderQualityMetrics": "מדדי איכות מציע - כל קריטריון, משקל, אופן הניקוד",
  "functionQualityMetrics": "מדדי איכות לפי פונקציה - ניקוד לכל תפקיד בנפרד",
  "tenderDocumentsFee": "תשלום עבור רכישת/קבלת מסמכי המכרז - סכום, אופן התשלום, האם ניתן להחזר",
  "tenderDocuments": "מסמכים קיימים במכרז - רשימה מלאה: מסמכי פנייה, הסכם, נספחים, מפרטים, תכניות, הסכם סודיות",
  "paymentMilestones": "אבני דרך לתשלום - פירוט כל אבן דרך, אחוז/סכום, תנאי תשלום",
  "definitions": "כל ההגדרות מסעיף ההגדרות במכרז. כל הגדרה בשורה נפרדת בפורמט: מונח: הגדרה מלאה. חלץ את כל המונחים מסעיף ההגדרות ללא דילוג - לדוגמה:\\nסיום התכנון: השלמת כל שלבי התכנון כולל אישור הגורם המוסמך\\nיום עבודה: יום שאינו שבת, חג או שבתון\\nהמזמין: עיריית תל אביב-יפו",
  "submissionFormat": "פורמט ההגשה - מספר כרכים, מגבלת עמודים לכל כרך, שפה, מספר עותקים, פורמט דיגיטלי",
  "penalties": "קנסות - פירוט כל קנס, סכום/אחוז, תנאי הפעלה, תקרת קנסות",
  "redFlags": "כל דגל אדום בשורה נפרדת, בפורמט:\\n[כספי] תיאור הסיכון הכספי\\n[משפטי] תיאור הסיכון המשפטי\\n[טכני] תיאור הסיכון הטכני\\n[לוח זמנים] תיאור סיכון בלוח זמנים\\n[כ\\"א] תיאור סיכון כ\\"א\\n[אחר] תיאור נוסף\\nכל שורה = דגל אדום אחד עם קטגוריה בסוגריים מרובעים",
  "riskScore": "ציון סיכון כולל מ-1 עד 10 (מספר בלבד, לדוגמה: 7)",
  "executiveSummary": "GO - / NO-GO - סיכום מנהלים קצר: המלצה, נימוקים, סיכונים מרכזיים, יתרונות",
  "submissionChecklist": "[ ] פריט ראשון\\n[ ] פריט שני\\n[ ] פריט שלישי\\n... (כל מה שנדרש להגשה)"
}

מסמך המכרז:
---
{DOCUMENT_TEXT}
---

זכור: כל ערך חייב להיות STRING בלבד. לא objects, לא arrays. החזר JSON תקין בלבד ללא טקסט נוסף.`;

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/** Verify and fix day-of-week in date strings using Israel timezone */
function fixDatesInIsraelTimezone(data: TenderAnalysis): TenderAnalysis {
  const DATE_PATTERN = /יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)\s+(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})/g;

  const formatter = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    timeZone: 'Asia/Jerusalem',
  });

  function fixDateString(value: string): string {
    const regex = new RegExp(DATE_PATTERN.source, 'g');
    return value.replace(regex, (match, dayName, dd, mm, yyyy) => {
      try {
        let year = parseInt(yyyy, 10);
        if (year < 100) year += 2000;
        const month = parseInt(mm, 10);
        const day = parseInt(dd, 10);

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return match;

        const correctDayLong = formatter.format(date);
        const correctDay = correctDayLong.replace('יום ', '');
        const correctDayClean = DAY_NAMES.find(d => correctDay.includes(d));

        if (correctDayClean && correctDayClean !== dayName) {
          console.log(`[DATE-FIX] Corrected: "${dayName}" → "${correctDayClean}" for date ${dd}/${mm}/${yyyy}`);
          const fixed = match.replace(`יום ${dayName}`, `יום ${correctDayClean}`);
          return `${fixed} (תוקן: במקור צוין יום ${dayName})`;
        }
      } catch (err) {
        console.warn(`[DATE-FIX] Failed to parse date in: "${match}"`, err);
      }
      return match;
    });
  }

  try {
    const fixed = { ...data };

    if (fixed.relevantDates) {
      const dates = { ...fixed.relevantDates };
      for (const [key, val] of Object.entries(dates)) {
        if (typeof val === 'string') {
          (dates as Record<string, string>)[key] = fixDateString(val);
        }
      }
      fixed.relevantDates = dates as typeof fixed.relevantDates;
    }

    for (const [key, val] of Object.entries(fixed)) {
      if (key !== 'relevantDates' && typeof val === 'string') {
        (fixed as Record<string, unknown>)[key] = fixDateString(val);
      }
    }

    return fixed;
  } catch (err) {
    console.error('[DATE-FIX] Top-level date fix failed, returning original data:', err);
    return data;
  }
}

export async function analyzeTender(documentText: string): Promise<TenderAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('מפתח API של Anthropic לא הוגדר. הוסף ANTHROPIC_API_KEY לקובץ .env.local');
  }

  const client = new Anthropic({ apiKey });

  const maxChars = 180000;
  let textToAnalyze = documentText;
  if (documentText.length > maxChars) {
    console.warn(`[ANALYZE] Document truncated: ${documentText.length} → ${maxChars} chars`);
    textToAnalyze = documentText.substring(0, maxChars);
  }

  console.log(`[ANALYZE] Starting analysis. Document length: ${textToAnalyze.length} chars`);

  const prompt = USER_PROMPT.replace('{DOCUMENT_TEXT}', textToAnalyze);

  console.log(`[ANALYZE] Calling Claude API (model: claude-opus-4-20250514, max_tokens: 16000, thinking: 10000)...`);
  const startTime = Date.now();

  let message;
  try {
    const stream = await client.messages.stream({
      model: 'claude-opus-4-20250514',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,
      },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    message = await stream.finalMessage();
  } catch (apiError) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[ANALYZE] Claude API call FAILED after ${elapsed}s:`, apiError);
    if (apiError instanceof Error) {
      console.error(`[ANALYZE] Error name: ${apiError.name}, message: ${apiError.message}`);
      if ('status' in apiError) console.error(`[ANALYZE] HTTP status: ${(apiError as { status: number }).status}`);
      if ('error' in apiError) console.error(`[ANALYZE] API error body:`, JSON.stringify((apiError as { error: unknown }).error));
    }
    throw new Error(`שגיאת API של Claude: ${apiError instanceof Error ? apiError.message : 'שגיאה לא צפויה'}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[ANALYZE] Claude API responded in ${elapsed}s. Stop reason: ${message.stop_reason}. Usage: input=${message.usage.input_tokens}, output=${message.usage.output_tokens}`);

  // Log content block types
  const blockTypes = message.content.map(b => b.type).join(', ');
  console.log(`[ANALYZE] Response blocks: [${blockTypes}]`);

  // Extract text from response (skip thinking blocks)
  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => {
      if (block.type === 'text') return block.text;
      return '';
    })
    .join('');

  console.log(`[ANALYZE] Extracted text length: ${responseText.length} chars`);

  if (!responseText || responseText.trim().length === 0) {
    console.error(`[ANALYZE] Empty response text! Full content blocks:`, JSON.stringify(message.content.map(b => ({ type: b.type, length: b.type === 'text' ? b.text.length : 'N/A' }))));
    throw new Error('תשובת ה-AI ריקה. ייתכן שהמסמך ארוך מדי או שיש בעיה זמנית. נסה שוב.');
  }

  // Log first 500 chars to help debug JSON issues
  console.log(`[ANALYZE] Response preview: ${responseText.substring(0, 500)}`);

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    console.log(`[ANALYZE] Found JSON in markdown code block (length: ${jsonMatch[1].trim().length})`);
    jsonStr = jsonMatch[1].trim();
  } else {
    console.log(`[ANALYZE] No markdown code block found, using raw response`);
  }

  // Attempt 1: parse as-is
  try {
    const parsed = JSON.parse(jsonStr) as TenderAnalysis;
    const fieldCount = Object.keys(parsed).length;
    console.log(`[ANALYZE] JSON parse SUCCESS (attempt 1). Fields: ${fieldCount}`);
    const result = fixDatesInIsraelTimezone(parsed);
    console.log(`[ANALYZE] Date fix complete. Analysis done.`);
    return result;
  } catch (e1) {
    console.warn(`[ANALYZE] JSON parse FAILED (attempt 1):`, e1 instanceof Error ? e1.message : e1);
    console.warn(`[ANALYZE] jsonStr preview (first 300 chars): ${jsonStr.substring(0, 300)}`);
    console.warn(`[ANALYZE] jsonStr preview (last 300 chars): ${jsonStr.substring(jsonStr.length - 300)}`);
  }

  // Attempt 2: extract { ... } from response
  const braceMatch = responseText.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    console.log(`[ANALYZE] Found brace-delimited JSON (length: ${braceMatch[0].length})`);
    try {
      const parsed = JSON.parse(braceMatch[0]) as TenderAnalysis;
      const fieldCount = Object.keys(parsed).length;
      console.log(`[ANALYZE] JSON parse SUCCESS (attempt 2). Fields: ${fieldCount}`);
      const result = fixDatesInIsraelTimezone(parsed);
      console.log(`[ANALYZE] Date fix complete. Analysis done.`);
      return result;
    } catch (e2) {
      console.error(`[ANALYZE] JSON parse FAILED (attempt 2):`, e2 instanceof Error ? e2.message : e2);
      console.error(`[ANALYZE] Brace match preview (first 300): ${braceMatch[0].substring(0, 300)}`);
      console.error(`[ANALYZE] Brace match preview (last 300): ${braceMatch[0].substring(braceMatch[0].length - 300)}`);
    }
  } else {
    console.error(`[ANALYZE] No JSON object found in response at all!`);
    console.error(`[ANALYZE] Full response (first 1000 chars): ${responseText.substring(0, 1000)}`);
  }

  // Attempt 3: try to fix common JSON issues (trailing commas, unescaped newlines)
  try {
    console.log(`[ANALYZE] Attempting JSON repair...`);
    let repaired = (braceMatch?.[0] || jsonStr)
      .replace(/,\s*}/g, '}')           // trailing comma before }
      .replace(/,\s*]/g, ']')           // trailing comma before ]
      .replace(/[\x00-\x1f]/g, (ch: string) => {  // control chars
        if (ch === '\n') return '\\n';
        if (ch === '\r') return '\\r';
        if (ch === '\t') return '\\t';
        return '';
      });
    // Re-extract JSON object after repair
    const repairedMatch = repaired.match(/\{[\s\S]*\}/);
    if (repairedMatch) repaired = repairedMatch[0];
    const parsed = JSON.parse(repaired) as TenderAnalysis;
    const fieldCount = Object.keys(parsed).length;
    console.log(`[ANALYZE] JSON repair SUCCESS. Fields: ${fieldCount}`);
    const result = fixDatesInIsraelTimezone(parsed);
    console.log(`[ANALYZE] Date fix complete. Analysis done.`);
    return result;
  } catch (e3) {
    console.error(`[ANALYZE] JSON repair also FAILED:`, e3 instanceof Error ? e3.message : e3);
  }

  console.error(`[ANALYZE] ALL parsing attempts failed. Giving up.`);
  throw new Error('שגיאה בעיבוד תשובת ה-AI. נסה שוב.');
}
