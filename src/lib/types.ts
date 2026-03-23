export interface TenderAnalysis {
  tenderName: string;
  clientIdentity: string;
  contactPerson: string;
  scoringBreakdown: string;
  bidBond: string;
  performanceBond: string;
  projectEstimate: string;
  contractPeriod: string;
  contractModel: string;
  partnerRequirement: string;
  backgroundAndServices: string;
  relevantDates: {
    biddersMeeting: string;
    clarificationQuestions: string;
    bidBondCheck: string;
    submissionDeadline: string;
  };
  submissionMethod: string;
  requiredTeamForSubmission: string;
  requiredTeamAfterSubmission: string;
  consultantsDirectContract: string;
  employerEmployeeRelationship: string;
  bidderEligibility: string;
  functionEligibility: string;
  compensationStructure: string;
  indexLinked: string;
  bidderQualityMetrics: string;
  functionQualityMetrics: string;
  tenderDocumentsFee: string;
  tenderDocuments: string;
  paymentMilestones: string;
  definitions: string;
  submissionFormat: string;
  penalties: string;
  redFlags: string;
  riskScore: string;
  executiveSummary: string;
  submissionChecklist: string;
}

export interface AnalysisResult {
  success: boolean;
  data?: TenderAnalysis;
  error?: string;
}

export const FIELD_LABELS: Record<string, string> = {
  tenderName: 'תקציר - שם המכרז',
  clientIdentity: 'זהות המזמין',
  contactPerson: 'איש קשר מטעם המזמין',
  scoringBreakdown: 'חלוקת הניקוד (% איכות, % הצעת המחיר)',
  bidBond: 'ערבות הצעה',
  performanceBond: 'ערבות ביצוע',
  projectEstimate: 'אומדן פרויקט',
  contractPeriod: 'תקופת ההתקשרות',
  contractModel: 'מודל ההתקשרות',
  partnerRequirement: 'צורך בשותף בינ"ל / שותף מקומי',
  backgroundAndServices: 'רקע ומהות השירותים (כולל תחום – בנייה / תשתיות)',
  submissionMethod: 'הגשת הצעה – מקוונת או פיזית',
  requiredTeamForSubmission: 'צוות נדרש לצורך הגשת ההצעה כולל היקפי משרה',
  requiredTeamAfterSubmission: 'צוות נדרש לאחר הגשת ההצעה בפירוט מספר הימים',
  consultantsDirectContract: 'האם היועצים הנוספים נדרשים להיות בחוזה ישיר מול המציע',
  employerEmployeeRelationship: 'יחסי עובד-מעביד – האם נדרשים לאנשי הצוות',
  bidderEligibility: 'תנאי סף מציע',
  functionEligibility: 'תנאי סף – לגבי כל פונקציה בנפרד',
  compensationStructure: 'תמורה – מבנה התמורה (אחוזים / שעות / פאושלי)',
  indexLinked: 'האם התמורה צמודה למדד',
  bidderQualityMetrics: 'מדדי איכות מציע',
  functionQualityMetrics: 'מדדי איכות לגבי כל פונקציה בנפרד',
  tenderDocumentsFee: 'תשלום עבור מסמכי המכרז',
  tenderDocuments: 'מסמכים קיימים במסגרת המכרז',
  paymentMilestones: 'אבני דרך לתשלום',
  definitions: 'הגדרות',
  submissionFormat: 'פורמט ההגשה (מס\' כרכים, מגבלת עמודים, שפה)',
  penalties: 'קנסות',
  redFlags: 'דגל אדום (בחלוקה לפי נושאים)',
  riskScore: 'ציון סיכון כולל (1-10)',
  executiveSummary: 'המלצת המערכת – Go/No-Go',
  submissionChecklist: 'רשימת תיוג להגשה',
};

export const DATE_LABELS: Record<string, string> = {
  biddersMeeting: 'מועד מפגש מציעים – האם חובה, האם מתקיים בזום או בשטח (יום ושעה)',
  clarificationQuestions: 'מועד שאלות הבהרה – איך להגיש ולאן (יום ושעה)',
  bidBondCheck: 'מועד בדיקת ערבות הצעה',
  submissionDeadline: 'מועד הגשת ההצעה (יום ושעה)',
};
