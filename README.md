# Khatt Capital — сайт

Статический сайт (HTML/CSS/vanilla JS, без сборки), RU/EN. Готов к деплою —
но **не опубликован**: домен, хостинг и активация подключаются основателем
вручную (у ассистента нет доступа к вашим учётным записям регистратора/хостинга).

## Перед публикацией — прочитать

`../DESIGN_SPEC.md` и `../../research/2026-07-12_khatt-capital-website-review.md`
(ревью sharia-advisor и lawyer + ваши решения по рискам, принятым сознательно).

## Структура

- `index.html`, `styles.css`, `script.js`, `assets/` — весь сайт, без зависимостей от сборки.
- `netlify.toml`, `vercel.json` — конфиги для двух самых быстрых вариантов хостинга.
- `CNAME` — файл для GitHub Pages с доменом `khattcapital.com` (используется только этим вариантом, для Netlify/Vercel не нужен, не мешает).

## Вариант 1 — Netlify (самый быстрый)

1. Зарегистрируйтесь/войдите на netlify.com.
2. "Add new site" → "Deploy manually" — перетащите папку `website/` целиком, либо подключите git-репозиторий, если запушите этот код на GitHub/GitLab.
3. Netlify сам подхватит `netlify.toml` (publish = ".", без команды сборки).
4. Domain settings → Add custom domain → `khattcapital.com` → следуйте инструкциям Netlify по DNS (обычно CNAME/ALIAS-запись у вашего регистратора).

## Вариант 2 — Vercel

1. `vercel.json` уже настроен (чистые URL, security-заголовки).
2. Импортируйте репозиторий на vercel.com или используйте Vercel CLI (`vercel deploy`) из этой папки.
3. Project Settings → Domains → добавить `khattcapital.com`, прописать DNS по инструкции Vercel.

## Вариант 3 — GitHub Pages

1. Запушьте содержимое этой папки в GitHub-репозиторий (ветка `main` или отдельная `gh-pages`).
2. Settings → Pages → Source: эта ветка, папка `/ (root)`.
3. Файл `CNAME` уже содержит `khattcapital.com` — GitHub Pages подхватит его автоматически.
4. У регистратора домена добавить A-записи на IP GitHub Pages (185.199.108.153 и т.д., см. текущую документацию GitHub Pages) или CNAME на `<username>.github.io`.

## Что нужно сделать до реальной публикации (не техническое, а бизнес-решение)

См. аддендум "Решения фаундера по итогам ревью" в
`../../research/2026-07-12_khatt-capital-website-review.md` — часть рисков
(реклама financing до получения юр. заключений, преждевременное заявление о
сертификации советом, бренд без TM-проверки) принята сознательно, не устранена
технически. Публикация = финальное решение основателя, не техническая кнопка.

## Локальная проверка перед деплоем

```
cd website
python3 -m http.server 8000
# открыть http://localhost:8000/index.html
```
