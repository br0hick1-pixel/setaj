# پروکسی سرا — راهنمای ۲ دقیقه‌ای

## دیپلوی
1. این پوشه (`api/chat.js` + `package.json`) رو به یه ریپوی گیت‌هاب جدید پوش کن (یا مستقیم تو Vercel با CLI: `vercel deploy`).
2. تو Vercel، پروژه رو import کن از اون ریپو.
3. تو تنظیمات پروژه → **Environment Variables** این سه‌تا رو اضافه کن (فقط مقدار کلید، بدون کوتیشن):
   - `OPENAI_KEY_1`
   - `OPENAI_KEY_2`
   - `OPENAI_KEY_3`
4. Deploy بزن. آدرسی که می‌گیری چیزی شبیه اینه:
   `https://sera-proxy-xxxx.vercel.app/api/chat`

## وصل کردن به سرا
تو فایل `sera-2.html`، این خط رو پیدا کن:
```js
proxyUrl: "",
```
و آدرس بالا رو بذار توش:
```js
proxyUrl: "https://sera-proxy-xxxx.vercel.app/api/chat",
```
از همین لحظه، همه‌ی درخواست‌ها از پروکسی رد می‌شن و کلیدها دیگه تو کد سایت دیده نمی‌شن.

## نکته امنیتی مهم
تو `ALLOWED_ORIGINS` داخل `api/chat.js` آدرس دقیق سایتت (مثلا `https://username.github.io`) رو اضافه کن تا فقط سایت خودت بتونه از پروکسی استفاده کنه، نه هرکسی.

## کلیدهای قبلی
کلیدهایی که قبلاً تو چت پیست کردی رو حتماً از پنل OpenAI **Revoke** کن و کلید تازه بساز — همونا رو بذار تو Environment Variableها، نه کلید قدیمی.
