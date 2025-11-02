🔀 Git Workflow (Team Standard)


```
cd client
npm run dev
```
new terminal

```
cd server
npm run dev
```
Always pull latest changes before starting work:
```
git checkout main
git pull origin main
```
Create a feature branch:
```
git checkout -b your-feature-branch
```
Make changes → add → commit:
```
git add .
git commit -m "Describe your changes here"
```
Push branch to GitHub:
```
git push origin your-feature-branch
```
Open a Pull Request (PR) on GitHub
Go to the repo on GitHub.
Compare & create PR into main.
Wait for approval and merge.
After merging:
```
git checkout main
git pull origin main
git branch -d your-feature-branch              # delete local branch
git push origin --delete your-feature-branch   # delete remote branch
```

## Gettting started with Auth
When you pull "Devin" latest branch:
	1	Create a folder     server/
  keys/
	2  
	3	Ask them to go to the same Firebase Console (your shared project), → Settings → Service accounts → Generate new private key and download their own serviceAccount.json.
	4	Save it in server/keys/serviceAccount.json.
	5	Create server/.env file:
  GOOGLE_APPLICATION_CREDENTIALS=./keys/serviceAccount.json
	6	  
	7	Run:    cd server
	8	npm install
	9	npm run dev
	10	  
	11	They should see:    [firebaseAdmin] using service account file: /.../server/keys/serviceAccount.json
	12	API listening on http://localhost:3001
