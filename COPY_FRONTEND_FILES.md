# Frontend Files to Copy

The following files need to be copied from the root `src/` directory to `adsterra/src/`:

## Pages
- `src/app/adsterra/page.tsx` → `adsterra/src/app/adsterra/page.tsx`
- `src/app/adsterra/[runId]/page.tsx` → `adsterra/src/app/adsterra/[runId]/page.tsx`

## API Routes
- `src/app/api/adsterra/runs/route.ts` → `adsterra/src/app/api/adsterra/runs/route.ts`
- `src/app/api/adsterra/runs/[runId]/route.ts` → `adsterra/src/app/api/adsterra/runs/[runId]/route.ts`
- `src/app/api/adsterra/runs/[runId]/start/route.ts` → `adsterra/src/app/api/adsterra/runs/[runId]/start/route.ts`
- `src/app/api/adsterra/runs/[runId]/stop/route.ts` → `adsterra/src/app/api/adsterra/runs/[runId]/stop/route.ts`
- `src/app/api/adsterra/runs/[runId]/stats/route.ts` → `adsterra/src/app/api/adsterra/runs/[runId]/stats/route.ts`
- `src/app/api/adsterra/runs/[runId]/test-local/route.ts` → `adsterra/src/app/api/adsterra/runs/[runId]/test-local/route.ts`

## Library Files
- `src/lib/adsterraProfitConfigs.ts` → `adsterra/src/lib/adsterraProfitConfigs.ts`
- `src/lib/adsterra/concurrency-calculator.ts` → `adsterra/src/lib/adsterra/concurrency-calculator.ts`
- `src/lib/adsterra/distribution-calculator.ts` → `adsterra/src/lib/adsterra/distribution-calculator.ts`
- `src/lib/adsterra/create-jobs.ts` → `adsterra/src/lib/adsterra/create-jobs.ts`
- `src/lib/aws/adsterra-helpers.ts` → `adsterra/src/lib/aws/adsterra-helpers.ts`
- `src/lib/aws/dynamo.ts` → `adsterra/src/lib/aws/dynamo.ts`

## Types (Already Done)
- ✅ `src/types/adsterra.ts` → `adsterra/src/types/adsterra.ts`

## Quick Copy Command (PowerShell)
```powershell
# From the root AdsenseLoading directory
$files = @(
    "src/app/adsterra/page.tsx",
    "src/app/adsterra/[runId]/page.tsx",
    "src/app/api/adsterra/runs/route.ts",
    "src/app/api/adsterra/runs/[runId]/route.ts",
    "src/app/api/adsterra/runs/[runId]/start/route.ts",
    "src/app/api/adsterra/runs/[runId]/stop/route.ts",
    "src/app/api/adsterra/runs/[runId]/stats/route.ts",
    "src/app/api/adsterra/runs/[runId]/test-local/route.ts",
    "src/lib/adsterraProfitConfigs.ts",
    "src/lib/adsterra/concurrency-calculator.ts",
    "src/lib/adsterra/distribution-calculator.ts",
    "src/lib/adsterra/create-jobs.ts",
    "src/lib/aws/adsterra-helpers.ts",
    "src/lib/aws/dynamo.ts"
)

foreach ($file in $files) {
    $dest = "adsterra/$file"
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item $file $dest -Force
    Write-Host "Copied $file → $dest"
}
```

