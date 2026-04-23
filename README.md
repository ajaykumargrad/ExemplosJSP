ExemplosJSP
===========

Exemplos de JSP


## If `mobile/` folder is missing after clone

This repository originally may not include the Expo app folder in older branches/forks.

Run from repo root:

```powershell
Get-ChildItem
```

If you do not see a `mobile` directory, use one of these options:

1. Checkout the branch/commit that contains `mobile/`.
2. Or bootstrap a new Expo app manually:

```powershell
npx create-expo-app mobile -t expo-template-blank-typescript
cd .\mobile
npm install
npm run start
```

Then copy/add the Supabase files and screens from the working branch.


## Git pull commands (Windows PowerShell)

Use these exact commands:

```powershell
cd "C:\Users\ADMIN\Documents\GitHub\ExemplosJSP"
Get-ChildItem .git

git remote -v
# if origin is missing, add it once:
# git remote add origin https://github.com/ajaykumargrad/ExemplosJSP.git

git checkout main
# or: git checkout master  (if your repo uses master)

git pull origin main
# or: git pull origin master
```

If `Get-ChildItem .git` fails, you are not inside the git repo folder.


## Fix: fatal "refusing to merge unrelated histories"

This happens when you run `git pull` inside a folder initialized from a different project history (for example a fresh Expo app) and then connect it to this repo.

### Recommended fix (cleanest)

```powershell
cd "C:\Users\ADMIN\Documents\GitHub"
Rename-Item .\Prunto .\Prunto_backup

git clone https://github.com/ajaykumargrad/ExemplosJSP.git Prunto
cd .\Prunto
```

### If you must keep existing folder (advanced)

```powershell
cd "C:\Users\ADMIN\Documents\GitHub\Prunto"
git init
git remote remove origin 2>$null
git remote add origin https://github.com/ajaykumargrad/ExemplosJSP.git
git fetch origin

git reset --hard origin/master
```

Avoid `--allow-unrelated-histories` here unless you intentionally want to merge two separate projects.


## Checkout the Codex mobile branch

If you want the branch with the Expo mobile scaffold, use:

```powershell
cd "C:\Users\ADMIN\Documents\GitHub"

# fresh clone directly on target branch
git clone -b codex/build-mobile-app-with-react-native-and-supabase https://github.com/ajaykumargrad/ExemplosJSP.git Prunto
cd .\Prunto

# verify branch
git branch --show-current

# go to mobile app
cd .\mobile
npm install
npm run start
```

If repo already exists locally:

```powershell
cd "C:\Users\ADMIN\Documents\GitHub\Prunto"
git fetch origin
git checkout codex/build-mobile-app-with-react-native-and-supabase
git pull origin codex/build-mobile-app-with-react-native-and-supabase
```


## Fix: npm ENOENT in `Prunto\mobile` after branch checkout

If `npm start` says it cannot find:

`C:\Users\ADMIN\Documents\GitHub\Prunto\mobile\package.json`

then your shell is likely one level deeper than expected.

Run these diagnostics:

```powershell
pwd
git rev-parse --show-toplevel
Get-ChildItem
Get-ChildItem -Recurse -Filter package.json
```

Then run npm from the directory that actually contains `package.json`.

Typical for this project:

```powershell
cd "C:\Users\ADMIN\Documents\GitHub\Prunto"
cd .\mobile
Get-ChildItem package.json
npm install
npm run start
```

Also remove accidental `>` in `cd` paths. Use:

```powershell
cd "C:\Users\ADMIN\Documents\GitHub\Prunto\mobile"
```

not:

```powershell
cd "C:\Users\ADMIN\Documents\GitHub\Prunto\mobile>"
```


## Check if branch changes are pushed to GitHub

Run this from your local repo:

```powershell
git checkout codex/build-mobile-app-with-react-native-and-supabase
git fetch origin
git status
git log --oneline -n 3
git log --oneline origin/codex/build-mobile-app-with-react-native-and-supabase -n 3
```

If local and `origin/...` latest commits match, changes are pushed.


## Fix: branch behind + npm ENOENT from repo root

If git says your branch is behind by commits, update first:

```powershell
cd "C:\Users\ADMIN\Documents\GitHub\Prunto"
git pull origin codex/build-mobile-app-with-react-native-and-supabase
```

Then run npm from the **mobile** app folder (not repo root):

```powershell
cd .\mobile
Get-ChildItem package.json
npm install
npm run start
```

Untracked local dev folders like `mobile/.expo/` and `mobile/node_modules/` are expected and should not be committed.


## Verify and upgrade Expo SDK to 54

If Expo Go shows SDK mismatch (device has SDK 54 but project says 53):

```powershell
cd "C:\Users\ADMIN\Documents\GitHub\Prunto\mobile"
node -p "require('./package.json').dependencies.expo"

npm install
npm run doctor
npm run start -- --clear
```

Expected Expo version output should start with `^54` or `~54`.


## Push changes to GitHub every time

I cannot push to your GitHub automatically from your local machine/account. You must run push locally.

Use this each time after commits:

```powershell
git add .
git commit -m "your message"
git push origin codex/build-mobile-app-with-react-native-and-supabase
```

Optional one-liner if you commit often:

```powershell
git push
```

(works when upstream is already set to the codex branch)
