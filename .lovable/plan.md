
## מטרה
1. לתמוך בערכים כמו "לא משנה" / "לא אכפת" / "הכל" כ-wildcards — שלא יענישו את הציון, ויהיו ניתנים לעריכה במסך "מתקדם".
2. לאפשר למתנדב לציין שם של ילד שהוא רוצה, ולתת לזה דחיפה בציון (בונוס רך) בלי להפוך את זה ל-hard-lock.

---

## 1) Wildcards גלובליים

### Store / Types
- `types.ts`: להוסיף `wildcards?: string[]` ברמת ה-store (לא ברמת פרמטר), כדי שיהיו משותפים לכל הפרמטרים.
- `store.ts`:
  - שדה חדש `wildcards: string[]` עם ברירת מחדל `["לא משנה", "לא אכפת", "הכל", "כל אחד", "any", "n/a", "-"]`.
  - אקשנים: `addWildcard`, `removeWildcard`, `setWildcards`.
  - העלאת `version` ב-persist (v5 → v6) עם migrate שמזריק את ברירת המחדל.

### Scoring (`score.ts`)
- helper חדש `isWildcard(value, wildcards)`: trim + lowercase + השוואה לסט.
- ב-`scoreParam`:
  - לפני כל סוג: אם `cv` או `vv` הוא wildcard → להחזיר `null` (הפרמטר מודלג, לא נכנס לסכום המשוקלל בכלל). זה ייתן התנהגות עקבית בין כל הסוגים.
  - ב-`multi`: לסנן טוקנים שהם wildcard מתוך הסטים לפני חישוב החיתוך; אם אחד הצדדים ריק אחרי הסינון → `null`.
- חתימת הפונקציות תקבל גם `wildcards: Set<string>` דרך ה-`ScoreContext` (להוסיף `wildcards` ל-`ScoreContext` ולבנות אותו ב-`buildContext`). זה ימנע שינוי חתימות בקריאות חיצוניות.

### Validation (`normalize.ts`)
- ב-`validateDatasets`: לדלג על טוקנים שזוהו כ-wildcard לפני בדיקת `allowed.has(...)`. כלומר "לא משנה" לא ייחשב ערך לא תקני.
- לקבל את רשימת ה-wildcards כפרמטר, ולהזרים מהסטור (`validationIssues` שבסטור).

### UI — `AdvancedSettingsPanel.tsx`
- סקציה חדשה בראש הטאב: **"ערכים גנריים (Wildcards)"**.
- רשימת badges עם כפתור הסרה לכל אחד + Input + כפתור "הוסף".
- מלל הסבר קצר: "ערכים אלה ייחשבו כ'כל ערך מתאים' בכל הפרמטרים ולא יורידו את הציון."

---

## 2) "ילד מועדף" — בונוס רך

### Types
- להוסיף ל-`ParamType` ערך חדש: `"preferredName"`.
  - סמנטיקה: עמודה בצד **המתנדב** שמכילה שם/שמות של ילדים מועדפים. אם הילד המוערך מופיע ברשימה → בונוס.
- ב-`Parameter`: שדה אופציונלי `bonusValue?: number` (ברירת מחדל 15 נקודות) — כמה להוסיף לציון הסופי.

### Mapping
- פרמטר `preferredName` משתמש רק ב-`volunteerCol` (העמודה עם השם/שמות המועדפים). הצד-ילד נלקח אוטומטית מהפרמטר שמסומן כ-`type: "name"` (כבר קיים).
- אם אין פרמטר `name` מוגדר → הפרמטר לא פעיל ומציג אזהרה ב-UI.

### Scoring (`score.ts`)
- `scoreParam` לא יטפל ב-`preferredName` (יחזיר `null`) — זה לא נכנס לציון המשוקלל הרגיל.
- ב-`scorePair`, אחרי חישוב הציון הבסיסי `base` (0-100):
  - לאתר פרמטרי `preferredName` שמופעלים (`enabled !== false`).
  - לקרוא את שם הילד מעמודת ה-`name`, ואת רשימת השמות המועדפים מ-`volunteer[volunteerCol]` (split לפי `,`/`;`/`|`, trim, lowercase).
  - אם יש התאמה: `final = min(100, base + bonusValue)`.
  - אחרת: `final = base`.
- `scoreBreakdown` יחזיר גם רשומה לפרמטר ה-`preferredName` עם `value: 0|1` כדי שה-tooltip יציג "בקשה אישית: התקבלה ✓ / לא".

### UI
- `AdvancedSettingsPanel.tsx`: הסוג `preferredName` יופיע ברשימת ה-datalist של ה-type. כשמוגדר, יוצג שדה מספרי קטן "בונוס (נק')" במקום "משקל" (או בנוסף).
- `MappingPanel.tsx`: עבור פרמטר `preferredName` נסתיר את עמודת ה-child (או נציג "אוטומטי: עמודת השם של הילד").
- `MatchingBoard.tsx`: ב-tooltip של הציון להוסיף שורה: "בקשת מתנדב לילד X — התקבלה" כשרלוונטי.

---

## פרטים טכניים
- כל הלוגיקה נשארת בצד הלקוח, אין שינויים ב-backend.
- bump persist `version` עם migrate שמוסיף `wildcards` ושומר על פרמטרים קיימים.
- אין שבירת חוזה: פונקציות חיצוניות (`autoMatch`, `bestVolunteersFor`) נשארות עם אותה חתימה; ה-store מזרים את `wildcards` פנימה דרך `ScoreContext`.

## קבצים שיתעדכנו
- `src/lib/matching/types.ts`
- `src/lib/matching/store.ts`
- `src/lib/matching/score.ts`
- `src/lib/matching/normalize.ts`
- `src/components/matching/AdvancedSettingsPanel.tsx`
- `src/components/matching/MappingPanel.tsx`
- `src/components/matching/MatchingBoard.tsx` (טולטיפ בלבד)
