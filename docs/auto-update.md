# Spolehlivé automatické aktualizace dat (externí cron)

## Proč

Data (rozpis, skóre, tabulky, detaily, zprávy) aktualizuje GitHub Actions workflow
[`update-data.yml`](../.github/workflows/update-data.yml): stáhne čerstvá data z TheSportsDB
a commitne změny do `public/data/**`. Vercel pak sám re-deployne.

Workflow má i vlastní plánovač (`schedule: cron */10`), **ale plánované GitHub Actions
jsou „best-effort"** — GitHub je u kulatých časů běžně zpožďuje o 15–45 min nebo úplně
zahazuje (hlavně ve špičce). Pro appku s živými zápasy to nestačí: stalo se, že zápas
začal ve 21:00 a žádný plánovaný běh ho přes 5 hodin nezachytil.

Řešení: **externí cron služba** (zdarma) volá GitHub API a workflow spouští sama —
externí crony jsou přesné, na rozdíl od interního GitHub plánovače.

## ⚠️ Limit minut (důležité, repo je privátní)

Privátní repo má **2000 GitHub Actions minut/měsíc zdarma**. Jeden běh ≈ 1–1,5 min.
- Běh každých 5 min 24/7 = ~6500 min/měsíc → **překročí** free tier (placené nebo se zastaví).

Dvě cesty, jak se vejít:

### Cesta A (doporučeno): repo nastavit jako **veřejné** → běh každých 5 min
Veřejné repo má **Actions minuty zdarma bez limitu**. Pak může cron běžet každých 5 min
non-stop a je to vyřešené úplně. Navíc to odstraní i Deployment Protection problém
(půjde sdílet live URL). V kódu nejsou žádná tajemství — premium klíč je uložený jako
GitHub *Secret*, ne v kódu, a `.env.local` je v `.gitignore`.
→ GitHub: **Settings → General → Danger Zone → Change repository visibility → Public**.

### Cesta B: nechat privátní → cron každých 10 min jen ve večerním okně
Aby se to vešlo do 2000 min, omez cron na hodiny, kdy se hrají zápasy
(např. **17:00–00:00**), interval **10 min** → ~42 běhů/den ≈ ~1900 min/měsíc.
Granularita 10 min během zápasů (horší než 5 min, ale spolehlivé).

## Nastavení cron-job.org (zdarma)

### 1) Vytvoř GitHub token (fine-grained PAT)
GitHub → **Settings → Developer settings → Fine-grained tokens → Generate new token**:
- **Repository access:** Only select repositories → `tomasrobovsky-web/ms-fotbal-2026`
- **Permissions → Repository permissions → Actions:** **Read and write**
- Expiration: dle uvážení (např. 1 rok). Token zkopíruj (uvidíš ho jen jednou).

### 2) Založ cronjob na https://cron-job.org (zdarma, registrace e-mailem)
**Create cronjob** s těmito hodnotami:

| Pole | Hodnota |
|------|---------|
| URL | `https://api.github.com/repos/tomasrobovsky-web/ms-fotbal-2026/actions/workflows/update-data.yml/dispatches` |
| Request method | **POST** |
| Schedule | každých 5 min (cesta A) / každých 10 min v 17–24 h (cesta B) |

**Advanced → Headers** (přidej tyto řádky):
```
Accept: application/vnd.github+json
Authorization: Bearer SEM_VLOZ_TOKEN
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

**Advanced → Request body** (POST data):
```json
{"ref":"main"}
```

Ulož. Úspěšné volání vrací **HTTP 204 No Content** (ověřeno).

### 3) Ověření
- cron-job.org → historie jobu by měla ukazovat status **204**.
- GitHub → záložka **Actions** → běhy „Update MS 2026 data" se objevují přesně podle
  intervalu (trigger `workflow_dispatch`).
- Po doběhnutí přibyde commit `chore(data): automatická aktualizace …` (jen když se data
  fakt změnila).

## Ruční spuštění (kdykoliv)
```bash
gh workflow run update-data.yml
# nebo přes API:
gh api -X POST repos/tomasrobovsky-web/ms-fotbal-2026/actions/workflows/update-data.yml/dispatches -f ref=main
```

## Pozn.
- Interní `schedule` cron ve workflow necháváme jako záložní (best-effort).
- Premium klíč musí být v repo jako secret `THESPORTSDB_KEY` (Settings → Secrets and
  variables → Actions) — bez něj CI stahuje ořezaná free data.
