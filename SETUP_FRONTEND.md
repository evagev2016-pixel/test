# Setting Up Standalone Frontend in Adsterra Folder

## Step 1: Install Dependencies

```powershell
cd C:\adsterra\adsterra
npm install
```

## Step 2: Copy Frontend Files

You need to copy these files from the root `AdsenseLoading` project:

### From `src/app/adsterra/` → `src/app/adsterra/`
- `page.tsx`
- `[runId]/page.tsx`

### From `src/app/api/adsterra/` → `src/app/api/adsterra/`
- `runs/route.ts`
- `runs/[runId]/route.ts`
- `runs/[runId]/start/route.ts`
- `runs/[runId]/stop/route.ts`
- `runs/[runId]/stats/route.ts`
- `runs/[runId]/test-local/route.ts`

### From `src/lib/adsterra/` → `src/lib/adsterra/`
- `concurrency-calculator.ts`
- `create-jobs.ts`
- `distribution-calculator.ts`

### From `src/lib/` → `src/lib/`
- `adsterraProfitConfigs.ts`

### From `src/types/` → `src/types/`
- `adsterra.ts` (or create `index.ts` with the types)

### Create `src/app/layout.tsx` and `src/app/globals.css`

These are needed for Next.js to work.

## Step 3: Run

```powershell
npm run dev
```

This will start the frontend at `http://localhost:3000/adsterra`

