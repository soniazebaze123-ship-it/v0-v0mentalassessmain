# Vercel Deployment Guide for v0-v0mentalassessmain

## ✅ GitHub Deployment Complete

Your code has been pushed to: **https://github.com/soniazebaze123-ship-it/v0-v0mentalassessmain**
Branch: `development` (latest commit: Phase 4 multimodal deferral + type fixes)

---

## 🚀 Deploying to Vercel

### Step 1: Connect GitHub to Vercel
1. Visit **https://vercel.com/new**
2. Click **"Continue with GitHub"**
3. Select repository: **v0-v0mentalassessmain**
4. Click **"Import"**

### Step 2: Configure Environment Variables in Vercel
In the Vercel import dialog, add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**Where to find these:**
- Login to **https://app.supabase.com**
- Select your project
- Go to **Settings → API**
- Copy the **Project URL** and **anon (public) key**

### Step 3: Deploy
1. Click **"Deploy"**
2. Vercel will automatically build and deploy
3. You'll get a live URL within 2-5 minutes

---

## 📋 Pre-Deployment Checklist

- ✅ Code committed to `development` branch
- ✅ Phase 4 multimodal deferred (not active)
- ✅ Type system fixed (compilation should pass)
- ✅ Phase 1-3 core modules ready

### Before Testing - IMPORTANT

You'll need to:

1. **Set up Supabase Database**
   - Run migration scripts from `scripts/` folder:
     ```
     psql -U postgres -h localhost -d postgres -f scripts/01-create-tables.sql
     psql -U postgres -h localhost -d postgres -f scripts/02-create-storage.sql
     psql -U postgres -h localhost -d postgres -f scripts/03-fix-storage-policies.sql
     ```

2. **Create Test Users**
   - Use phone number registration on the app
   - Register with test numbers: +1234567890, +0987654321

3. **Upload Test Audio Files**
   - Place audio files in `public/audio/` directory:
     - `moca_sentence_en.mp3`
     - `mmse_sentence_en.mp3`
     - etc.

---

## 🧪 Testing Checklist After Deployment

### Phase 1 Core Assessments
- [ ] **MMSE Assessment**
  - [ ] All 11 sections load
  - [ ] Scoring calculates correctly
  - [ ] Results display properly

- [ ] **MoCA Assessment**
  - [ ] Clock drawing accepts input
  - [ ] Trail making interactive
  - [ ] Education adjustment works

- [ ] **Sensory Screening**
  - [ ] Vision test displays properly
  - [ ] Hearing test (if audio works)
  - [ ] Olfactory images load

### Phase 1 UI/UX
- [ ] Login/Registration flow works
- [ ] Language switching works (EN/ZH/YUE/FR)
- [ ] Dark mode toggle works
- [ ] Dashboard displays completed assessments
- [ ] Risk profile displays correctly

### Performance
- [ ] Page load time < 3 seconds
- [ ] No 404 errors in console
- [ ] No JavaScript errors in console
- [ ] Responsive on mobile

### Data Persistence
- [ ] Assessment scores save to database
- [ ] User progress is preserved on page reload
- [ ] Assessment history shows completed tests

---

## 🚨 Troubleshooting

### Build Fails with Type Errors
- Ensure all `database.types.ts` imports are correct
- Check that missing UI components (switch.tsx, textarea.tsx) exist
- Verify `lib/mmse/mmse-service.ts` and `lib/moca/moca-service.ts` exist

### Environment Variables Not Found
- Double-check variable names in Vercel dashboard
- Must include `NEXT_PUBLIC_` prefix for client-side vars
- Redeploy after adding variables

### Assessment Questions Don't Display
- Check that language files load (language-context.tsx)
- Verify audio files exist in `public/audio/`
- Check browser console for errors

### Database Connection Fails
- Verify Supabase credentials are correct
- Check that RLS policies allow your user role
- Ensure migration scripts were run on Supabase

---

## 📊 Deployment Status

| Environment | Status | URL |
|-------------|--------|-----|
| GitHub | ✅ Pushed | https://github.com/soniazebaze123-ship-it/v0-v0mentalassessmain |
| Vercel | ⏳ Ready to deploy | https://vercel.com/new |
| Supabase | ✅ Required | app.supabase.com |

---

## 📝 Next Steps

1. **Immediate:** Deploy to Vercel using steps above
2. **Testing:** Run through Phase 1 test checklist
3. **Phase 4 Prep:** When ready, follow PHASE_4_MULTIMODAL_DEFERRAL.md

---

## 📞 Support

For questions:
- See: `PHASE_4_MULTIMODAL_DEFERRAL.md` - Multimodal deferral context
- See: `DEVELOPER_HANDOFF.md` - Integration guide
- See: `IMPLEMENTATION_ROADMAP.md` - 4-week sprint plan

---

**Deployment Date:** March 31, 2026  
**Version:** 0.1.0  
**Branch:** development  
**Status:** Ready for Vercel deployment ✅
