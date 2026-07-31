# دليل التسليم السريع

## ابدأ كالتالي

1. ارفع مجلد الوثائق كاملًا إلى مستودع المشروع.
2. أعطِ Claude ملف `prompts/CLAUDE_MASTER_PROMPT.md` واطلب منه قراءة `00_README.md` ثم تنفيذ `prompts/FIRST_CLAUDE_TASK.md`.
3. راجع قرارات Claude، خصوصًا الأسئلة المفتوحة ونموذج الحسابات.
4. بعد اعتماد الأساس، أعطِ Codex ملف `prompts/CODEX_MASTER_PROMPT.md` ثم `prompts/FIRST_CODEX_TASK.md`.
5. لا تطلب من Codex بناء المنصة كلها في Prompt واحد؛ استخدم قصة واحدة أو Vertical Slice واحدة في كل مرة.
6. اجعل Claude يراجع كل Pull Request قبل الدمج.

## أهم ملفاتك

- `product/03_PRD_MVP.md`: المنتج المطلوب فعليًا
- `product/07_FUNCTIONAL_REQUIREMENTS.md`: متطلبات مرقمة
- `architecture/01_SYSTEM_ARCHITECTURE.md`: المعمارية
- `architecture/04_CALCULATION_RULES.md`: قواعد الحساب
- `schemas/database_schema.sql`: قاعدة البيانات الأولية
- `schemas/openapi.yaml`: عقد الـAPI
- `delivery/01_RELEASE_PLAN_AND_BACKLOG.md`: ترتيب التنفيذ
- `prompts/CLAUDE_MASTER_PROMPT.md`: دور Claude
- `prompts/CODEX_MASTER_PROMPT.md`: دور Codex

## نقطة مهمة

الحزمة تحدد MVP قوي، لكنها لا تلغي مقابلات العملاء. قبل تثبيت الحسابات النهائية، اجمع نماذج حقيقية من مستخلصات وعقود ومقاولي MEP وتشطيبات من السعودية والإمارات ومصر، لأن قواعد الخصم والاحتجاز والضريبة تختلف من عقد لآخر.
