import Anthropic from '@anthropic-ai/sdk';
import { TenderAnalysis } from './types';

const SYSTEM_PROMPT = `אתה מומחה בכיר לניתוח מכרזים, מסמכי רכש ופרויקטי תשתיות בישראל עם ניסיון של 20+ שנה.

תפקידך לנתח מסמכי מכרז בצורה מעמיקה, מדוקדקת ומקיפה ביותר ולחלץ את כל המידע הרלוונטי.

כללים קריטיים:
1. **עומק הניתוח**: נתח כל סעיף, תת-סעיף, נספח וטבלה במסמך. אל תדלג על שום פרט.
2. **ציטוטים**: כשמחלץ מידע, ציין את הסעיף הרלוונטי (לדוגמה: "סעיף 4.2.1") וציטוט מדויק.
3. **תקציר מפורט**: בשדה "tenderName" ספק תקציר מקיף של 3-5 משפטים הכולל: שם המכרז, מהות הפרויקט, היקפו, מיקומו, ותיאור כללי.
4. **רקע ומהות**: בשדה "backgroundAndServices" ספק תיאור מפורט הכולל: רקע הפרויקט, מהות השירותים, תחום (בנייה/תשתיות/ייעוץ), שלבי הפרויקט, והיקף העבודה.
5. **שדות ריקים**: אם שדה לא רלוונטי או לא מופיע - החזר מחרוזת ריקה "".
6. **מועדים**: ציין תאריכים מדויקים עם יום בשבוע, תאריך ושעה.
7. **תנאי סף**: פרט כל תנאי סף בנפרד עם מספר הסעיף.
8. **דגלים אדומים**: חשוב ביותר - זהה כל סיכון, דרישה חריגה, סתירה, מועד צפוף, תנאי מגביל, או כל דבר שדורש תשומת לב. חלק לפי נושאים: כספי, משפטי, טכני, לוח זמנים, כ"א.
9. **כל הערכים חייבים להיות מחרוזות (strings)**. אף ערך לא יכול להיות אובייקט או מערך. אם יש מספר פריטים - רשום אותם כטקסט עם שורות חדשות.
10. התשובה חייבת להיות JSON תקין בלבד.`;

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
    "biddersMeeting": "מועד מפגש מציעים - תאריך, שעה, האם חובה, זום/שטח, כתובת",
    "clarificationQuestions": "מועד שאלות הבהרה - תאריך, שעה, אופן ההגשה, כתובת מייל",
    "bidBondCheck": "מועד בדיקת ערבות הצעה - תאריך, שעה",
    "submissionDeadline": "מועד הגשת ההצעה - תאריך, יום, שעה מדויקת"
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
  "tenderDocuments": "מסמכים קיימים במכרז - רשימה מלאה: מסמכי פנייה, הסכם, נספחים, מפרטים, תכניות, הסכם סודיות",
  "paymentMilestones": "אבני דרך לתשלום - פירוט כל אבן דרך, אחוז/סכום, תנאי תשלום",
  "definitions": "הגדרות חשובות מהמכרז - מונחים מפתח והגדרותיהם",
  "submissionFormat": "פורמט ההגשה - מספר כרכים, מגבלת עמודים לכל כרך, שפה, מספר עותקים, פורמט דיגיטלי",
  "penalties": "קנסות - פירוט כל קנס, סכום/אחוז, תנאי הפעלה, תקרת קנסות",
  "redFlags": "דגלים אדומים בחלוקה לנושאים:\\nכספי: [פרט]\\nמשפטי: [פרט]\\nטכני: [פרט]\\nלוח זמנים: [פרט]\\nכ\"א: [פרט]\\nאחר: [פרט]"
}

מסמך המכרז:
---
{DOCUMENT_TEXT}
---

זכור: כל ערך חייב להיות STRING בלבד. לא objects, לא arrays. החזר JSON תקין בלבד ללא טקסט נוסף.`;

export async function analyzeTender(documentText: string): Promise<TenderAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('מפתח API של Anthropic לא הוגדר. הוסף ANTHROPIC_API_KEY לקובץ .env.local');
  }

  const client = new Anthropic({ apiKey });

  const maxChars = 180000;
  let textToAnalyze = documentText;
  if (documentText.length > maxChars) {
    textToAnalyze = documentText.substring(0, maxChars);
  }

  const prompt = USER_PROMPT.replace('{DOCUMENT_TEXT}', textToAnalyze);

  // Use Claude Opus 4.6 with extended thinking via streaming (required for long ops)
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

  const message = await stream.finalMessage();

  // Extract text from response (skip thinking blocks)
  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => {
      if (block.type === 'text') return block.text;
      return '';
    })
    .join('');

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr) as TenderAnalysis;
    return parsed;
  } catch {
    // Try to find JSON in the response
    const braceMatch = responseText.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        const parsed = JSON.parse(braceMatch[0]) as TenderAnalysis;
        return parsed;
      } catch {
        throw new Error('שגיאה בעיבוד תשובת ה-AI. נסה שוב.');
      }
    }
    throw new Error('שגיאה בעיבוד תשובת ה-AI. נסה שוב.');
  }
}
