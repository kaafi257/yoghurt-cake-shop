# Connecting Your Custom Domain on Vercel

This project is pre-configured for Vercel with `vercel.json` (includes SPA single-page routing rewrites, PWA asset caching, and security headers).

---

## Step 1: Push / Import to GitHub
1. Create a repository on [GitHub](https://github.com/new).
2. Push your project code to GitHub.

---

## Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** → **"Project"**.
3. Select your GitHub repository.
4. Vercel automatically detects the settings from `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. *(Optional)* In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy**.

---

## Step 3: Add Your Custom Domain in Vercel
1. Go to your project on Vercel → **Settings** → **Domains**.
2. Type your domain name (e.g. `yourbakery.com` or `app.yourbakery.com`) and click **Add**.
3. Select whether you want `www.yourbakery.com` to redirect to `yourbakery.com` (recommended).

---

## Step 4: Configure DNS Records at Your Domain Provider
Open your domain registrar (GoDaddy, Namecheap, Cloudflare, Hostinger, Google Domains, etc.) and add the DNS records specified below:

### Option A: For an Apex Domain (e.g. `yourbakery.com`)
| Type | Name / Host | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (or leave blank) | `76.76.21.21` | Auto (or 3600) |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto (or 3600) |

### Option B: For a Subdomain (e.g. `app.yourbakery.com` or `shop.yourbakery.com`)
| Type | Name / Host | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `app` (or `shop`) | `cname.vercel-dns.com.` | Auto (or 3600) |

---

## Step 5: Verification & SSL
* Vercel will automatically verify the DNS records (usually within 1–5 minutes).
* Vercel provisions an automatic free **SSL certificate** (HTTPS) for your domain.
* Once verified, your custom domain will display a green **Valid Configuration** checkmark.
